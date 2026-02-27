// <copyright file="LogSanitizerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Utilities;
using Shouldly;

namespace SeventySix.Shared.Tests.Utilities;

/// <summary>
/// Unit tests for <see cref="LogSanitizer"/> PII masking and log-injection prevention.
/// </summary>
public sealed class LogSanitizerTests
{
	#region Sanitize Tests

	/// <summary>
	/// Returns null for null input without throwing.
	/// </summary>
	[Fact]
	public void Sanitize_NullInput_ReturnsNull()
	{
		string? result =
			LogSanitizer.Sanitize(null);

		result.ShouldBeNull();
	}

	/// <summary>
	/// Strips CR, LF, and CR+LF control characters from input strings.
	/// </summary>
	[Theory]
	[InlineData("\n", "")]
	[InlineData("\r", "")]
	[InlineData("\r\n", "")]
	[InlineData("abc\ndef", "abcdef")]
	[InlineData("abc\rdef", "abcdef")]
	[InlineData("clean", "clean")]
	public void Sanitize_InputWithControlChars_RemovesControlChars(
		string input,
		string expected)
	{
		string? result =
			LogSanitizer.Sanitize(input);

		result.ShouldBe(expected);
	}

	#endregion

	#region MaskEmail Tests

	/// <summary>
	/// Returns masked form showing first char of local part and full domain.
	/// </summary>
	[Fact]
	public void MaskEmail_ValidEmail_ShowsFirstCharAndDomain()
	{
		string result =
			LogSanitizer.MaskEmail("john@example.com");

		result.ShouldBe("j***@example.com");
	}

	/// <summary>
	/// Returns *** for null or empty email input.
	/// </summary>
	[Theory]
	[InlineData(null)]
	[InlineData("")]
	public void MaskEmail_NullOrEmpty_ReturnsMask(string? email)
	{
		string result =
			LogSanitizer.MaskEmail(email!);

		result.ShouldBe("***");
	}

	/// <summary>
	/// Returns *** when input has no @ character or @ is the first character.
	/// </summary>
	[Theory]
	[InlineData("notanemail")]
	[InlineData("@domain.com")]
	public void MaskEmail_MissingOrLeadingAt_ReturnsMask(string email)
	{
		string result =
			LogSanitizer.MaskEmail(email);

		result.ShouldBe("***");
	}

	/// <summary>
	/// Mask format is always 3 asterisks regardless of local-part length.
	/// </summary>
	[Theory]
	[InlineData("a@b.com", "a***@b.com")]
	[InlineData("verylonglocalpart@domain.org", "v***@domain.org")]
	public void MaskEmail_VaryingLocalParts_AlwaysThreeAsterisks(
		string email,
		string expected)
	{
		string result =
			LogSanitizer.MaskEmail(email);

		result.ShouldBe(expected);
	}

	#endregion

	#region MaskUsername Tests

	/// <summary>
	/// Returns masked form showing up to 2 leading characters.
	/// </summary>
	[Theory]
	[InlineData("johndoe", "jo***")]
	[InlineData("ab", "ab***")]
	[InlineData("a", "a***")]
	public void MaskUsername_ValidUsername_ShowsTwoLeadingChars(
		string username,
		string expected)
	{
		string result =
			LogSanitizer.MaskUsername(username);

		result.ShouldBe(expected);
	}

	/// <summary>
	/// Returns *** for null or empty username input.
	/// </summary>
	[Theory]
	[InlineData(null)]
	[InlineData("")]
	public void MaskUsername_NullOrEmpty_ReturnsMask(string? username)
	{
		string result =
			LogSanitizer.MaskUsername(username!);

		result.ShouldBe("***");
	}

	#endregion

	#region MaskEmailSubject Tests

	/// <summary>
	/// Returns [no-subject] for null or empty subject.
	/// </summary>
	[Theory]
	[InlineData(null)]
	[InlineData("")]
	public void MaskEmailSubject_NullOrEmpty_ReturnsNoSubjectLabel(string? subject)
	{
		string result =
			LogSanitizer.MaskEmailSubject(subject);

		result.ShouldBe("[no-subject]");
	}

	/// <summary>
	/// Welcome subject takes priority over password category.
	/// </summary>
	[Fact]
	public void MaskEmailSubject_WelcomeSubject_ReturnsWelcomeLabel()
	{
		string result =
			LogSanitizer.MaskEmailSubject("Welcome to SeventySix - Your Password is Set");

		result.ShouldBe("welcome");
	}

	/// <summary>
	/// Password subject (without Welcome) maps to password-reset category.
	/// </summary>
	[Fact]
	public void MaskEmailSubject_PasswordSubject_ReturnsPasswordResetLabel()
	{
		string result =
			LogSanitizer.MaskEmailSubject("Reset Your Password");

		result.ShouldBe("password-reset");
	}

	/// <summary>
	/// MFA-related subjects map to mfa-code category.
	/// </summary>
	[Theory]
	[InlineData("Your Verification Code")]
	[InlineData("MFA Login Required")]
	public void MaskEmailSubject_MfaSubject_ReturnsMfaCodeLabel(string subject)
	{
		string result =
			LogSanitizer.MaskEmailSubject(subject);

		result.ShouldBe("mfa-code");
	}

	/// <summary>
	/// Email verification subjects map to email-verification category.
	/// </summary>
	[Fact]
	public void MaskEmailSubject_VerificationSubject_ReturnsEmailVerificationLabel()
	{
		string result =
			LogSanitizer.MaskEmailSubject("Verify Your Email Address");

		result.ShouldBe("email-verification");
	}

	/// <summary>
	/// Unknown subjects fall back to a length-only label to avoid leaking content.
	/// </summary>
	[Fact]
	public void MaskEmailSubject_UnknownSubject_ReturnsLengthOnlyLabel()
	{
		const string UnknownSubject = "Hello";

		string result =
			LogSanitizer.MaskEmailSubject(UnknownSubject);

		result.ShouldBe($"[{UnknownSubject.Length}-char-subject]");
	}

	#endregion
}