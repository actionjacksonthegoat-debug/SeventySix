// <copyright file="UserExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Extension methods for User entity mapping.
/// Provides clean, reusable mapping between domain entities and DTOs.
/// </summary>
/// <remarks>
/// This class implements the Adapter pattern, translating between different
/// object representations (Domain Entities ↔ DTOs).
///
/// Design Benefits:
/// - Separation of Concerns: Domain models remain independent of API contracts
/// - Reusability: Mapping logic is centralized and reusable
/// - Testability: Extension methods are easy to unit test
/// - Fluent API: Enables readable method chaining
///
/// Mapping Strategy:
/// - Entity → DTO: For read operations (GET requests)
/// - Request → Entity: For write operations (POST/PUT requests)
///
/// Note: For complex mappings, consider using AutoMapper or Mapster libraries.
/// </remarks>
public static class UserExtensions
{
	/// <summary>
	/// Converts a User domain entity to a data transfer object (DTO).
	/// </summary>
	/// <param name="entity">The domain entity to convert.</param>
	/// <returns>A UserDto containing the entity's data.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entity is null.</exception>
	/// <remarks>
	/// This method maps all properties from the domain entity to the DTO.
	/// </remarks>
	public static UserDto ToDto(this User entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new UserDto
		{
			Id = entity.Id,
			Username = entity.Username,
			Email = entity.Email,
			FullName = entity.FullName,
			CreatedAt = entity.CreatedAt,
			IsActive = entity.IsActive,
			CreatedBy = entity.CreatedBy,
			ModifiedAt = entity.ModifiedAt,
			ModifiedBy = entity.ModifiedBy,
			LastLoginAt = entity.LastLoginAt,
			RowVersion = entity.RowVersion,
		};
	}

	/// <summary>
	/// Converts a collection of User entities to DTOs.
	/// </summary>
	/// <param name="entities">The collection of entities to convert.</param>
	/// <returns>An enumerable collection of UserDto objects.</returns>
	/// <exception cref="ArgumentNullException">Thrown when entities is null.</exception>
	/// <remarks>
	/// This is a convenience method that applies ToDto to each entity in the collection.
	/// Uses LINQ Select for efficient transformation with deferred execution.
	/// </remarks>
	public static IEnumerable<UserDto> ToDto(this IEnumerable<User> entities)
	{
		ArgumentNullException.ThrowIfNull(entities);

		return entities.Select(e => e.ToDto());
	}

	/// <summary>
	/// Converts a CreateUserRequest to a domain entity.
	/// </summary>
	/// <param name="request">The request object containing creation data.</param>
	/// <returns>A new User entity initialized with request data.</returns>
	/// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
	/// <remarks>
	/// This method creates a new entity instance and maps properties from the request.
	/// Id and CreatedAt are not mapped as they are auto-generated.
	///
	/// The entity is not persisted here; persistence is handled by the repository.
	/// </remarks>
	public static User ToEntity(this CreateUserRequest request)
	{
		ArgumentNullException.ThrowIfNull(request);

		return new User
		{
			Username = request.Username,
			Email = request.Email,
			FullName = request.FullName,
			IsActive = request.IsActive,
			CreatedAt = DateTime.UtcNow,
		};
	}
	/// <summary>
	/// Converts an UpdateUserRequest to update an existing domain entity.
	/// </summary>
	/// <param name="request">The request object containing update data.</param>
	/// <param name="existing">The existing entity to update.</param>
	/// <returns>The updated User entity.</returns>
	/// <exception cref="ArgumentNullException">Thrown when request or existing is null.</exception>
	/// <remarks>
	/// This method updates an existing entity with values from the request.
	/// Audit fields (CreatedAt, CreatedBy) are preserved from the existing entity.
	/// ModifiedAt and ModifiedBy should be set by the caller.
	/// </remarks>
	public static User ToEntity(this UpdateUserRequest request, User existing)
	{
		ArgumentNullException.ThrowIfNull(request);
		ArgumentNullException.ThrowIfNull(existing);

		existing.Username = request.Username;
		existing.Email = request.Email;
		existing.FullName = request.FullName;
		existing.IsActive = request.IsActive;
		existing.RowVersion = request.RowVersion;
		existing.ModifiedBy = "System";

		return existing;
	}
}
