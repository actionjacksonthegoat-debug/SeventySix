// <copyright file="UserExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Linq.Expressions;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Extension methods for User entity mapping.
/// Provides clean, reusable mapping between domain entities and DTOs.
/// </summary>
public static class UserExtensions
{
	/// <summary>
	/// EF Core-compatible projection expression for database-level DTO selection.
	/// Use with .Select() for server-side projection (avoids loading full entities).
	/// </summary>
	public static Expression<Func<User, UserDto>> ToDtoProjection
	{
		get;
	} = user => new UserDto
	{
		Id = user.Id,
		Username = user.Username,
		Email = user.Email,
		FullName = user.FullName,
		IsActive = user.IsActive,
		CreateDate = user.CreateDate,
		CreatedBy = user.CreatedBy,
		ModifyDate = user.ModifyDate,
		ModifiedBy = user.ModifiedBy,
		LastLoginAt = user.LastLoginAt
	};

	/// <summary>
	/// Converts a User domain entity to a data transfer object (DTO).
	/// </summary>
	public static UserDto ToDto(this User entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new UserDto
		{
			Id = entity.Id,
			Username = entity.Username,
			Email = entity.Email,
			FullName = entity.FullName,
			CreateDate = entity.CreateDate,
			IsActive = entity.IsActive,
			CreatedBy = entity.CreatedBy,
			ModifyDate = entity.ModifyDate,
			ModifiedBy = entity.ModifiedBy,
			LastLoginAt = entity.LastLoginAt,
		};
	}

	/// <summary>
	/// Converts a collection of User entities to DTOs.
	/// </summary>
	/// <param name="entities">The collection of entities to convert.</param>
	/// <returns>An enumerable collection of UserDto objects.</returns>
	/// <remarks>
	/// Uses generic MapToDto utility for efficient transformation with deferred execution.
	/// </remarks>
	public static IEnumerable<UserDto> ToDto(this IEnumerable<User> entities) =>
		entities.MapToDto(e => e.ToDto());

	/// <summary>
	/// Converts a CreateUserRequest to a domain entity.
	/// </summary>
	/// <param name="request">The request object containing creation data.</param>
	/// <returns>A new User entity initialized with request data.</returns>
	/// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
	/// <remarks>
	/// This method creates a new entity instance and maps properties from the request.
	/// Id and CreateDate are not mapped as they are auto-generated.
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
	/// Audit fields (CreateDate, CreatedBy) are preserved from the existing entity.
	/// ModifyDate and ModifiedBy are set automatically by AuditInterceptor on SaveChanges.
	/// </remarks>
	public static User ToEntity(this UpdateUserRequest request, User existing)
	{
		ArgumentNullException.ThrowIfNull(request);
		ArgumentNullException.ThrowIfNull(existing);

		existing.Username = request.Username;
		existing.Email = request.Email;
		existing.FullName = request.FullName;
		existing.IsActive = request.IsActive;
		// Note: RowVersion is NOT copied - EF Core manages concurrency via database xmin column
		// Note: ModifiedBy is set automatically by AuditInterceptor on SaveChanges

		return existing;
	}
}
