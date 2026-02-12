// <copyright file="CustomClaimTypes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Custom JWT claim type names used in access tokens.
/// </summary>
public static class CustomClaimTypes
{
	/// <summary>
	/// Claim indicating the user must change their password before accessing the application.
	/// </summary>
	public const string RequiresPasswordChange = "requires_password_change";
}