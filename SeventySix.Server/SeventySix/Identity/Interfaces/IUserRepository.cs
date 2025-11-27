// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Repository interface for user data access operations.
/// Defines the contract for persistence operations on User entities.
/// </summary>
/// <remarks>
/// This interface implements the Repository Pattern, providing an abstraction
/// layer between the domain and data access layers.
///
/// Design Benefits:
/// - Dependency Inversion Principle (DIP): Domain depends on abstraction, not concrete implementation
/// - Testability: Easy to mock for unit testing
/// - Flexibility: Can swap implementations (SQL, NoSQL, in-memory) without changing domain
/// - Centralized Data Access: All data operations go through a single interface
///
/// Pattern Details:
/// - Repository Pattern: Encapsulates data access logic
/// - Unit of Work: Typically used with DbContext (in implementation)
/// - Async/Await: All operations are async for I/O efficiency
///
/// Implementation Notes:
/// - Concrete implementation lives in Infrastructure layer
/// - May use Entity Framework Core, Dapper, or any data access technology
/// - Should handle connection management and transactions
///
/// Example Usage:
/// <code>
/// var users = await repository.GetAllAsync(cancellationToken);
/// var user = await repository.GetByIdAsync(123, cancellationToken);
/// var created = await repository.CreateAsync(newUser, cancellationToken);
/// </code>
/// </remarks>
public interface IUserRepository
{
	/// <summary>
	/// Retrieves all users from the data store.
	/// </summary>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains a collection of all user entities.
	/// </returns>
	/// <remarks>
	/// Returns all users without filtering or pagination.
	/// For production systems with large datasets, consider adding:
	/// - Pagination parameters (skip, take)
	/// - Filtering options (active only, search by name/email)
	/// - Sorting capabilities
	/// </remarks>
	public Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a specific user by their unique identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the user to retrieve.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user entity if found; otherwise, null.
	/// </returns>
	/// <remarks>
	/// Returns null if the entity is not found rather than throwing an exception.
	/// This allows the service layer to decide how to handle missing entities.
	/// Consider throwing EntityNotFoundException in service layer for better error handling.
	/// </remarks>
	public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new user in the data store.
	/// </summary>
	/// <param name="user">The user entity to create.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the created user with any generated values (e.g., ID).
	/// </returns>
	/// <exception cref="ArgumentNullException">Thrown when user is null.</exception>
	/// <remarks>
	/// The implementation should:
	/// - Validate the entity is not null
	/// - Add the entity to the data store
	/// - Save changes (commit the transaction)
	/// - Return the entity with generated values (e.g., auto-incremented ID)
	///
	/// Consider validating business rules before persistence:
	/// - Check for duplicate username/email
	/// - Validate required fields
	/// </remarks>
	public Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing user in the data store.
	/// </summary>
	/// <param name="user">The user entity with updated values.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the updated user entity.
	/// </returns>
	/// <exception cref="ArgumentNullException">Thrown when user is null.</exception>
	/// <exception cref="EntityNotFoundException">Thrown when the user doesn't exist (service layer).</exception>
	/// <remarks>
	/// The implementation should:
	/// - Verify the entity exists
	/// - Update the entity in the data store
	/// - Save changes (commit the transaction)
	/// - Return the updated entity
	///
	/// Consider implementing optimistic concurrency control using:
	/// - Timestamp/RowVersion fields
	/// - Concurrency tokens
	/// </remarks>
	public Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes a user from the data store (hard delete).
	/// </summary>
	/// <param name="id">The unique identifier of the user to delete.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the user was deleted; false if it wasn't found.
	/// </returns>
	/// <remarks>
	/// Returns false if the entity doesn't exist rather than throwing an exception.
	/// Note: This is a hard delete. For data retention, use SoftDeleteAsync instead.
	/// Hard delete should be restricted to administrative operations only.
	/// </remarks>
	public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a user by their username.
	/// </summary>
	/// <param name="username">The username to search for.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user entity if found; otherwise, null.
	/// </returns>
	/// <remarks>
	/// Username lookup is case-sensitive by default.
	/// Consider implementing case-insensitive search if required by business rules.
	/// Excludes soft-deleted users by default (global query filter).
	/// </remarks>
	public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a user by their email address.
	/// </summary>
	/// <param name="email">The email address to search for.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the user entity if found; otherwise, null.
	/// </returns>
	/// <remarks>
	/// Email lookup is case-insensitive (normalized to lowercase).
	/// Excludes soft-deleted users by default (global query filter).
	/// </remarks>
	public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a username already exists in the data store.
	/// </summary>
	/// <param name="username">The username to check.</param>
	/// <param name="excludeId">Optional user ID to exclude from check (for updates).</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the username exists; otherwise, false.
	/// </returns>
	/// <remarks>
	/// Used for duplicate detection during create/update operations.
	/// excludeId parameter allows checking uniqueness when updating existing user.
	/// Excludes soft-deleted users from uniqueness check.
	/// </remarks>
	public Task<bool> UsernameExistsAsync(string username, int? excludeId = null, CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if an email address already exists in the data store.
	/// </summary>
	/// <param name="email">The email address to check.</param>
	/// <param name="excludeId">Optional user ID to exclude from check (for updates).</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the email exists; otherwise, false.
	/// </returns>
	/// <remarks>
	/// Used for duplicate detection during create/update operations.
	/// excludeId parameter allows checking uniqueness when updating existing user.
	/// Excludes soft-deleted users from uniqueness check.
	/// Email comparison is case-insensitive.
	/// </remarks>
	public Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a paginated list of users with filtering, searching, date range, and sorting.
	/// </summary>
	/// <param name="request">The query request with filter, search, date range, sort, and pagination parameters.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains a tuple of (Users, TotalCount) for pagination.
	/// </returns>
	/// <remarks>
	/// Pagination is 1-based (first page is 1, not 0).
	/// Search term is applied to username, email, and full name (partial match).
	/// By default, excludes soft-deleted users unless IncludeDeleted is true.
	/// Date filtering is applied to User.LastLoginAt (StartDate/EndDate).
	/// Supports sorting by any User entity property (SortBy, SortDescending).
	/// TotalCount reflects the total number of users matching filters (for pagination UI).
	/// </remarks>
	public Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves multiple users by their unique identifiers.
	/// </summary>
	/// <param name="ids">The collection of user IDs to retrieve.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the collection of found users (may be fewer than requested).
	/// </returns>
	/// <remarks>
	/// Efficiently retrieves multiple users in a single query.
	/// Only returns users that exist (silently omits missing IDs).
	/// Excludes soft-deleted users by default (global query filter).
	/// Useful for bulk operations and related entity loading.
	/// </remarks>
	public Task<IEnumerable<User>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates the active status for multiple users in a single operation.
	/// </summary>
	/// <param name="ids">The collection of user IDs to update.</param>
	/// <param name="isActive">The new active status to set.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the number of users actually updated.
	/// </returns>
	/// <remarks>
	/// Bulk operation for efficiently activating/deactivating multiple users.
	/// Only updates existing, non-deleted users (silently skips missing/deleted IDs).
	/// Returns count of successfully updated users.
	/// Updates ModifyDate timestamp automatically.
	/// </remarks>
	public Task<int> BulkUpdateActiveStatusAsync(IEnumerable<int> ids, bool isActive, CancellationToken cancellationToken = default);

	/// <summary>
	/// Soft deletes a user by setting the IsDeleted flag and audit fields.
	/// </summary>
	/// <param name="id">The unique identifier of the user to soft delete.</param>
	/// <param name="deletedBy">The username or identifier of who is deleting the user.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the user was soft deleted; false if not found or already deleted.
	/// </returns>
	/// <remarks>
	/// Soft delete preserves data for audit compliance and restore capability.
	/// Sets IsDeleted = true, DeletedAt = current UTC time, DeletedBy = provided value.
	/// Soft-deleted users are excluded from queries by default (global query filter).
	/// Returns false if user doesn't exist or is already deleted.
	/// </remarks>
	public Task<bool> SoftDeleteAsync(int id, string deletedBy, CancellationToken cancellationToken = default);

	/// <summary>
	/// Restores a previously soft-deleted user.
	/// </summary>
	/// <param name="id">The unique identifier of the user to restore.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the user was restored; false if not found or not deleted.
	/// </returns>
	/// <remarks>
	/// Restores a soft-deleted user by setting IsDeleted = false.
	/// Clears DeletedAt and DeletedBy fields.
	/// Returns false if user doesn't exist or is not currently deleted.
	/// Requires IgnoreQueryFilters to find deleted users.
	/// </remarks>
	public Task<bool> RestoreAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Counts the total number of users matching the specified criteria.
	/// </summary>
	/// <param name="isActive">Optional filter by active status (null = all users).</param>
	/// <param name="includeDeleted">Whether to include soft-deleted users in the count.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the count of users matching the criteria.
	/// </returns>
	/// <remarks>
	/// Efficiently counts users without loading entities into memory.
	/// By default, excludes soft-deleted users unless includeDeleted is true.
	/// Useful for statistics dashboards and pagination.
	/// </remarks>
	public Task<int> CountAsync(bool? isActive = null, bool includeDeleted = false, CancellationToken cancellationToken = default);
}
