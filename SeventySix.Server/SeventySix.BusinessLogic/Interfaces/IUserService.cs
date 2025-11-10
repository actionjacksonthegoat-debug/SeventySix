// <copyright file="IUserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;

namespace SeventySix.BusinessLogic.Interfaces;

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
}
