// <copyright file="UpdateProfileCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;
using Wolverine;

namespace SeventySix.Identity.Commands.UpdateProfile;

/// <summary>
/// FluentValidation validator for <see cref="UpdateProfileCommand"/>.
/// Validates against the command (not request) to access UserId for email uniqueness checks.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters, unique (excluding current user)
/// - FullName: Optional, max 100 characters if provided
/// </remarks>
public sealed class UpdateProfileCommandValidator
	: AbstractValidator<UpdateProfileCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandValidator"/> class.
	/// </summary>
	///
	/// <param name="messageBus">
	/// The Wolverine message bus for CQRS queries.
	/// </param>
	public UpdateProfileCommandValidator(IMessageBus messageBus)
	{
		RuleFor(command => command.Request.Email)
			.ApplyEmailRules()
			.MustAsync(
				async (command, email, cancellationToken) =>
				{
					bool emailExists =
						await messageBus.InvokeAsync<bool>(
							new CheckEmailExistsQuery(
								email,
								command.UserId),
							cancellationToken);

					return !emailExists;
				})
			.WithMessage("Email address is already registered.");

		RuleFor(command => command.Request.FullName)
			.ApplyFullNameRules(required: false);
	}
}