// <copyright file="PermissionRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Read DTO for permission requests.
/// </summary>
/// <param name="Id">
/// The permission request unique identifier.
/// </param>
/// <param name="UserId">
/// The ID of the user who requested the permission.
/// </param>
/// <param name="Username">
/// The username of the requester.
/// </param>
/// <param name="RequestedRole">
/// The role being requested.
/// </param>
/// <param name="RequestMessage">
/// Optional message provided by the requester.
/// </param>
/// <param name="CreatedBy">
/// The system/user that created the request (audit information).
/// </param>
/// <param name="CreateDate">
/// Date and time when the request was created (UTC).
/// </param>
public record PermissionRequestDto(
	long Id,
	long UserId,
	string Username,
	string RequestedRole,
	string? RequestMessage,
	string CreatedBy,
	DateTime CreateDate);