// <copyright file="InitiateRegistrationCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to initiate self-registration by sending verification email.
/// </summary>
/// <param name="Request">The registration initiation request.</param>
public record InitiateRegistrationCommand(InitiateRegistrationRequest Request);
