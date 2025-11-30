// <copyright file="PermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Service for permission request business logic.</summary>
internal class PermissionRequestService(
	IPermissionRequestRepository repository) : IPermissionRequestService
{
	/// <summary>All requestable roles in the system.</summary>
	/// <remarks>
	/// KISS: Hardcoded list is simpler than database/config management.
	/// Easy to extend when new roles are added to the system.
	/// </remarks>
	private static readonly IReadOnlyList<AvailableRoleDto> AllRequestableRoles =
	[
		new AvailableRoleDto(
			"Developer",
			"Access to developer tools and APIs"),
		new AvailableRoleDto(
			"Admin",
			"Full administrative access")
	];

	private static readonly HashSet<string> ValidRoleNames =
		AllRequestableRoles
			.Select(role => role.Name)
			.ToHashSet(StringComparer.OrdinalIgnoreCase);

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
				.Concat(pendingRequests.Select(request => request.RequestedRole))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		return AllRequestableRoles
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
				.Concat(pendingRequests.Select(pendingRequest => pendingRequest.RequestedRole))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		foreach (string role in request.RequestedRoles)
		{
			if (!ValidRoleNames.Contains(role))
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

			PermissionRequest entity =
				new()
				{
					UserId = userId,
					RequestedRole = role,
					RequestMessage = request.RequestMessage,
					CreatedBy = username
				};

			await repository.CreateAsync(
				entity,
				cancellationToken);
		}
	}
}
