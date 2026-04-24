// <copyright file="IssuedAccessToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Represents a freshly-issued JWT access token with its expiration time.
/// </summary>
/// <remarks>
/// Returned by <see cref="ITokenService.IssueAccessTokenAsync"/> and consumed by callers
/// that assemble the final <see cref="AuthResult"/>. Deliberately minimal — only the
/// token string and expiration are needed at this layer; PII (email, fullName) is
/// carried by the <see cref="ApplicationUser"/> the caller already holds.
/// </remarks>
/// <param name="Token">
/// The signed JWT access token string.
/// </param>
/// <param name="ExpiresAt">
/// The UTC instant at which the access token expires.
/// </param>
public record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);