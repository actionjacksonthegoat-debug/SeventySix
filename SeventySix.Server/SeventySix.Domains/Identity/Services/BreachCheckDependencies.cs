// <copyright file="BreachCheckDependencies.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Groups breach-check dependencies for cleaner handler signatures (max 6 params).
/// Injected by Wolverine DI as a compound parameter.
/// </summary>
/// <param name="Service">
/// The breach password checking service.
/// </param>
/// <param name="Settings">
/// Authentication settings containing breach check configuration.
/// </param>
public sealed record BreachCheckDependencies(
	IBreachedPasswordService Service,
	IOptions<AuthSettings> Settings);