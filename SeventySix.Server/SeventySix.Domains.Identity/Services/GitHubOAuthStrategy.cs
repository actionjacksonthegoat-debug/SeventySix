// <copyright file="GitHubOAuthStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Headers;
using System.Text.Json;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// GitHub-specific OAuth strategy implementation.
/// Handles GitHub authorization URL construction, token exchange, and user info retrieval.
/// </summary>
/// <param name="httpClientFactory">
/// Factory for creating HttpClient instances.
/// </param>
public sealed class GitHubOAuthStrategy(
	IHttpClientFactory httpClientFactory) : IOAuthProviderStrategy
{
	/// <inheritdoc/>
	public string ProviderName => OAuthProviderConstants.GitHub;

	/// <inheritdoc/>
	public string BuildAuthorizationUrl(
		OAuthProviderSettings settings,
		string redirectUri,
		string state,
		string codeVerifier)
	{
		string codeChallenge =
			CryptoExtensions.ComputePkceCodeChallenge(codeVerifier);

		string url =
			$"{settings.AuthorizationEndpoint}"
			+ $"?client_id={Uri.EscapeDataString(settings.ClientId)}"
			+ $"&redirect_uri={Uri.EscapeDataString(redirectUri)}"
			+ $"&scope={Uri.EscapeDataString(settings.Scopes)}"
			+ $"&state={Uri.EscapeDataString(state)}"
			+ $"&code_challenge={Uri.EscapeDataString(codeChallenge)}"
			+ "&code_challenge_method=S256";

		return url;
	}

	/// <inheritdoc/>
	public async Task<string> ExchangeCodeForTokenAsync(
		OAuthProviderSettings settings,
		string code,
		string redirectUri,
		string codeVerifier,
		CancellationToken cancellationToken)
	{
		using HttpClient client =
			httpClientFactory.CreateClient();

		Dictionary<string, string> parameters =
			new()
			{
				["client_id"] = settings.ClientId,
				["client_secret"] = settings.ClientSecret,
				["code"] = code,
				["redirect_uri"] = redirectUri,
				["code_verifier"] = codeVerifier,
			};

		using FormUrlEncodedContent content =
			new(parameters);

		client.DefaultRequestHeaders.Accept.Add(
			new MediaTypeWithQualityHeaderValue(
				SeventySix.Shared.Constants.MediaTypeConstants.Json));

		HttpResponseMessage response =
			await client.PostAsync(
				settings.TokenEndpoint,
				content,
				cancellationToken);

		response.EnsureSuccessStatusCode();

		string json =
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		return doc.RootElement.GetProperty(OAuthProviderConstants.GitHubJsonProperties.AccessToken).GetString()
			?? throw new InvalidOperationException(
				OAuthProviderConstants.ErrorMessages.NoAccessTokenInResponse);
	}

	/// <inheritdoc/>
	public async Task<OAuthUserInfoResult> GetUserInfoAsync(
		string accessToken,
		CancellationToken cancellationToken)
	{
		using HttpClient client =
			httpClientFactory.CreateClient();

		client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue(
				OAuthProviderConstants.AuthScheme.Bearer,
				accessToken);

		client.DefaultRequestHeaders.UserAgent.Add(
			new ProductInfoHeaderValue(
				OAuthProviderConstants.UserAgent.ProductName,
				OAuthProviderConstants.UserAgent.ProductVersion));

		HttpResponseMessage response =
			await client.GetAsync(
				OAuthProviderConstants.Endpoints.GitHubUserApi,
				cancellationToken);

		response.EnsureSuccessStatusCode();

		string json =
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		JsonElement root =
			doc.RootElement;

		return new OAuthUserInfoResult(
			ProviderId: root.GetProperty(OAuthProviderConstants.GitHubJsonProperties.Id).GetInt64().ToString(),
			Login: root.GetProperty(OAuthProviderConstants.GitHubJsonProperties.Login).GetString() ?? "",
			Email: root.TryGetProperty(
				OAuthProviderConstants.GitHubJsonProperties.Email,
				out JsonElement emailElement)
				? emailElement.GetString()
				: null,
			FullName: root.TryGetProperty(
				OAuthProviderConstants.GitHubJsonProperties.Name,
				out JsonElement nameElement)
				? nameElement.GetString()
				: null,
			AvatarUrl: root.TryGetProperty(
				OAuthProviderConstants.GitHubJsonProperties.AvatarUrl,
				out JsonElement avatarElement)
				? avatarElement.GetString()
				: null);
	}
}