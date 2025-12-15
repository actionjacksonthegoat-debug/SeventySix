// <copyright file="CreatePermissionRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Request DTO for creating permission requests.</summary>
public record CreatePermissionRequestDto(
	IReadOnlyList<string> RequestedRoles,
	string? RequestMessage = null);