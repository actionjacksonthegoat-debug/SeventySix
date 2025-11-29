// <copyright file="LoginRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Login request with username/email and password.
/// </summary>
/// <param name="UsernameOrEmail">Username or email address.</param>
/// <param name="Password">User's password.</param>
public record LoginRequest(
	string UsernameOrEmail,
	string Password);