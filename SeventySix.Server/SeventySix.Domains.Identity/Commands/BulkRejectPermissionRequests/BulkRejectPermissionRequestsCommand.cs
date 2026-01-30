// <copyright file="BulkRejectPermissionRequestsCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.BulkRejectPermissionRequests;

/// <summary>
/// Command to reject multiple permission requests in bulk.
/// </summary>
/// <param name="RequestIds">
/// The IDs of permission requests to reject.
/// </param>
public sealed record BulkRejectPermissionRequestsCommand(
	IEnumerable<long> RequestIds);