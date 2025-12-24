// <copyright file="AvailableRoleDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// DTO for available requestable roles.
/// </summary>
/// <param name="Name">
/// The role name.
/// </param>
/// <param name="Description">
/// The role description shown to admins and users.
/// </param>
public record AvailableRoleDto(string Name, string Description);