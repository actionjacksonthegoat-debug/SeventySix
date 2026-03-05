// <copyright file="VerifyAdminSessionQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Query to verify that a refresh token belongs to an active admin user.
/// Used by nginx auth_request to protect observability endpoints (Grafana, Jaeger, Prometheus).
/// </summary>
/// <param name="RefreshToken">
/// The plaintext refresh token from the HttpOnly cookie.
/// </param>
public sealed record VerifyAdminSessionQuery(string RefreshToken);