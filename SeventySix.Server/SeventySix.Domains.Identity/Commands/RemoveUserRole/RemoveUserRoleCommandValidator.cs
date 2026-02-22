// <copyright file="RemoveUserRoleCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity.Commands.RemoveUserRole;

/// <summary>
/// FluentValidation validator for RemoveUserRoleCommand.
/// Prevents role manipulation attacks by validating against known role names.
/// </summary>
/// <remarks>
/// Security: This validator is critical for preventing unauthorized role removal.
/// Only roles defined in RoleConstants.ValidRoleNames are accepted.
/// </remarks>
public sealed class RemoveUserRoleCommandValidator : AbstractValidator<RemoveUserRoleCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RemoveUserRoleCommandValidator"/> class.
	/// </summary>
	public RemoveUserRoleCommandValidator()
	{
		RuleFor(command => command.UserId)
			.GreaterThan(0)
			.WithMessage("User ID must be greater than zero");

		RuleFor(command => command.Role)
			.NotEmpty()
			.WithMessage("Role is required")
			.Must(IsValidRole)
			.WithMessage("Role must be a valid system role");
	}

	/// <summary>
	/// Validates that the role name exists in the system's valid roles.
	/// </summary>
	/// <param name="roleName">
	/// The role name to validate.
	/// </param>
	/// <returns>
	/// True if the role is valid; otherwise false.
	/// </returns>
	private static bool IsValidRole(string? roleName)
	{
		if (string.IsNullOrWhiteSpace(roleName))
		{
			return false;
		}

		return RoleConstants.ValidRoleNames.Contains(roleName.Trim());
	}
}