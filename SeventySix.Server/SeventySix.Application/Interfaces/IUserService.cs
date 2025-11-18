// <copyright file="IUserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Interfaces;

/// <summary>
/// User service interface.
/// Defines the contract for business logic operations related to users.
/// </summary>
/// <remarks>
/// This interface follows the Interface Segregation Principle (ISP) by defining
/// only the operations needed for user management.
///
/// It serves as an abstraction layer (Dependency Inversion Principle) between
/// the API layer and the business logic implementation, allowing for:
/// - Easy testing through mocking
/// - Multiple implementations (e.g., caching decorator)
/// - Loose coupling between layers
///
/// All methods are async to support scalable I/O operations.
/// </remarks>
public interface IUserService
{
	/// <summary>
	/// Retrieves all users from the system.
	/// </summary>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains a collection of user DTOs.
	/// </returns>
	/// <remarks>
	/// This method returns all users without pagination.
	/// Consider adding pagination for production systems with large datasets.
	/// </remarks>
	public Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a specific user by their unique identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the user to retrieve.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user DTO if found; otherwise, null.
	/// </returns>
	/// <remarks>
	/// Returns null if the user doesn't exist rather than throwing an exception.
	/// The caller should handle the null case appropriately (e.g., return 404).
	/// </remarks>
	public Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new user in the system.
	/// </summary>
	/// <param name="request">The request containing user data to create.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the created user DTO.
	/// </returns>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails FluentValidation rules.
	/// </exception>
	/// <exception cref="BusinessRuleViolationException">
	/// Thrown when the request violates business rules (e.g., duplicate username/email).
	/// </exception>
	/// <remarks>
	/// The request is automatically validated using FluentValidation before processing.
	/// Validation rules include:
	/// - Username must be 3-50 characters, alphanumeric and underscores only
	/// - Email must be valid format, max 255 characters
	/// - FullName must not exceed 100 characters if provided
	/// </remarks>
	public Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing user in the system.
	/// </summary>
	/// <param name="request">The request containing updated user data.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the updated user DTO.
	/// </returns>
	public Task<UserDto> UpdateUserAsync(UpdateUserRequest request, CancellationToken cancellationToken = default);

	/// <summary>
	/// Soft-deletes a user by their unique identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the user to delete.</param>
	/// <param name="deletedBy">The username of the person deleting the user.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains true if the user was deleted; otherwise, false.
	/// </returns>
	public Task<bool> DeleteUserAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	/// <summary>
	/// Restores a soft-deleted user.
	/// </summary>
	/// <param name="id">The unique identifier of the user to restore.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains true if the user was restored; otherwise, false.
	/// </returns>
	public Task<bool> RestoreUserAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves users with pagination and filtering.
	/// </summary>
	/// <param name="request">The query request with pagination and filter parameters.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains paged results with items and pagination metadata.
	/// </returns>
	public Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest request, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a user by their username.
	/// </summary>
	/// <param name="username">The username to search for.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user DTO if found; otherwise, null.
	/// </returns>
	public Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a user by their email address.
	/// </summary>
	/// <param name="email">The email address to search for.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user DTO if found; otherwise, null.
	/// </returns>
	public Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a username exists in the system.
	/// </summary>
	/// <param name="username">The username to check.</param>
	/// <param name="excludeId">Optional user ID to exclude from the check.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains true if the username exists; otherwise, false.
	/// </returns>
	public Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an email address exists in the system.
	/// </summary>
	/// <param name="email">The email address to check.</param>
	/// <param name="excludeId">Optional user ID to exclude from the check.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains true if the email exists; otherwise, false.
	/// </returns>
	public Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates the active status for multiple users.
	/// </summary>
	/// <param name="ids">The user IDs to update.</param>
	/// <param name="isActive">The new active status.</param>
	/// <param name="modifiedBy">The username of the person making the change.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the number of users updated.
	/// </returns>
	public Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, string modifiedBy, CancellationToken cancellationToken = default);
}