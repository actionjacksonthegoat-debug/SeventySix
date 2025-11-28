// <copyright file="UserValidationTestDataTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Tests.Identity;

/// <summary>
/// Tests for <see cref="UserValidationTestData"/> to ensure test data integrity.
/// </summary>
/// <remarks>
/// Following TDD principles - testing the test data itself:
/// - Ensures TheoryData collections contain expected values
/// - Validates data meets the validation rule requirements
/// - Acts as documentation for what each data set represents
/// </remarks>
public class UserValidationTestDataTests
{
	#region TooShortUsernames Tests

	[Fact]
	public void TooShortUsernames_ShouldNotBeEmpty()
	{
		// Assert
		Assert.NotEmpty(UserValidationTestData.TooShortUsernames);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.TooShortUsernames), MemberType = typeof(UserValidationTestData))]
	public void TooShortUsernames_ShouldAllBeLessThanThreeCharacters(string username)
	{
		// Assert - Usernames must be < 3 chars to be "too short"
		Assert.True(username.Length < 3, $"Username '{username}' should be less than 3 characters");
	}

	#endregion

	#region InvalidUsernameCharacters Tests

	[Fact]
	public void InvalidUsernameCharacters_ShouldNotBeEmpty()
	{
		// Assert
		Assert.NotEmpty(UserValidationTestData.InvalidUsernameCharacters);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.InvalidUsernameCharacters), MemberType = typeof(UserValidationTestData))]
	public void InvalidUsernameCharacters_ShouldContainNonAlphanumericOrUnderscore(string username)
	{
		// Assert - Each username should contain at least one character that's not alphanumeric or underscore
		bool hasInvalidChar = username.Any(c => !char.IsLetterOrDigit(c) && c != '_');
		Assert.True(hasInvalidChar, $"Username '{username}' should contain invalid characters");
	}

	#endregion

	#region ValidUsernames Tests

	[Fact]
	public void ValidUsernames_ShouldNotBeEmpty()
	{
		// Assert
		Assert.NotEmpty(UserValidationTestData.ValidUsernames);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.ValidUsernames), MemberType = typeof(UserValidationTestData))]
	public void ValidUsernames_ShouldMeetAllRequirements(string username)
	{
		// Assert - Must be 3-50 chars and only alphanumeric/underscore
		Assert.InRange(username.Length, 3, 50);
		Assert.All(username, c => Assert.True(char.IsLetterOrDigit(c) || c == '_'));
	}

	#endregion

	#region InvalidEmails Tests

	[Fact]
	public void InvalidEmails_ShouldNotBeEmpty()
	{
		// Assert
		Assert.NotEmpty(UserValidationTestData.InvalidEmails);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.InvalidEmails), MemberType = typeof(UserValidationTestData))]
	public void InvalidEmails_ShouldNotMatchValidEmailPattern(string email)
	{
		// Assert - Basic check that these are intentionally invalid
		// Either missing @, has multiple @, or has spaces
		bool isObviouslyInvalid =
			!email.Contains('@') ||
			email.Count(c => c == '@') > 1 ||
			email.Contains(' ') ||
			email.StartsWith('@') ||
			email.EndsWith('@');

		Assert.True(isObviouslyInvalid, $"Email '{email}' should be obviously invalid");
	}

	#endregion

	#region ValidEmails Tests

	[Fact]
	public void ValidEmails_ShouldNotBeEmpty()
	{
		// Assert
		Assert.NotEmpty(UserValidationTestData.ValidEmails);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.ValidEmails), MemberType = typeof(UserValidationTestData))]
	public void ValidEmails_ShouldContainExactlyOneAtSymbol(string email)
	{
		// Assert - Basic structural requirement
		int atCount = email.Count(c => c == '@');
		Assert.Equal(1, atCount);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.ValidEmails), MemberType = typeof(UserValidationTestData))]
	public void ValidEmails_ShouldNotExceedMaxLength(string email)
	{
		// Assert - Max length is 255
		Assert.True(email.Length <= 255, $"Email '{email}' exceeds 255 characters");
	}

	#endregion
}