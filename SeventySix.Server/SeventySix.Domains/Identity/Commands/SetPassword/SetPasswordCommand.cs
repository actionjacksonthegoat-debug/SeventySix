// <copyright file="SetPasswordCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to set password using a reset token.
/// </summary>
/// <param name="Request">The set password request.</param>
/// <param name="ClientIp">The client IP address.</param>
public record SetPasswordCommand(SetPasswordRequest Request, string? ClientIp);