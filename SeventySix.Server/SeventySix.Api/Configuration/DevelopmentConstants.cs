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
	public const string DefaultClientOrigin = "http://localhost:4200";

	/// <summary>
	/// Default API port for development.
	/// </summary>
	public const int DefaultApiPort = 5000;

	/// <summary>
	/// Default HTTPS API port for development.
	/// </summary>
	public const int DefaultHttpsApiPort = 5001;
}