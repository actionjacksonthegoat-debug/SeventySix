// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Combined user data access operations (composite interface).
/// </summary>
/// <remarks>
/// This interface extends focused interfaces for backward compatibility.
/// New code should depend on specific interfaces:
/// - <see cref="IUserQueryRepository"/> for read operations
/// - <see cref="IUserCommandRepository"/> for write operations
/// - <see cref="IUserValidationRepository"/> for uniqueness checks
/// - <see cref="IUserRoleRepository"/> for role operations
/// - <see cref="IUserProfileRepository"/> for profile operations.
/// </remarks>
public interface IUserRepository :
	IUserQueryRepository,
	IUserCommandRepository,
	IUserValidationRepository,
	IUserRoleRepository,
	IUserProfileRepository
{
}