// <copyright file="InitiatePasswordResetByEmailCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to initiate password reset by email (public endpoint).
/// </summary>
/// <remarks>
/// Uses silent success pattern to prevent email enumeration.
/// </remarks>
/// <param name="Email">The email address.</param>
public record InitiatePasswordResetByEmailCommand(
	string Email);