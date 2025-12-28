// <copyright file="CreatePermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity.Commands.CreatePermissionRequest;

/// <summary>
/// Handler for creating permission requests.
/// </summary>
public static class CreatePermissionRequestCommandHandler
{
	/// <summary>
	/// Processes a create permission request command, auto-approving whitelisted emails.
	/// </summary>
	/// <param name="command">
	/// The permission request command containing user, requested roles and message.
	/// </param>
	/// <param name="repository">
	/// Repository for permission requests and role lookups.
	/// </param>
	/// <param name="userCommandRepository">
	/// Repository for user commands such as adding roles.
	/// </param>
	/// <param name="whitelistedOptions">
	/// Options configuring whitelisted emails for auto-approval.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public static async Task HandleAsync(
		CreatePermissionRequestCommand command,
		IPermissionRequestRepository repository,
		IUserCommandRepository userCommandRepository,
		IOptions<WhitelistedPermissionSettings> whitelistedOptions,
		CancellationToken cancellationToken)
	{
		ArgumentNullException.ThrowIfNull(command);
		ArgumentNullException.ThrowIfNull(command.Request);

		WhitelistedPermissionSettings whitelistedSettings =
			whitelistedOptions.Value;

		if (command.Request.RequestedRoles.Count == 0)
		{
			throw new ArgumentException(
				"At least one role must be selected.",
				nameof(command));
		}

		// Get existing roles and pending requests to skip duplicates (idempotent)
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				command.UserId,
				cancellationToken);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				command.UserId,
				cancellationToken);

		HashSet<string> alreadyHasOrRequested =
			existingRoles
				.Concat(
					pendingRequests.Select(pendingRequest =>
						pendingRequest.RequestedRole!.Name))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		// Get user email once for whitelist checking
		string? userEmail =
			await repository.GetUserEmailAsync(
				command.UserId,
				cancellationToken);

		foreach (string role in command.Request.RequestedRoles)
		{
			if (!RoleConstants.ValidRoleNames.Contains(role))
			{
				throw new ArgumentException(
					$"Invalid role: {role}",
					nameof(command));
			}

			// Skip if user already has role or has pending request (idempotent)
			if (alreadyHasOrRequested.Contains(role))
			{
				continue;
			}

			// Check whitelist for auto-approval
			if (
				userEmail != null
				&& whitelistedSettings.IsWhitelisted(userEmail, role))
			{
				// Auto-approve: add role directly, skip creating request
				// Uses AddRoleWithoutAuditAsync - CreatedBy remains empty for whitelisted
				await userCommandRepository.AddRoleWithoutAuditAsync(
					command.UserId,
					role,
					cancellationToken);
				continue;
			}

			// Look up role ID from SecurityRoles
			long? roleId =
				await repository.GetRoleIdByNameAsync(
					role,
					cancellationToken);

			if (roleId is null)
			{
				throw new InvalidOperationException(
					$"Role '{role}' not found in SecurityRoles");
			}

			// Create request as normal
			PermissionRequest entity =
				new()
				{
					UserId = command.UserId,
					RequestedRoleId = roleId.Value,
					RequestMessage =
						command.Request.RequestMessage,
					CreatedBy = command.Username,
				};

			await repository.CreateAsync(entity, cancellationToken);
		}
	}
}