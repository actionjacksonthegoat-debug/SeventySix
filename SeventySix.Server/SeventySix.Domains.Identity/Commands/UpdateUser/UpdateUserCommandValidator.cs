// <copyright file="UpdateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;
using Wolverine;

namespace SeventySix.Identity.Commands.UpdateUser;

/// <summary>
/// Validator for <see cref="UpdateUserRequest"/>.
/// Ensures data integrity before updating user records.
/// </summary>
public class UpdateUserCommandValidator : AbstractValidator<UpdateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandValidator"/> class.
	/// </summary>
	///
	/// <param name="messageBus">
	/// The Wolverine message bus for CQRS queries.
	/// </param>
	public UpdateUserCommandValidator(IMessageBus messageBus)
	{
		RuleFor(request => request.Id)
			.GreaterThan(0)
			.WithMessage("User ID must be greater than 0");

		RuleFor(request => request.Username).ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules()
			.MustAsync(
				async (command, email, cancellationToken) =>
				{
					bool emailExists =
						await messageBus.InvokeAsync<bool>(
							new CheckEmailExistsQuery(email, command.Id),
							cancellationToken);

					return !emailExists;
				})
			.WithMessage("Email address is already registered.");

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}