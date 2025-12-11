// <copyright file="SetPasswordRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for SetPasswordRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Token: Required, must be a valid base64 string
/// - NewPassword: Required, min 8 characters, complexity requirements.
/// </remarks>
public class SetPasswordRequestValidator : AbstractValidator<SetPasswordRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="SetPasswordRequestValidator"/> class.
	/// </summary>
	public SetPasswordRequestValidator()
	{
		RuleFor(request => request.Token)
			.NotEmpty()
			.WithMessage("Reset token is required.")
			.Must(BeValidBase64)
			.WithMessage("Reset token is invalid.");

		RuleFor(request => request.NewPassword)
			.ApplyPasswordRules();
	}

	private static bool BeValidBase64(string token)
	{
		if (string.IsNullOrWhiteSpace(token))
		{
			return false;
		}

		try
		{
			Convert.FromBase64String(token);
			return true;
		}
		catch (FormatException)
		{
			return false;
		}
	}
}