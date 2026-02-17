// <copyright file="LinkExternalLoginCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to link an external OAuth provider to an existing user account.
/// </summary>
/// <param name="UserId">
/// The authenticated user's ID.
/// </param>
/// <param name="Provider">
/// The OAuth provider name (e.g., "GitHub").
/// </param>
/// <param name="ProviderUserId">
/// The user's unique ID from the OAuth provider.
/// </param>
/// <param name="FullName">
/// The user's display name from the OAuth provider (optional).
/// </param>
public record LinkExternalLoginCommand(
	long UserId,
	string Provider,
	string ProviderUserId,
	string? FullName);
