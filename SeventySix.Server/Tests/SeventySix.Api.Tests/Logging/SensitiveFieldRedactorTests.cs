// <copyright file="SensitiveFieldRedactorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Logging;
using Shouldly;

namespace SeventySix.Api.Tests.Logging;

/// <summary>
/// Unit tests for <see cref="SensitiveFieldRedactor"/>.
/// </summary>
public sealed class SensitiveFieldRedactorTests
{
	[Theory]
	[InlineData("password")]
	[InlineData("Password")]
	[InlineData("PASSWORD")]
	[InlineData("newPassword")]
	[InlineData("currentPassword")]
	[InlineData("confirmPassword")]
	[InlineData("refreshToken")]
	[InlineData("refresh_token")]
	[InlineData("accessToken")]
	[InlineData("access_token")]
	[InlineData("totpSecret")]
	[InlineData("totp_secret")]
	[InlineData("mfaCode")]
	[InlineData("mfa_code")]
	[InlineData("backupCode")]
	[InlineData("backup_code")]
	[InlineData("secretKey")]
	[InlineData("apiKey")]
	[InlineData("api_key")]
	[InlineData("connectionString")]
	[InlineData("token")]
	public void Redact_SensitiveKey_ReturnsRedacted(string key)
	{
		object? result =
			SensitiveFieldRedactor.Redact(key, "super-secret-value");

		result.ShouldBe(SensitiveFieldRedactor.RedactedValue);
	}

	[Theory]
	[InlineData("username")]
	[InlineData("email")]
	[InlineData("requestPath")]
	[InlineData("statusCode")]
	[InlineData("duration")]
	[InlineData("orderId")]
	public void Redact_NonSensitiveKey_ReturnsOriginalValue(string key)
	{
		string originalValue = "some-value";

		object? result =
			SensitiveFieldRedactor.Redact(key, originalValue);

		result.ShouldBe(originalValue);
	}

	[Fact]
	public void Redact_NullValue_SensitiveKey_ReturnsRedacted()
	{
		object? result =
			SensitiveFieldRedactor.Redact("password", null);

		result.ShouldBe(SensitiveFieldRedactor.RedactedValue);
	}

	[Fact]
	public void Redact_NullValue_NonSensitiveKey_ReturnsNull()
	{
		object? result =
			SensitiveFieldRedactor.Redact("username", null);

		result.ShouldBeNull();
	}

	[Fact]
	public void SensitiveKeys_ContainsExpectedMinimumSet()
	{
		SensitiveFieldRedactor.SensitiveKeys.Count
			.ShouldBeGreaterThanOrEqualTo(14);
	}
}