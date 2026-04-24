// <copyright file="AuthenticationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
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
public sealed class AuthenticationServiceTests
{
	private readonly IAuthRepository AuthRepository;
	private readonly ITokenService TokenService;
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

		ServiceUnderTest =
			new AuthenticationService(
				AuthRepository,
				TokenService,
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
		DateTimeOffset utcNow =
			TestDates.DefaultUtc;

		UserManager
			.GetRolesAsync(user)
			.Returns(roles);

		TokenService
			.IssueAccessToken(
				user.Id,
				user.UserName!,
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					expectedAccessToken,
					utcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				user.Id,
				false,
				Arg.Any<CancellationToken>())
			.Returns(expectedRefreshToken);

		TimeProvider.GetUtcNow().Returns(new DateTimeOffset(utcNow.UtcDateTime));

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
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
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				true, // rememberMe
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			requiresPasswordChange: false,
			rememberMe: true,
			CancellationToken.None);

		// Assert
		await TokenService
			.Received(1)
			.GenerateRefreshTokenAsync(
				user.Id,
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
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
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

		IList<string>? capturedRoles = null;
		TokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Do<IList<string>>(roleList => capturedRoles = roleList),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		capturedRoles.ShouldNotBeNull();
		List<string> roleList =
			[.. capturedRoles];
		roleList.Count.ShouldBe(3);
		roleList.ShouldContain(RoleConstants.User);
		roleList.ShouldContain(RoleConstants.Admin);
		roleList.ShouldContain(RoleConstants.Developer);
	}

	/// <summary>
	/// Verifies IsFirstLogin is true when user has never logged in before (LastLoginAt is null).
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WhenLastLoginAtIsNull_SetsIsFirstLoginTrueAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 6,
				UserName = "firstloginuser",
				Email = "firstlogin@example.com",
				LastLoginAt = null,
			};

		UserManager
			.GetRolesAsync(Arg.Any<ApplicationUser>())
			.Returns(Array.Empty<string>());

		TokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		result.IsFirstLogin.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies IsFirstLogin is false when user has logged in before (LastLoginAt has a value).
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_WhenLastLoginAtHasValue_SetsIsFirstLoginFalseAsync()
	{
		// Arrange
		ApplicationUser user =
			new()
			{
				Id = 7,
				UserName = "returninguser",
				Email = "returning@example.com",
				LastLoginAt = TestDates.DefaultUtc,
			};

		UserManager
			.GetRolesAsync(Arg.Any<ApplicationUser>())
			.Returns(Array.Empty<string>());

		TokenService
			.IssueAccessToken(
				Arg.Any<long>(),
				Arg.Any<string>(),
				Arg.Any<IList<string>>(),
				Arg.Any<bool>())
			.Returns(
				new IssuedAccessToken(
					"token",
					DateTimeOffset.UtcNow.AddMinutes(15)));

		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<long>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow().Returns(TestTimeProviderBuilder.DefaultTime);

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		result.IsFirstLogin.ShouldBeFalse();
	}
}