// <copyright file="SchemaConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for database schema names.
/// </summary>
/// <remarks>
/// Each bounded context has its own schema for data isolation.
/// Note: Do NOT modify existing migrations to use these constants.
/// Migrations are immutable snapshots.
/// </remarks>
public static class SchemaConstants
{
	/// <summary>
	/// Schema for Identity bounded context (users, roles, authentication).
	/// </summary>
	public const string Identity = "Identity";

	/// <summary>
	/// Schema for Logging bounded context (application logs).
	/// </summary>
	public const string Logging = "Logging";

	/// <summary>
	/// Schema for API Tracking bounded context (third-party API usage).
	/// </summary>
	public const string ApiTracking = "ApiTracking";

	/// <summary>
	/// Schema for Electronic Notifications bounded context (email queue, etc.).
	/// </summary>
	public const string ElectronicNotifications = "ElectronicNotifications";
}