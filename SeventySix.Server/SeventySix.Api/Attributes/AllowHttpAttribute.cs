// <copyright file="AllowHttpAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Attributes;

/// <summary>
/// Marks an endpoint as allowed to receive plain HTTP requests without HTTPS redirection.
/// Applied to infrastructure endpoints (health checks, metrics) that must be accessible
/// via HTTP for container health probes and observability scrapers.
/// </summary>
[AttributeUsage(
	AttributeTargets.Method | AttributeTargets.Class,
	AllowMultiple = false,
	Inherited = false)]
public sealed class AllowHttpAttribute : Attribute;