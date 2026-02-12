// <copyright file="AuthenticationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for AuthenticationService.
/// </summary>
/// <remarks>
/// Follows 80/20 rule - tests critical paths only:
/// - Token generation with role loading
/// - Token refresh validation and rotation
/// Focus on business logic, not infrastructure.
/// </remarks>
public class AuthenticationServiceTests
{
	private readonly IAuthRepository AuthRepository;
	private readonly ITokenService TokenService;
	private readonly IOptions<JwtSettings> JwtSettings;
	private readonly TimeProvider TimeProvider;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService ServiceUnderTest;

	public AuthenticationServiceTests()
	{
		AuthRepository =
			Substitute.For<IAuthRepository>();
		TokenService =
			Substitute.For<ITokenService>();
		TimeProvider =
			Substitute.For<TimeProvider>();
		UserManager =
			Substitute.For<UserManager<ApplicationUser>>(
				Substitute.For<IUserStore<ApplicationUser>>(),
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null);

		JwtSettings =
			Options.Create(
			new JwtSettings
			{
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 7,
			});

		ServiceUnderTest =
			new AuthenticationService(
				AuthRepository,
				TokenService,
				JwtSettings,
				TimeProvider,
				UserManager);
	}

	/// <summary>
	/// Verifies authentication returns tokens and updates last login when user is valid.
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WithValidUser_ReturnsSuccessWithTokensAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 1,
				UserName = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
			};

		IList<string> roles =
			[RoleConstants.User];
		string expectedAccessToken = "access_token_123";
		string expectedRefreshToken = "refresh_token_456";
		string clientIp = "192.168.1.1";
		DateTime utcNow =
			TestDates.DefaultUtc;

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		TokenService
			.GenerateAccessToken(
				user.Id,
				user.UserName!,
				Arg.Any<IEnumerable<string>>(),
				Arg.Any<bool>())
			.Returns(expectedAccessToken);

		TokenService
			.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				false,
				Arg.Any<CancellationToken>())
			.Returns(expectedRefreshToken);

		TimeProvider.GetUtcNow().Returns(new DateTimeOffset(utcNow));

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldBe(expectedAccessToken);
		result.RefreshToken.ShouldBe(expectedRefreshToken);
		result.ExpiresAt.ShouldBe(utcNow.AddMinutes(15));
		result.Email.ShouldBe(user.Email);
		result.FullName.ShouldBe(user.FullName);
		result.RequiresPasswordChange.ShouldBeFalse();

		await AuthRepository
			.Received(1)
			.UpdateLastLoginAsync(
				user.Id,
				utcNow,
				clientIp,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies remember-me flag is forwarded to the token service when set.
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WithRememberMe_PassesToTokenServiceAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 2,
				UserName = "rememberuser",
				Email = "remember@example.com",
			};

		UserManager
			.GetRolesAsync(Arg.Any<ApplicationUser>())
			.Returns(Array.Empty<string>());

		TokenService
			.GenerateAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IEnumerable<string>>(),
				Arg.Any<bool>())
			.Returns("token");

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<string?>(),
				true, // rememberMe
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			"127.0.0.1",
			requiresPasswordChange: false,
			rememberMe: true,
			CancellationToken.None);

		// Assert
		await TokenService
			.Received(1)
			.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				true, // Verify rememberMe was passed through
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies RequiresPasswordChange flag is set in result when requested.
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WithRequiresPasswordChange_SetsFlagAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 3L,
				UserName = "newuser",
				Email = "new@example.com",
			};

		UserManager
			.GetRolesAsync(Arg.Any<ApplicationUser>())
			.Returns(Array.Empty<string>());

		TokenService
			.GenerateAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IEnumerable<string>>(),
				Arg.Any<bool>())
			.Returns("token");

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			null,
			requiresPasswordChange: true,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		result.RequiresPasswordChange.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies multiple roles are aggregated and passed to token generation.
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WithMultipleRoles_IncludesAllRolesAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 4,
				UserName = "admin",
				Email = "admin@example.com",
			};

		IList<string> roles =
			[
			RoleConstants.User,
			RoleConstants.Admin,
			RoleConstants.Developer,
		];

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		IEnumerable<string>? capturedRoles = null;
		TokenService
			.GenerateAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Do<IEnumerable<string>>(roleList => capturedRoles = roleList),
				Arg.Any<bool>())
			.Returns("token");

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			null,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		capturedRoles.ShouldNotBeNull();
		List<string> roleList =
			capturedRoles.ToList();
		roleList.Count.ShouldBe(3);
		roleList.ShouldContain(RoleConstants.User);
		roleList.ShouldContain(RoleConstants.Admin);
		roleList.ShouldContain(RoleConstants.Developer);
	}
}