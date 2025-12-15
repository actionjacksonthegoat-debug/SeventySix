// <copyright file="CreatePermissionRequestCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.CreatePermissionRequest;

/// <summary>Command to create permission requests for a user.</summary>
/// <param name="UserId">User requesting permissions.</param>
/// <param name="Username">Username of requester (for audit).</param>
/// <param name="Request">Permission request details.</param>
public record CreatePermissionRequestCommand(
	int UserId,
	string Username,
	CreatePermissionRequestDto Request);