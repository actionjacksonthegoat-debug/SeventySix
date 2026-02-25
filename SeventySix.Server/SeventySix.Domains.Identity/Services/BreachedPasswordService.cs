// <copyright file="BreachedPasswordService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Service for checking passwords against known data breaches using HaveIBeenPwned k-Anonymity API.
/// Implements OWASP ASVS V2.1.7.
/// </summary>
/// <remarks>
/// <para>
/// Uses k-Anonymity model: Only first 5 characters of SHA-1 hash are sent to HIBP API.
/// API returns all hashes starting with those 5 characters, and we check locally.
/// </para>
/// <para>
/// Graceful degradation: On API timeout/error, fails open (allows password) with warning.
/// </para>
/// </remarks>
/// <param name="httpClientFactory">
/// Factory for creating HttpClient instances (named client: "HaveIBeenPwned").
/// </param>
/// <param name="authSettings">
/// Authentication settings containing breach check configuration.
/// </param>
/// <param name="logger">
/// Logger for recording breach check outcomes and errors.
/// </param>
public sealed class BreachedPasswordService(
	IHttpClientFactory httpClientFactory,
	IOptions<AuthSettings> authSettings,
	ILogger<BreachedPasswordService> logger) : IBreachedPasswordService
{
	/// <summary>
	/// HttpClient name for HaveIBeenPwned API calls.
	/// </summary>
	public const string HttpClientName = "HaveIBeenPwned";

	private const string HibpApiBaseUrl = "https://api.pwnedpasswords.com/range/";
	private const int HashPrefixLength = 5;

	/// <inheritdoc />
	public async Task<BreachCheckResult> CheckPasswordAsync(
		string password,
		CancellationToken cancellationToken)
	{
		BreachedPasswordSettings settings =
			authSettings.Value.BreachedPassword;

		// Early exit if breach checking is disabled
		if (!settings.Enabled)
		{
			return BreachCheckResult.NotBreached();
		}

		try
		{
			// Compute SHA-1 hash of password (HIBP requirement, not for storage)
			string sha1Hash =
				ComputeSha1Hash(password);

			// Split into prefix (sent to API) and suffix (checked locally)
			string hashPrefix =
				sha1Hash[..HashPrefixLength];
			string targetHashSuffix =
				sha1Hash[HashPrefixLength..];

			// Query HIBP API with k-Anonymity prefix
			int breachCount =
				await QueryHibpApiAsync(
					hashPrefix,
					targetHashSuffix,
					settings.ApiTimeoutMs,
					cancellationToken);

			// Check against minimum breach threshold
			if (breachCount >= settings.MinBreachCount)
			{
				logger.LogWarning(
					"Password found in {BreachCount} data breaches (threshold: {Threshold})",
					breachCount,
					settings.MinBreachCount);

				return BreachCheckResult.Breached(breachCount);
			}

			return BreachCheckResult.NotBreached();
		}
		catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
		{
			// Legitimate cancellation, rethrow
			throw;
		}
		catch (HttpRequestException exception)
		{
			// Graceful degradation: fail open on any error
			logger.LogWarning(
				exception,
				"Breach check failed, allowing password (graceful degradation)");

			return BreachCheckResult.CheckFailed();
		}
		catch (OperationCanceledException exception)
		{
			// Graceful degradation: fail open on any error
			logger.LogWarning(
				exception,
				"Breach check failed, allowing password (graceful degradation)");

			return BreachCheckResult.CheckFailed();
		}
	}

	/// <summary>
	/// Computes SHA-1 hash of password for HIBP API query.
	/// </summary>
	/// <param name="password">
	/// The plaintext password.
	/// </param>
	/// <returns>
	/// Uppercase hexadecimal SHA-1 hash.
	/// </returns>
	/// <remarks>
	/// SHA-1 is required by HIBP API, not used for password storage (Argon2 handles that).
	/// </remarks>
	private static string ComputeSha1Hash(string password)
	{
		byte[] hashBytes =
			SHA1.HashData(Encoding.UTF8.GetBytes(password));

		return Convert.ToHexString(hashBytes);
	}

	/// <summary>
	/// Queries the HaveIBeenPwned Passwords API using k-Anonymity model.
	/// </summary>
	/// <param name="hashPrefix">
	/// First 5 characters of SHA-1 hash (sent to API).
	/// </param>
	/// <param name="targetHashSuffix">
	/// Remaining characters of SHA-1 hash (matched locally).
	/// </param>
	/// <param name="timeoutMs">
	/// API call timeout in milliseconds.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Number of times password appeared in breaches, or 0 if not found.
	/// </returns>
	private async Task<int> QueryHibpApiAsync(
		string hashPrefix,
		string targetHashSuffix,
		int timeoutMs,
		CancellationToken cancellationToken)
	{
		using HttpClient httpClient =
			httpClientFactory.CreateClient(HttpClientName);

		httpClient.Timeout =
			TimeSpan.FromMilliseconds(timeoutMs);

		string requestUrl =
			$"{HibpApiBaseUrl}{hashPrefix}";

		using HttpResponseMessage apiResponse =
			await httpClient.GetAsync(
				requestUrl,
				cancellationToken);

		apiResponse.EnsureSuccessStatusCode();

		string responseContent =
			await apiResponse.Content.ReadAsStringAsync(cancellationToken);

		// Parse response: each line is "SUFFIX:COUNT"
		return ParseBreachCount(
			responseContent,
			targetHashSuffix);
	}

	/// <summary>
	/// Parses HIBP API response to find breach count for the target hash suffix.
	/// </summary>
	/// <param name="responseContent">
	/// Raw API response containing "SUFFIX:COUNT" lines.
	/// </param>
	/// <param name="targetHashSuffix">
	/// The hash suffix to search for (case-insensitive).
	/// </param>
	/// <returns>
	/// Number of breaches if found, otherwise 0.
	/// </returns>
	private static int ParseBreachCount(
		string responseContent,
		string targetHashSuffix)
	{
		// Response format: "SUFFIX:COUNT\r\n" for each matching hash
		ReadOnlySpan<char> contentSpan =
			responseContent.AsSpan();

		foreach (ReadOnlySpan<char> responseLine in contentSpan.EnumerateLines())
		{
			if (responseLine.IsEmpty)
			{
				continue;
			}

			int colonIndex =
				responseLine.IndexOf(':');

			if (colonIndex <= 0)
			{
				continue;
			}

			ReadOnlySpan<char> suffixSpan =
				responseLine[..colonIndex];

			if (suffixSpan.Equals(
				targetHashSuffix.AsSpan(),
				StringComparison.OrdinalIgnoreCase))
			{
				ReadOnlySpan<char> countSpan =
					responseLine[(colonIndex + 1)..];

				if (int.TryParse(
					countSpan,
					out int breachCount))
				{
					return breachCount;
				}
			}
		}

		return 0;
	}
}