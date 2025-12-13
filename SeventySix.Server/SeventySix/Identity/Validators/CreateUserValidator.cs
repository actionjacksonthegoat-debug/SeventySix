// <copyright file="CreateUserValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

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
		RuleFor(request => request.Username)
			.ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: true);
	}
}