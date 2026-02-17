// <copyright file="OAuthUserInfo.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Standardized OAuth user information from any provider.
/// All providers map their response to this common model.
/// </summary>
/// <param name="ProviderId">
/// The user's unique ID from the provider.
/// </param>
/// <param name="Login">
/// The user's login/username from the provider.
/// </param>
/// <param name="Email">
/// The user's email address (null if not available/private).
/// </param>
/// <param name="FullName">
/// The user's display name (null if not set).
/// </param>
/// <param name="AvatarUrl">
/// The user's avatar/profile picture URL (null if not available).
/// </param>
public record OAuthUserInfo(
	string ProviderId,
	string Login,
	string? Email,
	string? FullName,
	string? AvatarUrl);
