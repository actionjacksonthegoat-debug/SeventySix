// <copyright file="AuthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication response with access token.
/// </summary>
/// <param name="AccessToken">JWT access token.</param>
/// <param name="ExpiresAt">Token expiration time.</param>
/// <param name="RequiresPasswordChange">Whether user must change password before using the app.</param>
public record AuthResponse(
	string AccessToken,
	DateTime ExpiresAt,
	bool RequiresPasswordChange = false);