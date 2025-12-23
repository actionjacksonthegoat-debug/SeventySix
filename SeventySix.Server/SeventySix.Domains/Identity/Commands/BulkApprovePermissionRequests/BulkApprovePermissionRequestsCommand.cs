// <copyright file="BulkApprovePermissionRequestsCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.BulkApprovePermissionRequests;

/// <summary>
/// Command to approve multiple permission requests in bulk.
/// </summary>
/// <param name="RequestIds">
/// The IDs of permission requests to approve.
/// </param>
public sealed record BulkApprovePermissionRequestsCommand(
	IEnumerable<int> RequestIds);