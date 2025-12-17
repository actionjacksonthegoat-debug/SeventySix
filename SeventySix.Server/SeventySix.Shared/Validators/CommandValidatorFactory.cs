// <copyright file="CommandValidatorFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Linq.Expressions;
using FluentValidation;

namespace SeventySix.Shared.Validators;

/// <summary>
/// Factory for creating command validators that delegate to request validators.
/// Eliminates need for multiple single-purpose wrapper validator classes.
/// Follows DRY principle by centralizing delegation pattern.
/// </summary>
public static class CommandValidatorFactory
{
	/// <summary>
	/// Creates a command validator that delegates validation to the request validator.
	/// </summary>
	/// <typeparam name="TCommand">The command type to validate.</typeparam>
	/// <typeparam name="TRequest">The request type nested within the command.</typeparam>
	/// <param name="requestValidator">The validator for the request type.</param>
	/// <param name="requestSelector">Expression selecting the request from the command.</param>
	/// <returns>A validator for the command type.</returns>
	public static IValidator<TCommand> CreateFor<TCommand, TRequest>(
		IValidator<TRequest> requestValidator,
		Expression<Func<TCommand, TRequest>> requestSelector)
	{
		InlineValidator<TCommand> commandValidator = [];

		commandValidator
			.RuleFor(requestSelector)
			.SetValidator(requestValidator);

		return commandValidator;
	}
}