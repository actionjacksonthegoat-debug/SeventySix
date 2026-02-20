// <copyright file="CreateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;
using Wolverine;

namespace SeventySix.Identity.Commands.CreateUser;

/// <summary>
/// FluentValidation validator for CreateUserRequest.
/// Defines validation rules for creating new users.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores only
/// - Email: Required, valid email format, max 255 characters, unique in system
/// - FullName: Optional, max 100 characters if provided
/// - IsActive: No validation (boolean field)
/// </remarks>
public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserCommandValidator"/> class.
	/// </summary>
	///
	/// <param name="messageBus">
	/// The Wolverine message bus for CQRS queries.
	/// </param>
	public CreateUserCommandValidator(IMessageBus messageBus)
	{
		RuleFor(request => request.Username).ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules()
			.MustAsync(
				async (email, cancellationToken) =>
				{
					bool emailExists =
						await messageBus.InvokeAsync<bool>(
							new CheckEmailExistsQuery(email, ExcludeUserId: null),
							cancellationToken);

					return !emailExists;
				})
			.WithMessage("Email address is already registered.");

		RuleFor(request => request.FullName).ApplyFullNameRules(required: true);
	}
}