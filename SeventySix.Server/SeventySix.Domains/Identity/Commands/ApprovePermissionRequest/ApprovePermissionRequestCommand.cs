// <copyright file="ApprovePermissionRequestCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.ApprovePermissionRequest;

/// <summary>
/// Command to approve a single permission request.
/// </summary>
/// <param name="RequestId">The ID of the permission request to approve.</param>
public sealed record ApprovePermissionRequestCommand(int RequestId);