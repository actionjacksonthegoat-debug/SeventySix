// <copyright file="UnlinkExternalLoginCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to unlink an OAuth provider from a user account.
/// </summary>
/// <param name="UserId">
/// The user's ID.
/// </param>
/// <param name="Provider">
/// The OAuth provider name to unlink (e.g., "GitHub").
/// </param>
public sealed record UnlinkExternalLoginCommand(
	long UserId,
	string Provider);