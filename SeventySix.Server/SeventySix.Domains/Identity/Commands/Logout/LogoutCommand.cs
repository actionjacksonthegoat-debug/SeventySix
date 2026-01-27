// <copyright file="LogoutCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to logout a user by revoking their refresh token.
/// </summary>
/// <param name="RefreshToken">
/// The refresh token to revoke.
/// </param>
public record LogoutCommand(string RefreshToken);