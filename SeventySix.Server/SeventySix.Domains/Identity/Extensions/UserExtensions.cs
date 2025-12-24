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
	public static Expression<Func<User, UserDto>> ToDtoProjection { get; } =
		user => new UserDto(
			user.Id,
			user.Username,
			user.Email,
			user.FullName,
			user.CreateDate,
			user.IsActive,
			user.CreatedBy,
			user.ModifyDate,
			user.ModifiedBy,
			user.LastLoginAt,
			user.IsDeleted,
			user.DeletedAt,
			user.DeletedBy);

	/// <summary>
	/// Compiled delegate for in-memory mapping.
	/// Cached for performance - compiled once, reused for all in-memory mappings.
	/// </summary>
	private static readonly Func<User, UserDto> CompiledToDtoFunction =
		ToDtoProjection.Compile();

	/// <summary>
	/// Converts a User domain entity to a data transfer object (DTO).
	/// Uses compiled projection to ensure consistency with EF Core projection.
	/// </summary>
	public static UserDto ToDto(this User entity)
	{
		ArgumentNullException.ThrowIfNull(entity);
		return CompiledToDtoFunction(entity);
	}

	/// <summary>
	/// Converts a UserDto back to a User entity.
	/// </summary>
	/// <remarks>
	/// Used by CQRS handlers when User entity is required for token generation.
	/// </remarks>
	public static User ToEntity(this UserDto dto)
	{
		ArgumentNullException.ThrowIfNull(dto);

		return new User
		{
			Id = dto.Id,
			Username = dto.Username,
			Email = dto.Email,
			FullName = dto.FullName,
			CreateDate = dto.CreateDate,
			IsActive = dto.IsActive,
			CreatedBy = dto.CreatedBy,
			ModifyDate = dto.ModifyDate,
			ModifiedBy = dto.ModifiedBy,
			LastLoginAt = dto.LastLoginAt,
			IsDeleted = dto.IsDeleted,
			DeletedAt = dto.DeletedAt,
			DeletedBy = dto.DeletedBy,
		};
	}

	/// <summary>
	/// Converts a collection of User entities to DTOs.
	/// </summary>
	/// <param name="entities">
	/// The collection of entities to convert.
	/// </param>
	/// <returns>
	/// An enumerable collection of UserDto objects.
	/// </returns>
	/// <remarks>
	/// Uses generic MapToDto utility for efficient transformation with deferred execution.
	/// </remarks>
	public static IEnumerable<UserDto> ToDto(this IEnumerable<User> entities) =>
		entities.MapToDto(e => e.ToDto());

	/// <summary>
	/// Converts a CreateUserRequest to a domain entity.
	/// </summary>
	/// <param name="request">
	/// The request object containing creation data.
	/// </param>
	/// <returns>
	/// A new User entity initialized with request data.
	/// </returns>
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
	/// <param name="request">
	/// The request object containing update data.
	/// </param>
	/// <param name="existing">
	/// The existing entity to update.
	/// </param>
	/// <returns>
	/// The updated User entity.
	/// </returns>
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