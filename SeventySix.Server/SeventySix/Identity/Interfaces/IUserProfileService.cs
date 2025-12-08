// <copyright file="IUserProfileService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// User profile operations (self-service and system).
/// </summary>
/// <remarks>
/// Focused service following SRP - handles user profile and email operations.
/// Extends IDatabaseHealthCheck for health monitoring.
/// </remarks>
public interface IUserProfileService : IDatabaseHealthCheck
{
	/// <summary>
	/// Gets a user's complete profile with roles and authentication details.
	/// </summary>
	public Task<UserProfileDto?> GetUserProfileAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates the current user's profile (self-service).
	/// </summary>
	public Task<UserProfileDto?> UpdateProfileAsync(
		int userId,
		UpdateProfileRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets all users who need pending password reset emails.
	/// </summary>
	public Task<IEnumerable<UserDto>> GetUsersNeedingEmailAsync(
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Clears the pending email flag for a user.
	/// </summary>
	public Task ClearPendingEmailFlagAsync(
		int userId,
		CancellationToken cancellationToken = default);
}