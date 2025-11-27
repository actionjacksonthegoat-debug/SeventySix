// <copyright file="UserValidationTestData.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Tests.Identity;

/// <summary>
/// Reusable test data for user validation tests using TheoryData.
/// </summary>
/// <remarks>
/// Centralizes test data for validation tests, enabling:
/// - DRY principle: Single source of truth for validation test cases
/// - Maintainability: Add/modify test cases in one place
/// - Readability: Clear naming of what each data set represents
///
/// Usage with xUnit MemberData:
/// <code>
/// [Theory]
/// [MemberData(nameof(UserValidationTestData.TooShortUsernames), MemberType = typeof(UserValidationTestData))]
/// public void Username_ShouldHaveError_WhenTooShort(string username)
/// </code>
///
/// Design Pattern: Test Data Builder / Object Mother (simplified)
/// </remarks>
public static class UserValidationTestData
{
	/// <summary>
	/// Gets usernames that are too short (less than 3 characters).
	/// </summary>
	/// <remarks>
	/// Validation rule: Username must be between 3 and 50 characters.
	/// </remarks>
	public static TheoryData<string> TooShortUsernames =>
	[
		"ab",  // 2 chars
		"a",   // 1 char
	];

	/// <summary>
	/// Gets usernames containing invalid characters.
	/// </summary>
	/// <remarks>
	/// Validation rule: Username must contain only alphanumeric characters and underscores.
	/// </remarks>
	public static TheoryData<string> InvalidUsernameCharacters =>
	[
		"user name",   // Contains space
		"user-name",   // Contains hyphen
		"user.name",   // Contains dot
		"user@name",   // Contains @
		"user#name",   // Contains special char
		"user!name",   // Contains exclamation
	];

	/// <summary>
	/// Gets valid usernames that should pass all validation rules.
	/// </summary>
	/// <remarks>
	/// Valid usernames: 3-50 chars, alphanumeric and underscore only.
	/// </remarks>
	public static TheoryData<string> ValidUsernames =>
	[
		"abc",         // Min length (3 chars)
		"user123",     // Alphanumeric
		"john_doe",    // With underscore
		"User_123",    // Mixed case with number and underscore
		"A1_b2_C3",    // Complex valid format
	];

	/// <summary>
	/// Gets invalid email formats.
	/// </summary>
	/// <remarks>
	/// Validation rule: Email must be a valid email address.
	/// </remarks>
	public static TheoryData<string> InvalidEmails =>
	[
		"notanemail",       // No @ symbol
		"@example.com",     // Missing local part
		"user@",            // Missing domain
		"user @example.com", // Space in local part
		"user@exam ple.com", // Space in domain
		"user@@example.com", // Double @
	];

	/// <summary>
	/// Gets valid email formats.
	/// </summary>
	/// <remarks>
	/// Various valid email formats that should pass validation.
	/// </remarks>
	public static TheoryData<string> ValidEmails =>
	[
		"user@example.com",
		"john.doe@example.com",
		"user+tag@example.co.uk",
		"test_user123@sub.example.com",
		"a@b.co",
	];
}
