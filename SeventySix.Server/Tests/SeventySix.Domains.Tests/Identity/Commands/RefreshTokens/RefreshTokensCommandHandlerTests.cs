using System;
using System.Threading;
using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Identity.Commands.RefreshTokens;

public class RefreshTokensCommandHandlerTests
{
	[Fact]
	public async Task HandleAsync_WhenUserHasChangedPassword_ReturnsFalseForRequiresPasswordChangeAsync()
	{
		// Arrange
		string refreshToken = "old-refresh";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 200,
				UserName = "oauthuser",
				Email = "oauth@example.com",
				IsActive = true,
				RequiresPasswordChange = false
			};

		tokenService
			.ValidateRefreshTokenAsync(
				refreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		tokenService
			.RotateRefreshTokenAsync(
				refreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns("new-token");

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult expectedAuthResult =
			AuthResult.Succeeded(
				"access-token",
				"new-token",
				now.AddMinutes(15),
				user.Email,
				null,
				false);

		authenticationService
			.GenerateAuthResultAsync(
				user,
				clientIpAddress,
				user.RequiresPasswordChange,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAuthResult));

		RefreshTokensCommand command =
			new(refreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeFalse();
	}

	[Fact]
	public async Task HandleAsync_WhenUserRequiresPasswordChange_ReturnsTrueAsync()
	{
		// Arrange
		string refreshToken = "old-refresh";
		string clientIpAddress = "127.0.0.1";

		ITokenService tokenService =
			Substitute.For<ITokenService>();

		UserManager<ApplicationUser> userManager =
			IdentityMockFactory.CreateUserManager();

		AuthenticationService authenticationService =
			IdentityMockFactory.CreateAuthenticationService();

		ApplicationUser user =
			new()
			{
				Id = 201,
				UserName = "legacyuser",
				Email = "legacy@example.com",
				IsActive = true,
				RequiresPasswordChange = true,
			};

		tokenService
			.ValidateRefreshTokenAsync(
				refreshToken,
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		userManager
			.FindByIdAsync(user.Id.ToString())
			.Returns(user);

		tokenService
			.RotateRefreshTokenAsync(
				refreshToken,
				clientIpAddress,
				Arg.Any<CancellationToken>())
			.Returns("new-token");

		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		AuthResult expectedAuthResult =
			AuthResult.Succeeded(
				"access-token",
				"new-token",
				now.AddMinutes(15),
				user.Email,
				null,
				true);

		authenticationService
			.GenerateAuthResultAsync(
				user,
				clientIpAddress,
				user.RequiresPasswordChange,
				false,
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult(expectedAuthResult));

		RefreshTokensCommand command =
			new(refreshToken, clientIpAddress);

		// Act
		AuthResult result =
			await RefreshTokensCommandHandler.HandleAsync(
				command,
				tokenService,
				userManager,
				authenticationService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeTrue();
	}
}