// <copyright file="InitiatePasswordResetCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to initiate a password reset.
/// </summary>
/// <param name="UserId">
/// The user ID.
/// </param>
/// <param name="IsNewUser">
/// Whether this is a new user (sends welcome email vs reset email).
/// </param>
public record InitiatePasswordResetCommand(int UserId, bool IsNewUser);