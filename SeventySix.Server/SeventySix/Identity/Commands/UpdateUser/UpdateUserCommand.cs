// <copyright file="UpdateUserCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to update an existing user.
/// </summary>
/// <param name="Request">The update user request.</param>
public record UpdateUserCommand(UpdateUserRequest Request);