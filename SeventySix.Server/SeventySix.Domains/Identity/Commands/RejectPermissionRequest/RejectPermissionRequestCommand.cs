// <copyright file="RejectPermissionRequestCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.RejectPermissionRequest;

/// <summary>
/// Command to reject a single permission request.
/// </summary>
/// <param name="RequestId">
/// The ID of the permission request to reject.
/// </param>
public sealed record RejectPermissionRequestCommand(int RequestId);