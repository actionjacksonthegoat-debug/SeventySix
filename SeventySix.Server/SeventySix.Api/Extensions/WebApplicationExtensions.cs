// <copyright file="WebApplicationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for WebApplication pipeline configuration.
/// </summary>
/// <remarks>
/// The implementation is split across partial files by concern:
/// <list type="bullet">
/// <item><description><c>WebApplicationExtensions.Migrations.cs</c> — database migration + diagnostics.</description></item>
/// <item><description><c>WebApplicationExtensions.Dependencies.cs</c> — startup dependency validation.</description></item>
/// <item><description><c>WebApplicationExtensions.ForwardedHeaders.cs</c> — reverse-proxy forwarded headers.</description></item>
/// <item><description><c>WebApplicationExtensions.HealthChecks.cs</c> — liveness/readiness endpoints.</description></item>
/// </list>
/// </remarks>
public static partial class WebApplicationExtensions
{
}