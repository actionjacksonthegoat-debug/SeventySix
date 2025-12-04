// <copyright file="AuditConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Constants;

/// <summary>
/// Audit user constants for the application.
/// Single source of truth for system audit user names (DRY).
/// </summary>
public static class AuditConstants
{
	/// <summary>System user for automated operations and migrations.</summary>
	public const string SystemUser = "System";
}