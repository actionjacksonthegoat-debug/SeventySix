// <copyright file="UserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Implements business logic for user management operations.
/// </summary>
/// <remarks>
/// This service orchestrates user-related operations, coordinating between
/// validation, repository access, and business rule enforcement.
///
/// Design Patterns:
/// - Service Layer: Encapsulates business logic separate from controllers
/// - Repository Pattern: Delegates data access to IUserRepository
/// - Validator Pattern: Uses FluentValidation for request validation
///
/// Constructor uses C# 12 primary constructor syntax for concise dependency injection.
///
/// Responsibilities:
/// - Input validation via FluentValidation
/// - Business rule enforcement (duplicate checks, concurrency)
/// - Entity-DTO mapping
/// - Error handling and logging
/// - Transaction coordination (via repository)
/// </remarks>
public class UserService(
	IUserRepository repository,
	IValidator<CreateUserRequest> createValidator,
	IValidator<UpdateUserRequest> updateValidator,
	IValidator<UserQueryRequest> queryValidator,
	ILogger<UserService> logger) : IUserService
{
	/// <inheritdoc/>
	public async Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
	{
		logger.LogInformation("Retrieving all users");
		IEnumerable<User> users = await repository.GetAllAsync(cancellationToken);
		return users.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		logger.LogInformation("Retrieving user with ID {UserId}", id);
		User? user = await repository.GetByIdAsync(id, cancellationToken);

		if (user == null)
		{
			logger.LogWarning("User with ID {UserId} not found", id);
			return null;
		}

		return user.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
	{
		// Validate request
		await createValidator.ValidateAndThrowAsync(request, CancellationToken.None);

		logger.LogInformation("Creating new user with username {Username}", request.Username);

		// Check for duplicate username
		if (await repository.UsernameExistsAsync(request.Username, null, CancellationToken.None))
		{
			logger.LogWarning("Username {Username} already exists", request.Username);
			throw new DuplicateUserException($"Username '{request.Username}' is already taken");
		}

		// Check for duplicate email
		if (await repository.EmailExistsAsync(request.Email, null, CancellationToken.None))
		{
			logger.LogWarning("Email {Email} already exists", request.Email);
			throw new DuplicateUserException($"Email '{request.Email}' is already registered");
		}

		// Create entity and save
		User entity = request.ToEntity();
		entity.CreatedBy = "System"; // TODO: Get from auth context
		User created = await repository.CreateAsync(entity);

		logger.LogInformation("User created: Id={UserId}, Username={Username}", created.Id, created.Username);
		return created.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto> UpdateUserAsync(UpdateUserRequest request)
	{
		// Validate request
		await updateValidator.ValidateAndThrowAsync(request, CancellationToken.None);

		logger.LogInformation("Updating user with ID {UserId}", request.Id);

		// Retrieve existing user
		User? existing = await repository.GetByIdAsync(request.Id, CancellationToken.None);
		if (existing == null)
		{
			logger.LogWarning("User with ID {UserId} not found for update", request.Id);
			throw new UserNotFoundException(request.Id);
		}

		// Check for duplicate username (excluding current user)
		if (await repository.UsernameExistsAsync(request.Username, request.Id, CancellationToken.None))
		{
			logger.LogWarning("Username {Username} already exists for another user", request.Username);
			throw new DuplicateUserException($"Username '{request.Username}' is already taken");
		}

		// Check for duplicate email (excluding current user)
		if (await repository.EmailExistsAsync(request.Email, request.Id, CancellationToken.None))
		{
			logger.LogWarning("Email {Email} already exists for another user", request.Email);
			throw new DuplicateUserException($"Email '{request.Email}' is already registered");
		}

		// Update entity
		User user = request.ToEntity(existing);
		user.ModifiedAt = DateTime.UtcNow;
		user.ModifiedBy = "System"; // TODO: Get from auth context

		try
		{
			User updated = await repository.UpdateAsync(user);
			logger.LogInformation("User updated: Id={UserId}, Username={Username}", updated.Id, updated.Username);
			return updated.ToDto();
		}
		catch (DbUpdateConcurrencyException)
		{
			throw new ConcurrencyException("User was modified by another user. Please refresh and try again.");
		}
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteUserAsync(int id, string deletedBy)
	{
		logger.LogInformation("Soft deleting user with ID {UserId}", id);
		bool result = await repository.SoftDeleteAsync(id, deletedBy);
		if (result)
		{
			logger.LogInformation("User with ID {UserId} soft deleted successfully", id);
		}
		else
		{
			logger.LogWarning("User with ID {UserId} not found for soft delete", id);
		}
		return result;
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreUserAsync(int id)
	{
		logger.LogInformation("Restoring user with ID {UserId}", id);
		bool result = await repository.RestoreAsync(id);
		if (result)
		{
			logger.LogInformation("User with ID {UserId} restored successfully", id);
		}
		else
		{
			logger.LogWarning("User with ID {UserId} not found or not deleted for restore", id);
		}
		return result;
	}

	/// <inheritdoc/>
	public async Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest request, CancellationToken cancellationToken = default)
	{
		// Validate request
		await queryValidator.ValidateAndThrowAsync(request, cancellationToken);

		logger.LogInformation("Retrieving paged users: Page {Page}, PageSize {PageSize}", request.Page, request.PageSize);

		(IEnumerable<User> Users, int TotalCount) pagedResult = await repository.GetPagedAsync(request, cancellationToken);

		return new PagedResult<UserDto>
		{
			Items = pagedResult.Users.ToDto().ToList(),
			TotalCount = pagedResult.TotalCount,
			Page = request.Page,
			PageSize = request.PageSize,
		};
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
	{
		logger.LogInformation("Retrieving user by username {Username}", username);
		User? user = await repository.GetByUsernameAsync(username, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
	{
		logger.LogInformation("Retrieving user by email {Email}", email);
		User? user = await repository.GetByEmailAsync(email, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null, CancellationToken cancellationToken = default)
	{
		logger.LogDebug("Checking if username {Username} exists (excluding user {ExcludeUserId})", username, excludeUserId);
		return await repository.UsernameExistsAsync(username, excludeUserId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null, CancellationToken cancellationToken = default)
	{
		logger.LogDebug("Checking if email {Email} exists (excluding user {ExcludeUserId})", email, excludeUserId);
		return await repository.EmailExistsAsync(email, excludeUserId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> userIds, bool isActive, string modifiedBy)
	{
		logger.LogInformation("Bulk updating active status to {IsActive} for {Count} users", isActive, userIds.Count());
		int count = await repository.BulkUpdateActiveStatusAsync(userIds, isActive);
		logger.LogInformation("Successfully updated {Count} users", count);
		return count;
	}
}
