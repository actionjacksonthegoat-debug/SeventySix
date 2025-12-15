// <copyright file="LoginCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to authenticate a user with username/email and password.
/// </summary>
/// <param name="Request">Login credentials.</param>
/// <param name="ClientIp">Client IP for token tracking.</param>
public record LoginCommand(LoginRequest Request, string? ClientIp);
