// <copyright file="TotpServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using OtpNet;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for TotpService.
/// Tests TOTP secret generation and code verification.
/// </summary>
public class TotpServiceUnitTests
{
	private readonly IOptions<TotpSettings> Settings;
	private readonly TotpService Service;

	public TotpServiceUnitTests()
	{
		Settings =
			Options.Create(
				new TotpSettings
				{
					IssuerName = "TestApp",
					AllowedTimeStepDrift = 1,
					TimeStepSeconds = 30
				});

		Service =
			new TotpService(Settings);
	}

	#region GenerateSecret Tests

	[Fact]
	public void GenerateSecret_ReturnsBase32EncodedString()
	{
		// Act
		string secret =
			Service.GenerateSecret();

		// Assert
		secret.ShouldNotBeNullOrEmpty();
		// Base32 uses A-Z and 2-7, should be decodable
		byte[] decoded =
			Base32Encoding.ToBytes(secret);
		decoded.Length.ShouldBe(20); // 160 bits = 20 bytes
	}

	[Fact]
	public void GenerateSecret_GeneratesUniqueSecrets()
	{
		// Arrange
		HashSet<string> secrets =
			[];

		// Act
		for (int index = 0; index < 100; index++)
		{
			secrets.Add(Service.GenerateSecret());
		}

		// Assert - All secrets should be unique
		secrets.Count.ShouldBe(100);
	}

	#endregion

	#region GenerateSetupUri Tests

	[Fact]
	public void GenerateSetupUri_ReturnsValidOtpauthUri()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();
		const string userEmail = "test@example.com";

		// Act
		string uri =
			Service.GenerateSetupUri(
				secret,
				userEmail);

		// Assert
		uri.ShouldStartWith("otpauth://totp/");
		uri.ShouldContain("TestApp");
		uri.ShouldContain(secret);
		uri.ShouldContain("test%40example.com");
		uri.ShouldContain("algorithm=SHA1");
		uri.ShouldContain("digits=6");
		uri.ShouldContain("period=30");
	}

	[Fact]
	public void GenerateSetupUri_EncodesSpecialCharacters()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();
		const string userEmail = "user+test@example.com";

		// Act
		string uri =
			Service.GenerateSetupUri(
				secret,
				userEmail);

		// Assert - Special characters should be URL encoded
		uri.ShouldContain("user%2Btest%40example.com");
	}

	#endregion

	#region VerifyCode Tests

	[Fact]
	public void VerifyCode_ValidCode_ReturnsTrue()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();
		byte[] secretBytes =
			Base32Encoding.ToBytes(secret);
		Totp totp =
			new(secretBytes, step: 30);
		string validCode =
			totp.ComputeTotp();

		// Act
		bool result =
			Service.VerifyCode(
				secret,
				validCode);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public void VerifyCode_InvalidCode_ReturnsFalse()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();

		// Act
		bool result =
			Service.VerifyCode(
				secret,
				"000000");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void VerifyCode_WrongLengthCode_ReturnsFalse()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();

		// Act
		bool result =
			Service.VerifyCode(
				secret,
				"123");

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void VerifyCode_EmptyCode_ReturnsFalse()
	{
		// Arrange
		string secret =
			Service.GenerateSecret();

		// Act
		bool result =
			Service.VerifyCode(
				secret,
				string.Empty);

		// Assert
		result.ShouldBeFalse();
	}

	#endregion
}