using SeventySix.Shared;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.POCOs;
using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Identity.Services;

public class RegistrationTokenServiceTests
{
	[Fact]
	public void Encode_WithValidInputs_ReturnsUrlSafeString()
	{
		// Arrange
		string testEmail = "test@example.com";
		string verificationToken = "verification-token-123";

		// Act
		string encodedToken =
			RegistrationTokenService.Encode(
				testEmail,
				verificationToken);

		// Assert
		encodedToken.ShouldNotBeNullOrWhiteSpace();
		encodedToken.ShouldNotContain("+");
		encodedToken.ShouldNotContain("/");
		encodedToken.ShouldNotContain("=");
	}

	[Fact]
	public void Decode_WithValidToken_ReturnsOriginalValues()
	{
		// Arrange
		string testEmail = "test@example.com";
		string verificationToken = "verification-token-123";
		string encodedToken =
			RegistrationTokenService.Encode(testEmail, verificationToken);

		// Act
		CombinedRegistrationToken? decodedToken =
			RegistrationTokenService.Decode(encodedToken);

		// Assert
		decodedToken.ShouldNotBeNull();
		decodedToken!.Email.ShouldBe(testEmail);
		decodedToken.Token.ShouldBe(verificationToken);
	}

	[Fact]
	public void Decode_WithInvalidToken_ReturnsNull()
	{
		// Arrange
		string invalidToken = "not-a-valid-base64-token";

		// Act
		CombinedRegistrationToken? decodedToken =
			RegistrationTokenService.Decode(invalidToken);

		// Assert
		decodedToken.ShouldBeNull();
	}

	[Fact]
	public void Decode_WithEmptyOrWhitespace_ReturnsNull()
	{
		// Act & Assert
		RegistrationTokenService.Decode(string.Empty).ShouldBeNull();
		RegistrationTokenService.Decode("   ").ShouldBeNull();
	}
}