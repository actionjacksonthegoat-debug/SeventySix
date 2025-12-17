// <copyright file="BulkUpdateActiveStatusCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to bulk update active status for multiple users.
/// </summary>
/// <param name="UserIds">The user IDs to update.</param>
/// <param name="IsActive">The new active status.</param>
/// <param name="ModifiedBy">Username of the person modifying the users.</param>
public record BulkUpdateActiveStatusCommand(
	IEnumerable<int> UserIds,
	bool IsActive,
	string ModifiedBy);