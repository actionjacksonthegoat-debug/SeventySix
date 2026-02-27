// <copyright file="ValidationExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;
using SeventySix.Identity.Extensions;
using Shouldly;

namespace SeventySix.Identity.Tests.Extensions;

/// <summary>
/// Unit tests for ValidationExtensions.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - ToErrorMessage with single error
/// - ToErrorMessage with multiple errors (joined with space)
/// - ToErrorMessage with no errors (empty string)
/// </remarks>
public sealed class ValidationExtensionsTests
{
	#region ToErrorMessage Tests

	[Fact]
	public void ToErrorMessage_SingleError_ReturnsSingleMessage()
	{
		// Arrange
		ValidationResult result =
			new(
				new List<ValidationFailure>
				{
					new(
						"Property",
						"Field is required"),
				});

		// Act
		string message = result.ToErrorMessage();

		// Assert
		message.ShouldBe("Field is required");
	}

	[Fact]
	public void ToErrorMessage_MultipleErrors_JoinsWithSpace()
	{
		// Arrange
		ValidationResult result =
			new(
				new List<ValidationFailure>
				{
					new(
						"Email",
						"Email is required"),
					new(
						"Password",
						"Password is required"),
					new(
						"Username",
						"Username must be at least 3 characters"),
				});

		// Act
		string message = result.ToErrorMessage();

		// Assert
		message.ShouldBe(
			"Email is required Password is required Username must be at least 3 characters");
	}

	[Fact]
	public void ToErrorMessage_NoErrors_ReturnsEmptyString()
	{
		// Arrange
		ValidationResult result =
			new();

		// Act
		string message = result.ToErrorMessage();

		// Assert
		message.ShouldBeEmpty();
	}

	#endregion
}