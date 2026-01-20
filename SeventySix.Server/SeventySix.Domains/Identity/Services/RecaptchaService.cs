// <copyright file="RecaptchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity;

/// <summary>
/// Service for validating reCAPTCHA v3 tokens against Google's API.
/// </summary>
/// <remarks>
/// Integrates with ThirdPartyApiRequests for rate limiting with monthly intervals.
/// </remarks>
public class RecaptchaService(
	HttpClient httpClient,
	IRateLimitingService rateLimitingService,
	IOptions<RecaptchaSettings> recaptchaSettings,
	IOptions<ThirdPartyApiLimitSettings> limitSettings,
	ILogger<RecaptchaService> logger) : IRecaptchaService
{
	/// <inheritdoc/>
	public bool IsEnabled =>
		recaptchaSettings.Value.Enabled;

	/// <inheritdoc/>
	public async Task<RecaptchaValidationResult> ValidateAsync(
		string token,
		string expectedAction,
		CancellationToken cancellationToken = default)
	{
		// Check if reCAPTCHA is disabled
		if (!recaptchaSettings.Value.Enabled)
		{
			logger.LogInformation(
				"reCAPTCHA validation bypassed (disabled in settings)");
			return RecaptchaValidationResult.Bypassed();
		}

		// Validate input
		if (string.IsNullOrWhiteSpace(token))
		{
			logger.LogWarning("reCAPTCHA token is missing or empty");
			return RecaptchaValidationResult.Failed(["missing-input-response"]);
		}

		// Get interval from settings (Monthly for reCAPTCHA)
		LimitInterval interval =
			limitSettings.Value.GetLimitInterval(ExternalApiConstants.GoogleRecaptcha);

		// Check rate limit before making external call
		bool canMakeRequest =
			await rateLimitingService.CanMakeRequestAsync(
				ExternalApiConstants.GoogleRecaptcha,
				interval,
				cancellationToken);

		if (!canMakeRequest)
		{
			logger.LogWarning(
				"reCAPTCHA rate limit exceeded for {Interval} quota",
				interval);
			return RecaptchaValidationResult.Failed(["rate-limit-exceeded"]);
		}

		try
		{
			// Build form content for Google API
			FormUrlEncodedContent formContent =
				new(
				[
					new KeyValuePair<string, string>(
						"secret",
						recaptchaSettings.Value.SecretKey),
					new KeyValuePair<string, string>(
						"response",
						token)
				]);

			// Call Google verification API
			HttpResponseMessage httpResponse =
				await httpClient.PostAsync(
					recaptchaSettings.Value.VerifyUrl,
					formContent,
					cancellationToken);

			httpResponse.EnsureSuccessStatusCode();

			// Track the API call
			await rateLimitingService.TryIncrementRequestCountAsync(
				ExternalApiConstants.GoogleRecaptcha,
				recaptchaSettings.Value.VerifyUrl,
				cancellationToken);

			// Deserialize response
			RecaptchaVerifyResponse? verifyResponse =
				await httpResponse.Content.ReadFromJsonAsync<RecaptchaVerifyResponse>(
					cancellationToken);

			if (verifyResponse is null)
			{
				logger.LogError("Failed to deserialize reCAPTCHA response");
				return RecaptchaValidationResult.Failed(["invalid-response"]);
			}

			// Validate response
			return ValidateResponse(
				verifyResponse,
				expectedAction);
		}
		catch (HttpRequestException httpException)
		{
			logger.LogError(
				httpException,
				"reCAPTCHA verification failed: Network error");
			return RecaptchaValidationResult.Failed(["network-error"]);
		}
		catch (TaskCanceledException)
		{
			logger.LogWarning("reCAPTCHA verification timed out");
			return RecaptchaValidationResult.Failed(["timeout"]);
		}
	}

	/// <summary>
	/// Validates the response from Google's verification API.
	/// </summary>
	/// <param name="response">
	/// The deserialized Google response.
	/// </param>
	/// <param name="expectedAction">
	/// The expected action name.
	/// </param>
	/// <returns>
	/// A validation result based on the response.
	/// </returns>
	private RecaptchaValidationResult ValidateResponse(
		RecaptchaVerifyResponse response,
		string expectedAction)
	{
		// Check if Google says it's valid
		if (!response.Success)
		{
			logger.LogWarning(
				"reCAPTCHA validation failed: {ErrorCodes}",
				string.Join(
					", ",
					response.ErrorCodes ?? []));
			return RecaptchaValidationResult.Failed(
				response.ErrorCodes?.AsReadOnly() ?? []);
		}

		// Check action matches
		if (!string.Equals(
			response.Action,
			expectedAction,
			StringComparison.OrdinalIgnoreCase))
		{
			logger.LogWarning(
				"reCAPTCHA action mismatch: Expected={Expected}, Actual={Actual}",
				expectedAction,
				response.Action);
			return RecaptchaValidationResult.Failed(["action-mismatch"]);
		}

		// Check score threshold
		if (response.Score < recaptchaSettings.Value.MinimumScore)
		{
			logger.LogWarning(
				"reCAPTCHA score below threshold: Score={Score}, Threshold={Threshold}, Action={Action}",
				response.Score,
				recaptchaSettings.Value.MinimumScore,
				response.Action);
			return RecaptchaValidationResult.Failed(["score-below-threshold"]);
		}

		logger.LogInformation(
			"reCAPTCHA validated: Action={Action}, Score={Score}",
			response.Action,
			response.Score);

		return RecaptchaValidationResult.Succeeded(
			response.Score,
			response.Action);
	}
}