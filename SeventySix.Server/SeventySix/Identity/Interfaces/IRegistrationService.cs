// <copyright file="IRegistrationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User registration operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles only registration flows.
/// Supports both direct registration and email verification flows.
/// </remarks>
public interface IRegistrationService
{
	/// <summary>
	/// Registers a new user with local credentials (direct registration).
	/// </summary>
	/// <param name="request">Registration details.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens or error.</returns>
	public Task<AuthResult> RegisterAsync(
		RegisterRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Initiates self-registration by sending verification email.
	/// Always succeeds to prevent email enumeration.
	/// </summary>
	/// <param name="request">The registration initiation request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task InitiateRegistrationAsync(
		InitiateRegistrationRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Completes registration after email verification.
	/// </summary>
	/// <param name="request">The registration completion request.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens if successful.</returns>
	public Task<AuthResult> CompleteRegistrationAsync(
		CompleteRegistrationRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);
}