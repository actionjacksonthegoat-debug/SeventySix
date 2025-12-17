// <copyright file="CreateClientLogCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Logging.Commands.CreateClientLog;

/// <summary>FluentValidation validator for CreateLogRequest.</summary>
public class CreateClientLogCommandValidator
	: AbstractValidator<CreateLogRequest>
{
	/// <summary>Initializes a new instance of the <see cref="CreateClientLogCommandValidator"/> class.</summary>
	public CreateClientLogCommandValidator()
	{
		RuleFor(request => request.LogLevel)
			.NotEmpty()
			.WithMessage("LogLevel is required")
			.Must(level => LogLevelConstants.CreateLevels.Contains(level))
			.WithMessage(
				$"LogLevel must be one of: {string.Join(", ", LogLevelConstants.CreateLevels)}");

		RuleFor(request => request.Message)
			.NotEmpty()
			.WithMessage("Message is required")
			.MaximumLength(4000)
			.WithMessage("Message must not exceed 4000 characters");

		RuleFor(request => request.ExceptionMessage)
			.MaximumLength(4000)
			.WithMessage("ExceptionMessage must not exceed 4000 characters");

		RuleFor(request => request.StackTrace)
			.MaximumLength(8000)
			.WithMessage("StackTrace must not exceed 8000 characters");

		RuleFor(request => request.SourceContext)
			.MaximumLength(500)
			.WithMessage("SourceContext must not exceed 500 characters");

		RuleFor(request => request.RequestUrl)
			.MaximumLength(2000)
			.WithMessage("RequestUrl must not exceed 2000 characters");

		RuleFor(request => request.RequestMethod)
			.MaximumLength(10)
			.WithMessage("RequestMethod must not exceed 10 characters");

		RuleFor(request => request.UserAgent)
			.MaximumLength(1000)
			.WithMessage("UserAgent must not exceed 1000 characters");

		RuleFor(request => request.CorrelationId)
			.MaximumLength(64)
			.WithMessage("CorrelationId must not exceed 64 characters");
	}
}