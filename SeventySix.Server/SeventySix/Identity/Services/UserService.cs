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
	ITransactionManager transactionManager,
	ILogger<UserService> logger) : IUserService
{
	/// <inheritdoc/>
	public async Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
	{
		return await repository.GetAllProjectedAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByIdAsync(id, cancellationToken);

		if (user == null)
		{
			return null;
		}

		return user.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
	{
		await createValidator.ValidateAndThrowAsync(request, cancellationToken);

		return await transactionManager.ExecuteInTransactionAsync(async transactionCancellationToken =>
		{
			if (await repository.UsernameExistsAsync(request.Username, null, transactionCancellationToken))
			{
				string errorMessage = $"Failed to create user: Username '{request.Username}' is already taken";
				logger.LogError("Duplicate username detected during user creation. Username: {Username}", request.Username);
				throw new DuplicateUserException(errorMessage);
			}

			if (await repository.EmailExistsAsync(request.Email, null, transactionCancellationToken))
			{
				string errorMessage = $"Failed to create user: Email '{request.Email}' is already registered";
				logger.LogError("Duplicate email detected during user creation. Email: {Email}, Username: {Username}", request.Email, request.Username);
				throw new DuplicateUserException(errorMessage);
			}

			User entity = request.ToEntity();
			User created = await repository.CreateAsync(entity, transactionCancellationToken);

			return created.ToDto();
		}, maxRetries: 3, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<UserDto> UpdateUserAsync(UpdateUserRequest request, CancellationToken cancellationToken = default)
	{
		await updateValidator.ValidateAndThrowAsync(request, cancellationToken);

		return await transactionManager.ExecuteInTransactionAsync(async transactionCancellationToken =>
		{
			User? existing = await repository.GetByIdAsync(request.Id, transactionCancellationToken);
			if (existing == null)
			{
				string errorMessage = $"Failed to update user: User with ID {request.Id} not found";
				logger.LogError("User not found during update operation. UserId: {UserId}", request.Id);
				throw new UserNotFoundException(request.Id);
			}

			// Check for duplicate username (excluding current user)
			if (await repository.UsernameExistsAsync(request.Username, request.Id, transactionCancellationToken))
			{
				string errorMessage = $"Failed to update user: Username '{request.Username}' is already taken by another user";
				logger.LogError("Duplicate username detected during user update. Username: {Username}, UserId: {UserId}", request.Username, request.Id);
				throw new DuplicateUserException(errorMessage);
			}

			// Check for duplicate email (excluding current user)
			if (await repository.EmailExistsAsync(request.Email, request.Id, transactionCancellationToken))
			{
				string errorMessage = $"Failed to update user: Email '{request.Email}' is already registered to another user";
				logger.LogError("Duplicate email detected during user update. Email: {Email}, UserId: {UserId}, Username: {Username}", request.Email, request.Id, request.Username);
				throw new DuplicateUserException(errorMessage);
			}

			// Update entity (audit properties set by AuditInterceptor)
			User user = request.ToEntity(existing);

			User updated = await repository.UpdateAsync(user, transactionCancellationToken);
			return updated.ToDto();
		}, maxRetries: 3, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteUserAsync(int id, string deletedBy, CancellationToken cancellationToken = default)
	{
		bool result = await repository.SoftDeleteAsync(id, deletedBy, cancellationToken);
		return result;
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreUserAsync(int id, CancellationToken cancellationToken = default)
	{
		bool result = await repository.RestoreAsync(id, cancellationToken);
		return result;
	}

	/// <inheritdoc/>
	public async Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest request, CancellationToken cancellationToken = default)
	{
		await queryValidator.ValidateAndThrowAsync(request, cancellationToken);

		(IEnumerable<UserDto> Users, int TotalCount) pagedResult = await repository.GetPagedProjectedAsync(request, cancellationToken);

		return new PagedResult<UserDto>
		{
			Items = pagedResult.Users.ToList(),
			TotalCount = pagedResult.TotalCount,
			Page = request.Page,
			PageSize = request.PageSize,
		};
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByUsernameAsync(username, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<UserDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
	{
		User? user = await repository.GetByEmailAsync(email, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null, CancellationToken cancellationToken = default)
	{
		return await repository.UsernameExistsAsync(username, excludeUserId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null, CancellationToken cancellationToken = default)
	{
		return await repository.EmailExistsAsync(email, excludeUserId, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> userIds, bool isActive, string modifiedBy, CancellationToken cancellationToken = default)
	{
		// Execute within transaction to ensure all-or-nothing updates
		return await transactionManager.ExecuteInTransactionAsync(async transactionCancellationToken =>
		{
			int count = await repository.BulkUpdateActiveStatusAsync(userIds, isActive, transactionCancellationToken);
			return count;
		}, maxRetries: 3, cancellationToken);
	}
}
