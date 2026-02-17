// <copyright file="OAuthLinkFlowData.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Data stored during an OAuth account linking flow.
/// Cached in FusionCache keyed by the OAuth state parameter.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID initiating the link.
/// </param>
/// <param name="CodeVerifier">
/// PKCE code verifier for the OAuth flow.
/// </param>
/// <param name="Provider">
/// The OAuth provider name being linked.
/// </param>
public sealed record OAuthLinkFlowData(
	long UserId,
	string CodeVerifier,
	string Provider);
