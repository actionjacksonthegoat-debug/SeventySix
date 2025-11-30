// <copyright file="PermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>Repository for permission request data access.</summary>
internal class PermissionRequestRepository(
	IdentityDbContext dbContext) : IPermissionRequestRepository
{
	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequestDto>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await dbContext.PermissionRequests
			.AsNoTracking()
			.Include(permissionRequest => permissionRequest.User)
			.OrderByDescending(permissionRequest => permissionRequest.CreateDate)
			.Select(permissionRequest => new PermissionRequestDto(
				permissionRequest.Id,
				permissionRequest.UserId,
				permissionRequest.User!.Username,
				permissionRequest.RequestedRole,
				permissionRequest.RequestMessage,
				permissionRequest.CreatedBy,
				permissionRequest.CreateDate))
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await dbContext.PermissionRequests
			.AsNoTracking()
			.Where(permissionRequest => permissionRequest.UserId == userId)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await dbContext.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Select(userRole => userRole.Role)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default)
	{
		dbContext.PermissionRequests.Add(request);
		await dbContext.SaveChangesAsync(cancellationToken);
	}
}
