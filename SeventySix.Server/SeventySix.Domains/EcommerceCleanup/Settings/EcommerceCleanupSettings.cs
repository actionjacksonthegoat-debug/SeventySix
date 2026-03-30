// <copyright file="EcommerceCleanupSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.EcommerceCleanup.Settings;

/// <summary>
/// Root configuration settings for ecommerce cleanup background jobs.
/// Controls cleanup of abandoned cart sessions across SvelteKit and TanStack ecommerce databases.
/// </summary>
public sealed record EcommerceCleanupSettings
{
	/// <summary>
	/// The configuration section name for ecommerce cleanup settings.
	/// </summary>
	public const string SectionName = "EcommerceCleanup";

	/// <summary>
	/// Gets whether ecommerce cleanup jobs are enabled.
	/// When disabled, no cleanup operations run against ecommerce databases.
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets the cart session cleanup sub-settings.
	/// </summary>
	public CartSessionCleanupSettings CartSessions { get; init; } = new();

	/// <summary>
	/// Gets the connection string for the SvelteKit ecommerce database.
	/// </summary>
	public string SvelteKitConnectionString { get; init; } = string.Empty;

	/// <summary>
	/// Gets the connection string for the TanStack ecommerce database.
	/// </summary>
	public string TanStackConnectionString { get; init; } = string.Empty;
}