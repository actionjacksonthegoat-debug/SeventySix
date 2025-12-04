// <copyright file="PermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;

namespace SeventySix.Identity;

/// <summary>Service for permission request business logic.</summary>
internal class PermissionRequestService(
	IPermissionRequestRepository repository,
	IUserRepository userRepository,
	IOptions<WhitelistedPermissionSettings> whitelistedOptions) : IPermissionRequestService
{
	private readonly WhitelistedPermissionSettings WhitelistedSettings =
		whitelistedOptions.Value;

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequestDto>> GetAllRequestsAsync(
		CancellationToken cancellationToken = default)
	{
		return await repository.GetAllAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<AvailableRoleDto>> GetAvailableRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		// Get roles user already has (from UserRoles table)
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				userId,
				cancellationToken);

		// Get pending permission requests
		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				userId,
				cancellationToken);

		// Combine: exclude roles user already has AND already requested
		HashSet<string> excludedRoles =
			existingRoles
				.Concat(pendingRequests.Select(request => request.RequestedRole!.Name))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		return RoleConstants.AllRequestableRoles
			.Where(role => !excludedRoles.Contains(role.Name))
			.ToList();
	}

	/// <inheritdoc/>
	public async Task CreateRequestsAsync(
		int userId,
		string username,
		CreatePermissionRequestDto request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		if (request.RequestedRoles.Count == 0)
		{
			throw new ArgumentException(
				"At least one role must be selected.",
				nameof(request));
		}

		// Get existing roles and pending requests to skip duplicates (idempotent)
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				userId,
				cancellationToken);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				userId,
				cancellationToken);

		HashSet<string> alreadyHasOrRequested =
			existingRoles
				.Concat(pendingRequests.Select(pendingRequest => pendingRequest.RequestedRole!.Name))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		// Get user email once for whitelist checking
		string? userEmail =
			await repository.GetUserEmailAsync(
				userId,
				cancellationToken);

		foreach (string role in request.RequestedRoles)
		{
			if (!RoleConstants.ValidRoleNames.Contains(role))
			{
				throw new ArgumentException(
					$"Invalid role: {role}",
					nameof(request));
			}

			// Skip if user already has role or has pending request (idempotent)
			if (alreadyHasOrRequested.Contains(role))
			{
				continue;
			}

			// Check whitelist for auto-approval
			if (userEmail != null
				&& WhitelistedSettings.IsWhitelisted(
					userEmail,
					role))
			{
				// Auto-approve: add role directly, skip creating request
				// Uses AddRoleWithoutAuditAsync - CreatedBy remains empty for whitelisted
				await userRepository.AddRoleWithoutAuditAsync(
					userId,
					role,
					cancellationToken);
				continue;
			}

			// Look up role ID from SecurityRoles
			int? roleId =
				await repository.GetRoleIdByNameAsync(
					role,
					cancellationToken);

			if (roleId is null)
			{
				throw new InvalidOperationException($"Role '{role}' not found in SecurityRoles");
			}

			// Create request as normal
			PermissionRequest entity =
				new()
				{
					UserId = userId,
					RequestedRoleId = roleId.Value,
					RequestMessage = request.RequestMessage,
					CreatedBy = username
				};

			await repository.CreateAsync(
				entity,
				cancellationToken);
		}
	}

	/// <inheritdoc/>
	public async Task<bool> ApproveRequestAsync(
		int requestId,
		CancellationToken cancellationToken = default)
	{
		PermissionRequest? request =
			await repository.GetByIdAsync(
				requestId,
				cancellationToken);

		if (request == null)
		{
			return false;
		}

		// Audit fields (CreatedBy) set automatically by AuditInterceptor
		await userRepository.AddRoleAsync(
			request.UserId,
			request.RequestedRole!.Name,
			cancellationToken);

		await repository.DeleteAsync(
			requestId,
			cancellationToken);

		return true;
	}

	/// <inheritdoc/>
	public async Task<bool> RejectRequestAsync(
		int requestId,
		CancellationToken cancellationToken = default)
	{
		PermissionRequest? request =
			await repository.GetByIdAsync(
				requestId,
				cancellationToken);

		if (request == null)
		{
			return false;
		}

		await repository.DeleteAsync(
			requestId,
			cancellationToken);

		return true;
	}

	/// <inheritdoc/>
	public async Task<int> ApproveRequestsAsync(
		IEnumerable<int> requestIds,
		CancellationToken cancellationToken = default)
	{
		List<int> idList =
			requestIds.ToList();

		IEnumerable<PermissionRequest> requests =
			await repository.GetByIdsAsync(
				idList,
				cancellationToken);

		int approvedCount =
			0;

		foreach (PermissionRequest request in requests)
		{
			// Audit fields (CreatedBy) set automatically by AuditInterceptor
			await userRepository.AddRoleAsync(
				request.UserId,
				request.RequestedRole!.Name,
				cancellationToken);
			approvedCount++;
		}

		await repository.DeleteRangeAsync(
			idList,
			cancellationToken);

		return approvedCount;
	}

	/// <inheritdoc/>
	public async Task<int> RejectRequestsAsync(
		IEnumerable<int> requestIds,
		CancellationToken cancellationToken = default)
	{
		List<int> idList =
			requestIds.ToList();

		await repository.DeleteRangeAsync(
			idList,
			cancellationToken);

		return idList.Count;
	}
}