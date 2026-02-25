// <copyright file="UserValidationTestDataTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Shouldly;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Tests for <see cref="UserValidationTestData"/> to ensure test data integrity.
/// </summary>
/// <remarks>
/// Following TDD principles - testing the test data itself:
/// - Ensures TheoryData collections contain expected values
/// - Validates data meets the validation rule requirements
/// - Acts as documentation for what each data set represents
/// </remarks>
public sealed class UserValidationTestDataTests
{
	#region TooShortUsernames Tests

	[Fact]
	public void TooShortUsernames_ShouldNotBeEmpty()
	{
		// Assert
		UserValidationTestData.TooShortUsernames.Count.ShouldBeGreaterThan(0);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.TooShortUsernames),
		MemberType = typeof(UserValidationTestData)
	)]
	public void TooShortUsernames_ShouldAllBeLessThanThreeCharacters(
		string username)
	{
		// Assert - Usernames must be < 3 chars to be "too short"
		(username.Length < 3).ShouldBeTrue(
			$"Username '{username}' should be less than 3 characters");
	}

	#endregion

	#region InvalidUsernameCharacters Tests

	[Fact]
	public void InvalidUsernameCharacters_ShouldNotBeEmpty()
	{
		// Assert
		UserValidationTestData.InvalidUsernameCharacters.Count.ShouldBeGreaterThan(0);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.InvalidUsernameCharacters),
		MemberType = typeof(UserValidationTestData)
	)]
	public void InvalidUsernameCharacters_ShouldContainNonAlphanumericOrUnderscore(
		string username)
	{
		// Assert - Each username should contain at least one character that's not alphanumeric or underscore
		bool hasInvalidChar =
			username.Any(
				character =>
					!char.IsLetterOrDigit(character)
						&& character != '_');
		hasInvalidChar.ShouldBeTrue(
			$"Username '{username}' should contain invalid characters");
	}

	#endregion

	#region ValidUsernames Tests

	[Fact]
	public void ValidUsernames_ShouldNotBeEmpty()
	{
		// Assert
		UserValidationTestData.ValidUsernames.Count.ShouldBeGreaterThan(0);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.ValidUsernames),
		MemberType = typeof(UserValidationTestData)
	)]
	public void ValidUsernames_ShouldMeetAllRequirements(string username)
	{
		// Assert - Must be 3-50 chars and only alphanumeric/underscore
		username.Length.ShouldBeInRange(3, 50);
		username.ShouldAllBe(
			character =>
				char.IsLetterOrDigit(character)
					|| character == '_');
	}

	#endregion

	#region InvalidEmails Tests

	[Fact]
	public void InvalidEmails_ShouldNotBeEmpty()
	{
		// Assert
		UserValidationTestData.InvalidEmails.Count.ShouldBeGreaterThan(0);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.InvalidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public void InvalidEmails_ShouldNotMatchValidEmailPattern(string email)
	{
		// Assert - Basic check that these are intentionally invalid
		// Either missing @, has multiple @, or has spaces
		bool isObviouslyInvalid =
			!email.Contains('@')
			|| email.Count(character => character == '@') > 1
			|| email.Contains(' ')
			|| email.StartsWith('@')
			|| email.EndsWith('@');

		isObviouslyInvalid.ShouldBeTrue(
			$"Email '{email}' should be obviously invalid");
	}

	#endregion

	#region ValidEmails Tests

	[Fact]
	public void ValidEmails_ShouldNotBeEmpty()
	{
		// Assert
		UserValidationTestData.ValidEmails.Count.ShouldBeGreaterThan(0);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.ValidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public void ValidEmails_ShouldContainExactlyOneAtSymbol(string email)
	{
		// Assert - Basic structural requirement
		int atCount =
			email.Count(character => character == '@');
		atCount.ShouldBe(1);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.ValidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public void ValidEmails_ShouldNotExceedMaxLength(string email)
	{
		// Assert - Max length is 255
		(email.Length <= 255).ShouldBeTrue(
			$"Email '{email}' exceeds 255 characters");
	}

	#endregion
}