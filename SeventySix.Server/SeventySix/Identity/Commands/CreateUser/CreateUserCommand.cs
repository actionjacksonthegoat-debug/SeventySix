// <copyright file="CreateUserCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to create a new user.
/// </summary>
/// <param name="Request">The create user request.</param>
public record CreateUserCommand(CreateUserRequest Request);
