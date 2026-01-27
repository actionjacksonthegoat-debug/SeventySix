using System;
using System.Threading;
using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Identity.Commands.RefreshTokens;

/// <summary>
/// Unit tests for <see cref="RefreshTokensCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on token rotation and password change scenarios.
/// </remarks>
public class RefreshTokensCommandHandlerTests
{
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="RefreshTokensCommandHandlerTests"/> class.
	/// </summary>
	public RefreshTokensCommandHandlerTests()
	{
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
	}

	/// <summary>
	/// Tests that a user who has changed their password gets RequiresPasswordChange = false.
	/// </summary>
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
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeFalse();
	}

	/// <summary>
	/// Tests that a user who requires password change gets RequiresPasswordChange = true.
	/// </summary>
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
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeTrue();
	}
}