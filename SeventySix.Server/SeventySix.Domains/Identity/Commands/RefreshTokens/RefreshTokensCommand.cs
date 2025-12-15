// <copyright file="RefreshTokensCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to exchange a refresh token for new access and refresh tokens.
/// </summary>
/// <param name="RefreshToken">The current refresh token.</param>
/// <param name="ClientIp">Client IP for token tracking.</param>
public record RefreshTokensCommand(string RefreshToken, string? ClientIp);
