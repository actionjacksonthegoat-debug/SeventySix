// <copyright file="RegisterCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to register a new user with local credentials (direct registration).
/// </summary>
/// <param name="Request">Registration details.</param>
/// <param name="ClientIp">Client IP for token tracking.</param>
public record RegisterCommand(RegisterRequest Request, string? ClientIp);