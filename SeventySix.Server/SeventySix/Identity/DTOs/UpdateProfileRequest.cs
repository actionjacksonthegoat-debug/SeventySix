// <copyright file="UpdateProfileRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to update current user's profile.
/// </summary>
/// <param name="Email">New email address.</param>
/// <param name="FullName">New full name (optional).</param>
public record UpdateProfileRequest(
	string Email,
	string? FullName);
