// <copyright file="OAuthCodeExchangeRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to exchange an OAuth authorization code for tokens.
/// </summary>
/// <param name="Code">The one-time authorization code from OAuth callback.</param>
public record OAuthCodeExchangeRequest(string Code);