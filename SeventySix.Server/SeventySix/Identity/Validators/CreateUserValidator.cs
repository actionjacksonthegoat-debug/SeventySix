// <copyright file="CreateUserValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for CreateUserRequest.
/// Defines validation rules for creating new users.
/// </summary>
/// <remarks>
/// This validator implements the Strategy pattern for validation logic,
/// separating validation concerns from business logic.
///
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores only
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// - IsActive: No validation (boolean field)
///
/// The validator is automatically discovered and registered by FluentValidation
/// during service registration.
///
/// Integration: Works with GlobalExceptionMiddleware to return standardized
/// ValidationProblemDetails responses (HTTP 400) when validation fails.
/// </remarks>
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserValidator"/> class.
	/// Configures all validation rules for the CreateUserRequest.
	/// </summary>
	/// <remarks>
	/// Rules are defined in the constructor following FluentValidation conventions.
	/// Each rule includes descriptive error messages for clear client feedback.
	/// </remarks>
	public CreateUserValidator()
	{
		// Username validation: Required, length constraints, and format
		RuleFor(x => x.Username)
			.NotEmpty()
			.WithMessage("Username is required")
			.Length(3, 50)
			.WithMessage("Username must be between 3 and 50 characters")
			.Matches(@"^[a-zA-Z0-9_]+$")
			.WithMessage("Username must contain only alphanumeric characters and underscores");

		// Email validation: Required and valid email format
		RuleFor(x => x.Email)
			.Cascade(FluentValidation.CascadeMode.Stop)
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address")
			.Matches(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")
			.WithMessage("Email must be a valid email address");

		// FullName validation: Optional field with length constraint
		RuleFor(x => x.FullName)
			.MaximumLength(100)
			.When(x => !string.IsNullOrWhiteSpace(x.FullName))
			.WithMessage("Full name must not exceed 100 characters");
	}
}
