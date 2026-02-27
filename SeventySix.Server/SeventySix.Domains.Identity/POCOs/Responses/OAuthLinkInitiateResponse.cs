// <copyright file="OAuthLinkInitiateResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;

namespace SeventySix.Identity;

/// <summary>
/// Response from initiating an OAuth account linking flow.
/// </summary>
/// <param name="AuthorizationUrl">
/// The OAuth provider's authorization URL for the client to open in a popup.
/// </param>
[ExcludeFromCodeCoverage]
public sealed record OAuthLinkInitiateResponse(
	string AuthorizationUrl);