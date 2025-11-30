// <copyright file="PermissionRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Read DTO for permission requests.</summary>
public record PermissionRequestDto(
	int Id,
	int UserId,
	string Username,
	string RequestedRole,
	string? RequestMessage,
	string CreatedBy,
	DateTime CreateDate);
