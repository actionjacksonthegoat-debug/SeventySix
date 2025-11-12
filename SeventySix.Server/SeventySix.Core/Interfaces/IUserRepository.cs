// <copyright file="IUserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.Entities;

namespace SeventySix.Core.Interfaces;

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
	/// Deletes a user from the data store.
	/// </summary>
	/// <param name="id">The unique identifier of the user to delete.</param>
	/// <param name="cancellationToken">Token to cancel the asynchronous operation.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result is true if the user was deleted; false if it wasn't found.
	/// </returns>
	/// <remarks>
	/// Returns false if the entity doesn't exist rather than throwing an exception.
	/// Consider implementing soft delete instead of hard delete:
	/// - Add IsDeleted flag to entity
	/// - Set flag instead of removing from database
	/// - Filter deleted entities in queries
	///
	/// Soft delete benefits:
	/// - Audit trail maintenance
	/// - Ability to restore deleted data
	/// - Prevents orphaned related data
	/// </remarks>
	public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}