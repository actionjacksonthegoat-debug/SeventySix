// <copyright file="IUserValidationRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User validation data access operations.
/// </summary>
public interface IUserValidationRepository
{
	/// <summary>
	/// Checks if a username exists.
	/// </summary>
	public Task<bool> UsernameExistsAsync(
		string username,
		int? excludeId = null,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an email exists.
	/// </summary>
	public Task<bool> EmailExistsAsync(
		string email,
		int? excludeId = null,
		CancellationToken cancellationToken = default);
}