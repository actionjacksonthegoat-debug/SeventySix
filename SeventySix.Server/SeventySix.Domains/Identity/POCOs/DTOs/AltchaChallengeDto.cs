// <copyright file="AltchaChallengeDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// DTO for ALTCHA challenge response sent to clients.
/// </summary>
/// <param name="Algorithm">
/// The hashing algorithm (e.g., "SHA-256").
/// </param>
/// <param name="Challenge">
/// The challenge hash to solve.
/// </param>
/// <param name="MaxNumber">
/// The maximum number to iterate.
/// </param>
/// <param name="Salt">
/// The salt value.
/// </param>
/// <param name="Signature">
/// The HMAC signature.
/// </param>
public record AltchaChallengeDto(
	string Algorithm,
	string Challenge,
	int MaxNumber,
	string Salt,
	string Signature);
