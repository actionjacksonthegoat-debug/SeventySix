// <copyright file="InitiateRegistrationRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request to start email-verified registration.
/// </summary>
/// <param name="Email">
/// The email address to verify and register.
/// </param>
public record InitiateRegistrationRequest(string Email);