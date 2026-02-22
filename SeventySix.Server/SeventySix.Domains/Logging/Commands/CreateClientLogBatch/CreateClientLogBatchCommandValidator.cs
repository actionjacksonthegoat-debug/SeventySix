// <copyright file="CreateClientLogBatchCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Logging.Commands.CreateClientLog;

namespace SeventySix.Logging.Commands.CreateClientLogBatch;

/// <summary>
/// FluentValidation validator for <see cref="CreateClientLogBatchCommand"/>.
/// Validates each log request element using the single-item validator rules.
/// </summary>
public sealed class CreateClientLogBatchCommandValidator
	: AbstractValidator<CreateClientLogBatchCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateClientLogBatchCommandValidator"/> class.
	/// </summary>
	public CreateClientLogBatchCommandValidator()
	{
		RuleForEach(command => command.Requests)
			.SetValidator(new CreateClientLogCommandValidator());
	}
}