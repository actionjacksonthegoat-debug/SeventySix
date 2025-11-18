// <copyright file="UserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Extensions;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Entities;
using SeventySix.BusinessLogic.Exceptions;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// User service implementation.
/// Encapsulates business logic for user operations.
/// </summary>
/// <remarks>
/// This service implements the Service Layer pattern, providing a facade over
/// the repository layer while handling business logic and validation.
///
/// Design Principles Applied:
/// - Single Responsibility Principle (SRP): Focuses only on user business logic
/// - Dependency Inversion Principle (DIP): Depends on abstractions (IUserRepository, IValidator)
/// - Open/Closed Principle (OCP): Open for extension via dependency injection, closed for modification
///
/// Responsibilities:
/// - Validate requests using FluentValidation
/// - Coordinate between repository and mapping layers
/// - Enforce business rules
/// - Map between domain entities and DTOs
///
/// Transaction Management: Relies on repository layer for data persistence.
/// Validation: Uses FluentValidation for request validation before processing.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="UserService"/> class.
/// </remarks>
/// <param name="repository">The repository for data access operations.</param>
/// <param name="createValidator">The validator for create requests.</param>
/// <param name="updateValidator">The validator for update requests.</param>
/// <param name="queryValidator">The validator for query requests.</param>
/// <param name="logger">The logger for diagnostic information.</param>
/// <exception cref="ArgumentNullException">
/// Thrown when any required dependency is null.
/// </exception>
/// <remarks>
/// Dependencies are injected via constructor following Dependency Injection pattern.
/// This enables loose coupling and facilitates unit testing with mocks.
/// </remarks>
public class UserService(
	IUserRepository repository,
	IValidator<CreateUserRequest> createValidator,
	IValidator<UpdateUserRequest> updateValidator,
	IValidator<UserQueryRequest> queryValidator,
	ILogger<UserService> logger) : IUserService
{
	/// <inheritdoc/>
	/// <remarks>
	/// Implementation retrieves all users from the repository and maps them to DTOs.
	/// Uses extension methods for clean entity-to-DTO transformation.
	/// </remarks>
	public async Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
	{
		IEnumerable<User> users = await repository.GetAllAsync(cancellationToken);
		return users.ToDto();
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Returns null if the user is not found, allowing the caller to determine
	/// the appropriate response (typically 404 Not Found).
	/// </remarks>
	public async Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByIdAsync(id, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails validation rules defined in CreateUserValidator.
	/// </exception>
	/// <remarks>
	/// Processing steps:
	/// 1. Validate request using FluentValidation (throws ValidationException if invalid)
	/// 2. Check for duplicate username and email
	/// 3. Map request to domain entity using extension method
	/// 4. Persist entity via repository
	/// 5. Map created entity to DTO and return
	///
	/// The ValidateAndThrowAsync method ensures validation happens before any processing,
	/// following the fail-fast principle.
	/// </remarks>
	public async Task<UserDto> CreateUserAsync(
		CreateUserRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request using FluentValidation
		await createValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Check for duplicate username
		if (await repository.UsernameExistsAsync(request.Username, null, cancellationToken))
		{
			throw new DuplicateUserException($"Username '{request.Username}' already exists");
		}

		// Check for duplicate email
		if (await repository.EmailExistsAsync(request.Email, null, cancellationToken))
		{
			throw new DuplicateUserException($"Email '{request.Email}' already exists");
		}

		// Map request to entity using extension method
		User user = request.ToEntity();
		user.CreatedBy = "System"; // TODO: Get from auth context

		// Save via repository
		User created = await repository.CreateAsync(user, cancellationToken);

		logger.LogInformation(
			"User created: Id={UserId}, Username={Username}",
			created.Id,
			created.Username);

		// Map entity to DTO using extension method
		return created.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto> UpdateUserAsync(
		UpdateUserRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		await updateValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Get existing user
		User? existing = await repository.GetByIdAsync(request.Id, cancellationToken);
		if (existing is null)
		{
			throw new UserNotFoundException($"User with ID {request.Id} not found");
		}

		// Check for duplicate username (excluding current user)
		if (request.Username != existing.Username)
		{
			if (await repository.UsernameExistsAsync(request.Username, request.Id, cancellationToken))
			{
				throw new DuplicateUserException($"Username '{request.Username}' already exists");
			}
		}

		// Check for duplicate email (excluding current user)
		if (request.Email != existing.Email)
		{
			if (await repository.EmailExistsAsync(request.Email, request.Id, cancellationToken))
			{
				throw new DuplicateUserException($"Email '{request.Email}' already exists");
			}
		}

		// Map changes
		User user = request.ToEntity(existing);
		user.ModifiedAt = DateTime.UtcNow;
		user.ModifiedBy = "System"; // TODO: Get from auth context

		// Handle concurrency
		try
		{
			User updated = await repository.UpdateAsync(user, cancellationToken);

			logger.LogInformation(
				"User updated: Id={UserId}, Username={Username}",
				updated.Id,
				updated.Username);

			return updated.ToDto();
		}
		catch (DbUpdateConcurrencyException)
		{
			throw new ConcurrencyException("User was modified by another user. Please refresh and try again.");
		}
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteUserAsync(
		int id,
		string deletedBy,
		CancellationToken cancellationToken = default)
	{
		bool result = await repository.SoftDeleteAsync(id, deletedBy, cancellationToken);

		if (result)
		{
			logger.LogInformation("User soft-deleted: Id={UserId}, DeletedBy={DeletedBy}", id, deletedBy);
		}

		return result;
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreUserAsync(int id, CancellationToken cancellationToken = default)
	{
		bool result = await repository.RestoreAsync(id, cancellationToken);

		if (result)
		{
			logger.LogInformation("User restored: Id={UserId}", id);
		}

		return result;
	}

	/// <inheritdoc/>
	public async Task<PagedResult<UserDto>> GetPagedUsersAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		await queryValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Get paged data
		(IEnumerable<User> users, int totalCount) = await repository.GetPagedAsync(
			request.Page,
			request.PageSize,
			request.SearchTerm,
			request.IsActive,
			request.IncludeDeleted,
			cancellationToken);

		return new PagedResult<UserDto>
		{
			Items = users.ToDto(),
			Page = request.Page,
			PageSize = request.PageSize,
			TotalCount = totalCount
		};
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByUsernameAsync(username, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByEmailAsync(email, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(
		string username,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		return await repository.UsernameExistsAsync(username, excludeId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(
		string email,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		return await repository.EmailExistsAsync(email, excludeId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(
		IEnumerable<int> ids,
		bool isActive,
		string modifiedBy,
		CancellationToken cancellationToken = default)
	{
		int count = await repository.BulkUpdateActiveStatusAsync(ids, isActive, cancellationToken);

		logger.LogInformation(
			"Bulk updated {Count} users to IsActive={IsActive} by {ModifiedBy}",
			count,
			isActive,
			modifiedBy);

		return count;
	}
}