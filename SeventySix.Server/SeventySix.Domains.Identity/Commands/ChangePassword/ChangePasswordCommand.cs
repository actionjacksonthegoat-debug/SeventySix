// <copyright file="ChangePasswordCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to change a user's password.
/// </summary>
/// <param name="UserId">
/// The user ID.
/// </param>
/// <param name="Request">
/// The change password request.
/// </param>
public record ChangePasswordCommand(long UserId, ChangePasswordRequest Request);