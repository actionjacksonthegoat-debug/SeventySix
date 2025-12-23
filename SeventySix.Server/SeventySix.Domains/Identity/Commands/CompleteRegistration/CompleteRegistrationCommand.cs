// <copyright file="CompleteRegistrationCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to complete registration after email verification.
/// </summary>
/// <param name="Request">
/// The registration completion request.
/// </param>
/// <param name="ClientIp">
/// Client IP for token tracking.
/// </param>
public record CompleteRegistrationCommand(
	CompleteRegistrationRequest Request,
	string? ClientIp);