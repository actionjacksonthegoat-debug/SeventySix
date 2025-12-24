// <copyright file="UserRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Persistence;

namespace SeventySix.Identity;

/// <summary>
/// EF Core implementation for User data access.
/// </summary>
internal class UserRepository(
	IdentityDbContext context,
	ILogger<UserRepository> repositoryLogger,
	TimeProvider timeProvider)
	:
		BaseRepository<User, IdentityDbContext>(context, repositoryLogger),
		IUserQueryRepository,
		IUserCommandRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(User entity)
	{
		return $"Id={entity.Id}, Username={entity.Username}";
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.OrderBy(user => user.Username)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<UserDto>> GetAllProjectedAsync(
		CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.OrderBy(user => user.Username)
			.Select(UserExtensions.ToDtoProjection)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByIdAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		return await GetQueryable()
			.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
	}

	/// <inheritdoc/>
	public new async Task<User> CreateAsync(
		User entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);
		return await base.CreateAsync(entity, cancellationToken);
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Uses base UpdateAsync implementation for consistent tracking logic.
	/// </remarks>
	public new async Task<User> UpdateAsync(
		User entity,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);
		return await base.UpdateAsync(entity, cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> DeleteAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(id);

		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? entity =
					await context.Users.FindAsync(
						[id],
						cancellationToken);
				if (entity is null)
				{
					return false;
				}

				context.Users.Remove(entity);
				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(DeleteAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<User?> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(username);

		return await GetQueryable()
			.FirstOrDefaultAsync(
				user => user.Username == username,
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);

		return await GetQueryable()
			.FirstOrDefaultAsync(
				user => user.Email.ToLower() == email.ToLower(),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> UsernameExistsAsync(
		string username,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		if (excludeId.HasValue)
		{
			return await context.Users.AnyAsync(
				user => user.Username == username && user.Id != excludeId.Value,
				cancellationToken);
		}

		return await context.Users.AnyAsync(
			user => user.Username == username,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> EmailExistsAsync(
		string email,
		int? excludeId = null,
		CancellationToken cancellationToken = default)
	{
		string lowerEmail = email.ToLower();

		if (excludeId.HasValue)
		{
			return await context.Users.AnyAsync(
				user =>
					user.Email.ToLower() == lowerEmail
					&& user.Id != excludeId.Value,
				cancellationToken);
		}

		return await context.Users.AnyAsync(
			user => user.Email.ToLower() == lowerEmail,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		IQueryable<User> baseQuery =
			request.IncludeDeleted
			? context.Users.IgnoreQueryFilters()
			: GetQueryable();

		IQueryable<User> filteredQuery =
			ApplyFilters(baseQuery, request);

		int totalCount =
			await filteredQuery.CountAsync(cancellationToken);

		List<User> users =
			await ApplySortingAndPaging(filteredQuery, request)
				.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<(
		IEnumerable<UserDto> Users,
		int TotalCount
	)> GetPagedProjectedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		IQueryable<User> baseQuery =
			request.IncludeDeleted
			? context.Users.IgnoreQueryFilters()
			: GetQueryable();

		IQueryable<User> filteredQuery =
			ApplyFilters(baseQuery, request);

		int totalCount =
			await filteredQuery.CountAsync(cancellationToken);

		List<UserDto> users =
			await ApplySortingAndPaging(
				filteredQuery,
				request)
				.Select(UserExtensions.ToDtoProjection)
				.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetByIdsAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.Where(user => ids.Contains(user.Id))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> BulkUpdateActiveStatusAsync(
		IEnumerable<int> ids,
		bool isActive,
		CancellationToken cancellationToken = default)
	{
		BulkOperationExecutor<User> executor =
			new(context);
		return await executor.ExecuteBulkUpdateAsync(
			ids,
			user => user.IsActive = isActive,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> SoftDeleteAsync(
		int id,
		string deletedBy,
		CancellationToken cancellationToken = default)
	{
		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? user =
					await context
						.Users
						.IgnoreQueryFilters()
						.FirstOrDefaultAsync(
							user => user.Id == id && !user.IsDeleted,
							cancellationToken);

				if (user is null)
				{
					return false;
				}

				user.IsDeleted = true;
				user.DeletedAt =
					timeProvider.GetUtcNow().UtcDateTime;
				user.DeletedBy = deletedBy;

				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(SoftDeleteAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<bool> RestoreAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				User? user =
					await context
						.Users
						.IgnoreQueryFilters()
						.FirstOrDefaultAsync(
							user => user.Id == id && user.IsDeleted,
							cancellationToken);

				if (user is null)
				{
					return false;
				}

				user.IsDeleted = false;
				user.DeletedAt = null;
				user.DeletedBy = null;

				await context.SaveChangesAsync(cancellationToken);
				return true;
			},
			nameof(RestoreAsync),
			$"Id={id}");
	}

	/// <inheritdoc/>
	public async Task<int> CountAsync(
		bool? isActive = null,
		bool includeDeleted = false,
		CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = context.Users.AsQueryable();

		// Include deleted users if requested
		if (includeDeleted)
		{
			query = query.IgnoreQueryFilters();
		}

		// Apply active status filter
		if (isActive.HasValue)
		{
			query =
				query.Where(user => user.IsActive == isActive.Value);
		}

		return await query.CountAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await context
			.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Join(
				context.SecurityRoles,
				userRole => userRole.RoleId,
				securityRole => securityRole.Id,
				(userRole, securityRole) => securityRole.Name)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> HasRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		return await context
			.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Join(
				context.SecurityRoles,
				userRole => userRole.RoleId,
				securityRole => securityRole.Id,
				(userRole, securityRole) => securityRole.Name)
			.AnyAsync(
				roleName => EF.Functions.ILike(roleName, role),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task AddRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		// Look up role ID from SecurityRoles
		int? roleId =
			await context
				.SecurityRoles
				.Where(securityRole => securityRole.Name == role)
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException(
				$"Role '{role}' not found in SecurityRoles");
		}

		// Audit fields (CreatedBy, CreateDate) set automatically by AuditInterceptor
		UserRole userRole =
			new() { UserId = userId, RoleId = roleId.Value };

		context.UserRoles.Add(userRole);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task AddRoleWithoutAuditAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		// Look up role ID from SecurityRoles
		int? roleId =
			await context
				.SecurityRoles
				.Where(securityRole => securityRole.Name == role)
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException(
				$"Role '{role}' not found in SecurityRoles");
		}

		// Direct SQL insert bypasses AuditInterceptor for whitelisted auto-approvals
		await context.Database.ExecuteSqlRawAsync(
			"""
			INSERT INTO identity."UserRoles" ("UserId", "RoleId", "CreateDate", "CreatedBy")
			VALUES ({0}, {1}, {2}, {3})
			""",
			[
				userId,
				roleId.Value,
				timeProvider.GetUtcNow().UtcDateTime,
				string.Empty,
			],
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> RemoveRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		int deleted =
			await context
				.UserRoles
				.Include(userRole => userRole.Role)
				.Where(userRole =>
					userRole.UserId == userId && userRole.Role!.Name == role)
				.ExecuteDeleteAsync(cancellationToken);

		return deleted > 0;
	}

	/// <inheritdoc/>
	public async Task<UserProfileDto?> GetUserProfileAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		User? user =
			await context
				.Users
				.AsNoTracking()
				.Where(user => user.Id == userId)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null)
		{
			return null;
		}

		List<string> roles =
			await context
				.UserRoles
				.AsNoTracking()
				.Where(userRole => userRole.UserId == userId)
				.Include(userRole => userRole.Role)
				.Select(userRole => userRole.Role!.Name)
				.ToListAsync(cancellationToken);

		bool hasPassword =
			await context.UserCredentials.AnyAsync(
				c => c.UserId == userId,
				cancellationToken);

		List<string> linkedProviders =
			await context
				.ExternalLogins
				.AsNoTracking()
				.Where(externalLogin => externalLogin.UserId == userId)
				.Select(externalLogin => externalLogin.Provider)
				.ToListAsync(cancellationToken);

		return new UserProfileDto(
			Id: user.Id,
			Username: user.Username,
			Email: user.Email,
			FullName: user.FullName,
			Roles: roles,
			HasPassword: hasPassword,
			LinkedProviders: linkedProviders,
			LastLoginAt: user.LastLoginAt);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<UserDto>> GetUsersNeedingEmailAsync(
		CancellationToken cancellationToken = default)
	{
		return await context
			.Users
			.AsNoTracking()
			.Where(user => user.NeedsPendingEmail)
			.Select(UserExtensions.ToDtoProjection)
			.ToListAsync(cancellationToken);
	}

	/// <summary>
	/// Applies filtering to a user query based on the <see cref="UserQueryRequest"/>.
	/// </summary>
	/// <param name="query">
	/// The base query to apply filters to.
	/// </param>
	/// <param name="request">
	/// The request containing filter criteria.
	/// </param>
	/// <returns>
	/// A filtered <see cref="IQueryable{User}"/> instance.
	/// </returns>
	private static IQueryable<User> ApplyFilters(
		IQueryable<User> query,
		UserQueryRequest request)
	{
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			query =
				query.Where(user =>
					user.Username.Contains(request.SearchTerm)
					|| user.Email.Contains(request.SearchTerm)
					|| (
						user.FullName != null
						&& user.FullName.Contains(request.SearchTerm)));
		}

		if (request.IsActive.HasValue)
		{
			query =
				query.Where(user =>
					user.IsActive == request.IsActive.Value);
		}

		if (request.StartDate.HasValue)
		{
			query =
				query.Where(user =>
					user.LastLoginAt >= request.StartDate.Value);
		}

		if (request.EndDate.HasValue)
		{
			query =
				query.Where(user =>
					user.LastLoginAt <= request.EndDate.Value);
		}

		return query;
	}

	/// <summary>
	/// Applies sorting and paging to a user query based on the request.
	/// </summary>
	/// <param name="query">
	/// The query to sort and page.
	/// </param>
	/// <param name="request">
	/// Pagination and sorting parameters.
	/// </param>
	/// <returns>
	/// A sorted and paged <see cref="IQueryable{User}"/>.
	/// </returns>
	private static IQueryable<User> ApplySortingAndPaging(
		IQueryable<User> query,
		UserQueryRequest request)
	{
		string sortProperty =
			string.IsNullOrWhiteSpace(request.SortBy)
			? "Id"
			: request.SortBy;

		query =
			request.SortDescending
			? query.OrderByDescending(user =>
				EF.Property<object>(user, sortProperty))
			: query.OrderBy(user => EF.Property<object>(user, sortProperty));

		return query
			.Skip(request.GetSkip())
			.Take(request.GetValidatedPageSize());
	}
}