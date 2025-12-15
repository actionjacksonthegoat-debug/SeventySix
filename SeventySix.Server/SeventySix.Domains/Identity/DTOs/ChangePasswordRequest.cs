// <copyright file="ChangePasswordRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to change user's password.
/// </summary>
/// <param name="CurrentPassword">Current password (required if user has password).</param>
/// <param name="NewPassword">New password.</param>
public record ChangePasswordRequest(
	string? CurrentPassword,
	string NewPassword);