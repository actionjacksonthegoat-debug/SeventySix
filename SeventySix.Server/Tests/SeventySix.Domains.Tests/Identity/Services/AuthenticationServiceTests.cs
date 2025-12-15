// <copyright file="AuthenticationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Domains.Tests.Identity.Services;

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
	private readonly IUserQueryRepository UserQueryRepository;
	private readonly ITokenService TokenService;
	private readonly IOptions<JwtSettings> JwtSettings;
	private readonly TimeProvider TimeProvider;
	private readonly AuthenticationService ServiceUnderTest;

	public AuthenticationServiceTests()
	{
		AuthRepository = Substitute.For<IAuthRepository>();
		UserQueryRepository = Substitute.For<IUserQueryRepository>();
		TokenService = Substitute.For<ITokenService>();
		TimeProvider = Substitute.For<TimeProvider>();

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
				UserQueryRepository,
				TokenService,
				JwtSettings,
				TimeProvider);
	}

	[Fact]
	public async Task GenerateAuthResultAsync_WithValidUser_ReturnsSuccessWithTokensAsync()
	{
		// Arrange
		User user =
			new()
			{
				Id = 1,
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
			};

		string[] roles = [RoleConstants.User];
		string expectedAccessToken = "access_token_123";
		string expectedRefreshToken = "refresh_token_456";
		string clientIp = "192.168.1.1";
		DateTime utcNow = new(2025, 12, 9, 10, 0, 0, DateTimeKind.Utc);

		UserQueryRepository.GetUserRolesAsync(
				user.Id,
				Arg.Any<CancellationToken>())
			.Returns(roles);

		TokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				Arg.Any<List<string>>())
			.Returns(expectedAccessToken);

		TokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				false,
				Arg.Any<CancellationToken>())
			.Returns(expectedRefreshToken);

		TimeProvider.GetUtcNow()
			.Returns(new DateTimeOffset(utcNow));

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
				user,
				clientIp,
				requiresPasswordChange: false,
				rememberMe: false,
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		Assert.Equal(
			expectedAccessToken,
			result.AccessToken);
		Assert.Equal(
			expectedRefreshToken,
			result.RefreshToken);
		Assert.Equal(
			utcNow.AddMinutes(15),
			result.ExpiresAt);
		Assert.False(result.RequiresPasswordChange);

		await AuthRepository.Received(1)
			.UpdateLastLoginAsync(
				user.Id,
				utcNow,
				clientIp,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GenerateAuthResultAsync_WithRememberMe_PassesToTokenServiceAsync()
	{
		// Arrange
		User user =
			new()
			{
				Id = 2,
				Username = "rememberuser",
				Email = "remember@example.com",
			};

		UserQueryRepository.GetUserRolesAsync(
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(Array.Empty<string>());

		TokenService.GenerateAccessToken(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string?>(),
				Arg.Any<List<string>>())
			.Returns("token");

		TokenService.GenerateRefreshTokenAsync(
				Arg.Any<int>(),
				Arg.Any<string?>(),
				true, // rememberMe
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow()
			.Returns(DateTimeOffset.UtcNow);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			"127.0.0.1",
			requiresPasswordChange: false,
			rememberMe: true,
			CancellationToken.None);

		// Assert
		await TokenService.Received(1)
			.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				true, // Verify rememberMe was passed through
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GenerateAuthResultAsync_WithRequiresPasswordChange_SetsFlagAsync()
	{
		// Arrange
		User user =
			new()
			{
				Id = 3,
				Username = "newuser",
				Email = "new@example.com",
			};

		UserQueryRepository.GetUserRolesAsync(
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(Array.Empty<string>());

		TokenService.GenerateAccessToken(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string?>(),
				Arg.Any<List<string>>())
			.Returns("token");

		TokenService.GenerateRefreshTokenAsync(
				Arg.Any<int>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow()
			.Returns(DateTimeOffset.UtcNow);

		// Act
		AuthResult result =
			await ServiceUnderTest.GenerateAuthResultAsync(
				user,
				null,
				requiresPasswordChange: true,
				rememberMe: false,
				CancellationToken.None);

		// Assert
		Assert.True(result.RequiresPasswordChange);
	}

	[Fact]
	public async Task GenerateAuthResultAsync_WithMultipleRoles_IncludesAllRolesAsync()
	{
		// Arrange
		User user =
			new()
			{
				Id = 4,
				Username = "admin",
				Email = "admin@example.com",
			};

		string[] roles =
		[
			RoleConstants.User,
			RoleConstants.Admin,
			RoleConstants.Developer,
		];

		UserQueryRepository.GetUserRolesAsync(
				user.Id,
				Arg.Any<CancellationToken>())
			.Returns(roles);

		List<string>? capturedRoles = null;
		TokenService.GenerateAccessToken(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string?>(),
				Arg.Do<List<string>>(r => capturedRoles = r))
			.Returns("token");

		TokenService.GenerateRefreshTokenAsync(
				Arg.Any<int>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("refresh");

		TimeProvider.GetUtcNow()
			.Returns(DateTimeOffset.UtcNow);

		// Act
		await ServiceUnderTest.GenerateAuthResultAsync(
			user,
			null,
			requiresPasswordChange: false,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		Assert.NotNull(capturedRoles);
		Assert.Equal(
			3,
			capturedRoles.Count);
		Assert.Contains(
			RoleConstants.User,
			capturedRoles);
		Assert.Contains(
			RoleConstants.Admin,
			capturedRoles);
		Assert.Contains(
			RoleConstants.Developer,
			capturedRoles);
	}
}