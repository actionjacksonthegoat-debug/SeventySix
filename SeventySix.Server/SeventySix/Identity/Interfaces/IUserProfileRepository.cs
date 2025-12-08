// <copyright file="IUserProfileRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User profile data access operations.
/// </summary>
public interface IUserProfileRepository
{
	/// <summary>
	/// Gets a user's complete profile with roles and authentication details.
	/// </summary>
	public Task<UserProfileDto?> GetUserProfileAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets all users who need pending password reset emails.
	/// </summary>
	public Task<IEnumerable<UserDto>> GetUsersNeedingEmailAsync(
		CancellationToken cancellationToken = default);
}