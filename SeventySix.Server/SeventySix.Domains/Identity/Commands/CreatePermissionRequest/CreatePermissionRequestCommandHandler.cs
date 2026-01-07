// <copyright file="CreatePermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
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
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for role operations.
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
		UserManager<ApplicationUser> userManager,
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

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			throw new UserNotFoundException(command.UserId);
		}

		// Get existing roles using UserManager
		IList<string> existingRoles =
			await userManager.GetRolesAsync(user);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				command.UserId,
				cancellationToken);

		HashSet<string> alreadyHasOrRequested =
			existingRoles
				.Concat(
					pendingRequests.Select(pendingRequest =>
						pendingRequest.RequestedRole!.Name!))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

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
				user.Email != null
				&& whitelistedSettings.IsWhitelisted(user.Email, role))
			{
				// Auto-approve: add role directly using UserManager
				await userManager.AddToRoleAsync(user, role);
				continue;
			}

			// Look up role from SecurityRoles
			ApplicationRole? applicationRole =
				await repository.GetRoleByNameAsync(
					role,
					cancellationToken);

			if (applicationRole is null)
			{
				throw new InvalidOperationException(
					$"Role '{role}' not found in SecurityRoles");
			}

			// Create request as normal
			PermissionRequest entity =
				new()
				{
					UserId = command.UserId,
					RequestedRoleId = applicationRole.Id,
					RequestMessage =
						command.Request.RequestMessage,
					CreatedBy = command.Username,
				};

			await repository.CreateAsync(
				entity,
				cancellationToken);
		}
	}
}