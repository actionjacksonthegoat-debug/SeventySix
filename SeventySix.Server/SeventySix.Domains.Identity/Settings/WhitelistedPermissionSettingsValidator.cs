// <copyright file="WhitelistedPermissionSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="WhitelistedPermissionSettings"/> configuration values.
/// </summary>
public sealed class WhitelistedPermissionSettingsValidator : AbstractValidator<WhitelistedPermissionSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="WhitelistedPermissionSettingsValidator"/> class.
	/// </summary>
	public WhitelistedPermissionSettingsValidator()
	{
		RuleForEach(permissions => permissions.Grants)
			.SetValidator(new WhitelistedGrantValidator());
	}
}

/// <summary>
/// Validates individual <see cref="WhitelistedGrant"/> entries.
/// </summary>
public sealed class WhitelistedGrantValidator : AbstractValidator<WhitelistedGrant>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="WhitelistedGrantValidator"/> class.
	/// </summary>
	public WhitelistedGrantValidator()
	{
		RuleFor(grant => grant.Email)
			.NotEmpty()
			.WithMessage("WhitelistedPermissions:Grant Email is required");

		RuleFor(grant => grant.Roles)
			.NotEmpty()
			.WithMessage("WhitelistedPermissions:Grant Roles must not be empty");
	}
}