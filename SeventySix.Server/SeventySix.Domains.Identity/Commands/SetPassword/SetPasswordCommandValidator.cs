// <copyright file="SetPasswordCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.SetPassword;

/// <summary>
/// FluentValidation validator for SetPasswordRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Token: Required, must be a valid base64 string
/// - NewPassword: Required, min length from config, complexity requirements.
/// </remarks>
public sealed class SetPasswordCommandValidator : AbstractValidator<SetPasswordRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="SetPasswordCommandValidator"/> class.
	/// </summary>
	///
	/// <param name="passwordSettings">
	/// The password configuration settings.
	/// </param>
	public SetPasswordCommandValidator(PasswordSettings passwordSettings)
	{
		RuleFor(request => request.Token)
			.NotEmpty()
			.WithMessage("Reset token is required.")
			.Must(BeValidResetToken)
			.WithMessage("Reset token is invalid.");

		RuleFor(request => request.NewPassword)
			.ApplyPasswordRules(passwordSettings);
	}

	/// <summary>
	/// Validates the combined reset token format: {userId}:{base64Token}.
	/// </summary>
	///
	/// <param name="token">
	/// The combined token string.
	/// </param>
	///
	/// <returns>
	/// True when the token contains a numeric user ID and a Base64 reset token.
	/// </returns>
	private static bool BeValidResetToken(string token)
	{
		if (string.IsNullOrWhiteSpace(token))
		{
			return false;
		}

		string[] parts =
			token.Split(
				':',
				2);

		if (parts.Length != 2)
		{
			return false;
		}

		if (!long.TryParse(
			parts[0],
			out _))
		{
			return false;
		}

		try
		{
			Convert.FromBase64String(parts[1]);
			return true;
		}
		catch (FormatException)
		{
			return false;
		}
	}
}