// <copyright file="OAuthRedirectValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Validates OAuth authorization redirect URLs against configured provider endpoints.
/// Extracted from <c>OAuthController</c> for testability and to break CodeQL taint chains
/// (cs/web/unvalidated-url-redirection) at the redirect call site.
/// </summary>
public static class OAuthRedirectValidator
{
	/// <summary>
	/// Validates that the given URL's host matches the configured authorization endpoint host
	/// and returns the parsed <see cref="Uri"/> on success.
	/// </summary>
	/// <remarks>
	/// Returning <see cref="Uri"/> rather than <c>bool</c> allows the caller to use
	/// <c>validatedUri.AbsoluteUri</c> in the redirect response. Because the value passed
	/// to <c>Redirect()</c> is derived from a <see cref="Uri"/> property rather than the
	/// original user-supplied string, CodeQL's taint tracker cannot route user input directly
	/// to the redirect sink.
	/// </remarks>
	/// <param name="url">
	/// The authorization URL produced by the OAuth service.
	/// </param>
	/// <param name="providerSettings">
	/// The OAuth provider settings containing the expected authorization endpoint.
	/// </param>
	/// <returns>
	/// The parsed <see cref="Uri"/> when the host matches the configured endpoint;
	/// <c>null</c> when the URL is malformed, the endpoint is malformed, or the hosts do not match.
	/// </returns>
	public static Uri? GetValidatedUri(
		string url,
		OAuthProviderSettings providerSettings)
	{
		if (!Uri.TryCreate(
			url,
			UriKind.Absolute,
			out Uri? redirectUri))
		{
			return null;
		}

		if (!Uri.TryCreate(
			providerSettings.AuthorizationEndpoint,
			UriKind.Absolute,
			out Uri? allowedUri))
		{
			return null;
		}

		return string.Equals(
			redirectUri.Host,
			allowedUri!.Host,
			StringComparison.OrdinalIgnoreCase)
			? redirectUri
			: null;
	}
}