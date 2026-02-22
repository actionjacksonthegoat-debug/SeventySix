// <copyright file="ExternalLoginDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// DTO for external login provider information.
/// </summary>
/// <param name="Provider">
/// The provider name (e.g., "GitHub").
/// </param>
/// <param name="ProviderDisplayName">
/// The display name of the provider.
/// </param>
public record ExternalLoginDto(
	string Provider,
	string ProviderDisplayName);