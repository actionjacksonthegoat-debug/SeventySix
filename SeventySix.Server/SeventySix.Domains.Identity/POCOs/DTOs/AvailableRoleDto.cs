// <copyright file="AvailableRoleDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using MemoryPack;
using SeventySix.Shared.Interfaces;

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
[MemoryPackable]
public partial record AvailableRoleDto(string Name, string Description) : ICacheable;