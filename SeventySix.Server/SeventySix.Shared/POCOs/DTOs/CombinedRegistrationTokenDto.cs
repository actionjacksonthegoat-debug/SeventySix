// <copyright file="CombinedRegistrationTokenDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.POCOs;

/// <summary>
/// Combined token containing email and verification token for secure registration.
/// </summary>
/// <param name="Email">
/// The email address being verified.
/// </param>
/// <param name="Token">
/// The Identity email confirmation token.
/// </param>
public sealed record CombinedRegistrationTokenDto(
	string Email,
	string Token);