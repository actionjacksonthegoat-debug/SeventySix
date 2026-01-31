// <copyright file="DevelopmentConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Constants for development environment configuration.
/// Single source of truth for development defaults (DRY).
/// </summary>
public static class DevelopmentConstants
{
	/// <summary>
	/// Default client application origin for development.
	/// </summary>
	public const string DefaultClientOrigin = "https://localhost:4200";
}