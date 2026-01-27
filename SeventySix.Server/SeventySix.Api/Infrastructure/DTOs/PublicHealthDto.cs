// <copyright file="PublicHealthDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Minimal health status response for anonymous/public access.
/// </summary>
/// <remarks>
/// Exposes only overall system status without infrastructure details.
/// Use <see cref="HealthStatusResponse"/> for authenticated detailed information.
/// </remarks>
/// <param name="Status">
/// Health status: "Healthy", "Degraded", or "Unhealthy".
/// </param>
/// <param name="CheckedAt">
/// The timestamp when the health check was performed.
/// Nullable to support OpenAPI schema generation (DateTime.MinValue cannot be serialized).
/// </param>
public record PublicHealthDto(
	string Status = HealthStatusConstants.Healthy,
	DateTime? CheckedAt = null);