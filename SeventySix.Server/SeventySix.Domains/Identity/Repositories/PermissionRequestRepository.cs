// <copyright file="PermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>Repository for permission request data access.</summary>
internal class PermissionRequestRepository(IdentityDbContext dbContext)
	: IPermissionRequestRepository
{
	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequestDto>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.PermissionRequests
			.AsNoTracking()
			.Include(permissionRequest => permissionRequest.User)
			.Include(permissionRequest => permissionRequest.RequestedRole)
			.OrderByDescending(permissionRequest =>
				permissionRequest.CreateDate)
			.Select(permissionRequest => new PermissionRequestDto(
				permissionRequest.Id,
				permissionRequest.UserId,
				permissionRequest.User!.Username,
				permissionRequest.RequestedRole!.Name,
				permissionRequest.RequestMessage,
				permissionRequest.CreatedBy,
				permissionRequest.CreateDate))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<PermissionRequest?> GetByIdAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.PermissionRequests
			.Include(permissionRequest =>
				permissionRequest.User)
			.Include(permissionRequest => permissionRequest.RequestedRole)
			.FirstOrDefaultAsync(
				permissionRequest => permissionRequest.Id == id,
				cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequest>> GetByIdsAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default)
	{
		List<int> idList = ids.ToList();

		return await dbContext
			.PermissionRequests
			.Include(permissionRequest =>
				permissionRequest.User)
			.Include(permissionRequest => permissionRequest.RequestedRole)
			.Where(permissionRequest => idList.Contains(permissionRequest.Id))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.PermissionRequests
			.AsNoTracking()
			.Include(permissionRequest => permissionRequest.RequestedRole)
			.Where(permissionRequest => permissionRequest.UserId == userId)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Include(userRole => userRole.Role)
			.Select(userRole => userRole.Role!.Name)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<string?> GetUserEmailAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.Users
			.AsNoTracking()
			.Where(user => user.Id == userId)
			.Select(user => user.Email)
			.FirstOrDefaultAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default)
	{
		dbContext.PermissionRequests.Add(request);
		await dbContext.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task DeleteAsync(
		int id,
		CancellationToken cancellationToken = default)
	{
		await dbContext
			.PermissionRequests
			.Where(permissionRequest =>
				permissionRequest.Id == id)
			.ExecuteDeleteAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task DeleteRangeAsync(
		IEnumerable<int> ids,
		CancellationToken cancellationToken = default)
	{
		List<int> idList = ids.ToList();

		await dbContext
			.PermissionRequests
			.Where(permissionRequest =>
				idList.Contains(permissionRequest.Id))
			.ExecuteDeleteAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task DeleteByUserAndRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		await dbContext
			.PermissionRequests
			.Include(permissionRequest =>
				permissionRequest.RequestedRole)
			.Where(permissionRequest =>
				permissionRequest.UserId == userId
				&& permissionRequest.RequestedRole!.Name == role)
			.ExecuteDeleteAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int?> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default)
	{
		return await dbContext
			.SecurityRoles
			.AsNoTracking()
			.Where(securityRole => securityRole.Name == roleName)
			.Select(securityRole => (int?)securityRole.Id)
			.FirstOrDefaultAsync(cancellationToken);
	}
}