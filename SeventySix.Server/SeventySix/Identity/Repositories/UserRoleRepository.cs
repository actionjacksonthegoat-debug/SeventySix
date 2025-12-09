// <copyright file="UserRoleRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// User role data access implementation.
/// </summary>
internal class UserRoleRepository(IdentityDbContext context) : IUserRoleRepository
{
	/// <inheritdoc/>
	public async Task<IEnumerable<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await context.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Join(
				context.SecurityRoles,
				userRole => userRole.RoleId,
				role => role.Id,
				(
					userRole,
					role) => role.Name)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> HasRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		return await context.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Join(
				context.SecurityRoles,
				userRole => userRole.RoleId,
				securityRole => securityRole.Id,
				(
					userRole,
					securityRole) => securityRole.Name)
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
		SecurityRole? securityRole = await context.SecurityRoles
			.FirstOrDefaultAsync(
				securityRole => EF.Functions.ILike(securityRole.Name, role),
				cancellationToken);

		if (securityRole is null)
		{
			throw new InvalidOperationException($"Role '{role}' not found.");
		}

		UserRole userRole =
			new()
			{
				UserId = userId,
				RoleId = securityRole.Id,
			};

		context.UserRoles.Add(userRole);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task AddRoleWithoutAuditAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		SecurityRole? securityRole = await context.SecurityRoles
			.FirstOrDefaultAsync(
				securityRole => EF.Functions.ILike(securityRole.Name, role),
				cancellationToken);

		if (securityRole is null)
		{
			throw new InvalidOperationException($"Role '{role}' not found.");
		}

		// Use raw SQL to bypass SaveChanges audit interception
		await context.Database.ExecuteSqlAsync(
			$"INSERT INTO user_roles (user_id, role_id) VALUES ({userId}, {securityRole.Id})",
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> RemoveRoleAsync(
		int userId,
		string role,
		CancellationToken cancellationToken = default)
	{
		SecurityRole? securityRole = await context.SecurityRoles
			.FirstOrDefaultAsync(
				securityRole => EF.Functions.ILike(securityRole.Name, role),
				cancellationToken);

		if (securityRole is null)
		{
			return false;
		}

		int deleted = await context.UserRoles
			.Where(userRole => userRole.UserId == userId && userRole.RoleId == securityRole.Id)
			.ExecuteDeleteAsync(cancellationToken);

		return deleted > 0;
	}
}