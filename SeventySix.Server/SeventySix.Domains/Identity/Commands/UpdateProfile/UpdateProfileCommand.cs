// <copyright file="UpdateProfileCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to update the current user's profile (self-service).
/// </summary>
/// <param name="UserId">
/// The user ID.
/// </param>
/// <param name="Request">
/// The update profile request.
/// </param>
public record UpdateProfileCommand(long UserId, UpdateProfileRequest Request);