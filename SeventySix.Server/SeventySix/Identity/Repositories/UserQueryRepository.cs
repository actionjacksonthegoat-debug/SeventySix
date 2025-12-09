// <copyright file="UserQueryRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// User query data access implementation (read-only).
/// </summary>
internal class UserQueryRepository(IdentityDbContext context) : IUserQueryRepository
{
	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<UserDto>> GetAllProjectedAsync(
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.Select(user => new UserDto(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				user.CreateDate,
				user.IsActive,
				user.NeedsPendingEmail,
				user.CreatedBy,
				user.ModifyDate,
				user.ModifiedBy,
				user.LastLoginAt,
				user.IsDeleted,
				user.DeletedAt,
				user.DeletedBy))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByIdAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.FirstOrDefaultAsync(
				user => user.Id == id,
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.FirstOrDefaultAsync(
				user => EF.Functions.ILike(user.Username, username),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<User?> GetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.FirstOrDefaultAsync(
				user => EF.Functions.ILike(user.Email, email),
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<User>> GetByIdsAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default)
	{
		List<int> idList = ids.ToList();

		return await context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted)
			.Where(user => idList.Contains(user.Id))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<User> Users, int TotalCount)> GetPagedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted);

		query = ApplyFilters(query, request);
		query = ApplySorting(query, request.SortBy, request.SortDescending);

		int totalCount = await query.CountAsync(cancellationToken);

		List<User> users = await query
			.Skip(request.GetSkip())
			.Take(request.GetValidatedPageSize())
			.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<(IEnumerable<UserDto> Users, int TotalCount)> GetPagedProjectedAsync(
		UserQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = context.Users
			.AsNoTracking()
			.Where(user => !user.IsDeleted);

		query = ApplyFilters(query, request);
		query = ApplySorting(query, request.SortBy, request.SortDescending);

		int totalCount = await query.CountAsync(cancellationToken);

		List<UserDto> users = await query
			.Skip(request.GetSkip())
			.Take(request.GetValidatedPageSize())
			.Select(user => new UserDto(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				user.CreateDate,
				user.IsActive,
				user.NeedsPendingEmail,
				user.CreatedBy,
				user.ModifyDate,
				user.ModifiedBy,
				user.LastLoginAt,
				user.IsDeleted,
				user.DeletedAt,
				user.DeletedBy))
			.ToListAsync(cancellationToken);

		return (users, totalCount);
	}

	/// <inheritdoc/>
	public async Task<int> CountAsync(
		bool? isActive = null,
		bool includeDeleted = false,
		CancellationToken cancellationToken = default)
	{
		IQueryable<User> query = context.Users.AsNoTracking();

		if (!includeDeleted)
		{
			query = query.Where(user => !user.IsDeleted);
		}

		if (isActive.HasValue)
		{
			query = query.Where(user => user.IsActive == isActive.Value);
		}

		return await query.CountAsync(cancellationToken);
	}

	private static IQueryable<User> ApplyFilters(
		IQueryable<User> query,
		UserQueryRequest request)
	{
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			string searchPattern = $"%{request.SearchTerm}%";
			query = query.Where(user =>
				EF.Functions.ILike(user.Username, searchPattern)
				|| EF.Functions.ILike(user.Email, searchPattern)
				|| (user.FullName != null && EF.Functions.ILike(user.FullName, searchPattern)));
		}

		if (request.IsActive.HasValue)
		{
			query = query.Where(user => user.IsActive == request.IsActive.Value);
		}

		return query;
	}

	private static IQueryable<User> ApplySorting(
		IQueryable<User> query,
		string? sortBy,
		bool sortDescending)
	{
		return (sortBy?.ToUpperInvariant(), sortDescending) switch
		{
			("USERNAME", false) => query.OrderBy(user => user.Username),
			("USERNAME", true) => query.OrderByDescending(user => user.Username),
			("EMAIL", false) => query.OrderBy(user => user.Email),
			("EMAIL", true) => query.OrderByDescending(user => user.Email),
			("CREATEDATE", false) => query.OrderBy(user => user.CreateDate),
			("CREATEDATE", true) => query.OrderByDescending(user => user.CreateDate),
			("LASTLOGINAT", false) => query.OrderBy(user => user.LastLoginAt),
			("LASTLOGINAT", true) => query.OrderByDescending(user => user.LastLoginAt),
			_ => sortDescending
				? query.OrderByDescending(user => user.Id)
				: query.OrderBy(user => user.Id),
		};
	}
}