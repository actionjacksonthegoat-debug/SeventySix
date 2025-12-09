// <copyright file="AuthServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Integration tests for AuthService.
/// Tests login, registration, and token operations using real PostgreSQL.
/// </summary>
/// <remarks>
/// Uses Testcontainers PostgreSQL for realistic database testing.
/// Mocks external dependencies (TokenService, HttpClientFactory).
///
/// Coverage Focus:
/// - LoginAsync (valid/invalid credentials, inactive account)
/// - RegisterAsync (new user, duplicate username/email)
/// - RefreshTokensAsync (valid/invalid tokens)
/// - User with multiple roles (additive)
/// </remarks>
[Collection("DatabaseTests")]
public class AuthServiceTests(TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private readonly ITokenService TokenService = Substitute.For<ITokenService>();
	private readonly IHttpClientFactory HttpClientFactory = Substitute.For<IHttpClientFactory>();
	private readonly ILogger<AuthService> Logger = Substitute.For<ILogger<AuthService>>();

	/// <summary>
	/// Fixed time for deterministic tests. Uses shared constant from TestTimeProviderBuilder.
	/// </summary>
	private static DateTimeOffset FixedTime => TestTimeProviderBuilder.DefaultTime;

	private static IOptions<JwtSettings> JwtOptions =>
		Options.Create(
			new JwtSettings
			{
				SecretKey = "Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%",
				Issuer = "https://test.issuer.com",
				Audience = "https://test.audience.com",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 7
			});

	private IOptions<AuthSettings> AuthOptions =>
		Options.Create(
			new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					ClientCallbackUrl = "http://localhost:4200/auth/callback",
					Providers =
					[
						new OAuthProviderSettings
						{
							Provider = OAuthProviderConstants.GitHub,
							ClientId = "test-client-id",
							ClientSecret = "test-client-secret",
							Scopes = "read:user user:email",
							AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
							TokenEndpoint = "https://github.com/login/oauth/access_token",
							UserInfoEndpoint = "https://api.github.com/user",
							RedirectUri = "https://localhost:7074/api/v1/auth/github/callback"
						}
					]
				},
				RateLimit = new AuthRateLimitSettings
				{
					LoginAttemptsPerMinute = 5,
					RegisterAttemptsPerHour = 3,
					TokenRefreshPerMinute = 10
				},
				Cookie = new AuthCookieSettings
				{
					RefreshTokenCookieName = "X-Refresh-Token",
					OAuthStateCookieName = "X-OAuth-State",
					OAuthCodeVerifierCookieName = "X-OAuth-CodeVerifier",
					SecureCookie = true
				},
				Password = new PasswordSettings
				{
					MinLength = 8,
					RequireUppercase = true,
					RequireLowercase = true,
					RequireDigit = true,
					RequireSpecialChar = false,
					WorkFactor = 4 // Lower for tests
				},
				Token = new TokenSettings(),
				Lockout = new LockoutSettings
				{
					Enabled = true,
					MaxFailedAttempts = 5,
					LockoutDurationMinutes = 15
				}
			});

	private AuthService CreateService(IdentityDbContext context)
	{
		AuthRepository authRepository = new(context);
		CredentialRepository credentialRepository = new(context);
		UserRepository userQueryRepository = new(
			context,
			Substitute.For<ILogger<UserRepository>>(),
			TimeProvider.System);

		return new AuthService(
			authRepository,
			credentialRepository,
			userQueryRepository,
			userQueryRepository,
			TokenService,
			HttpClientFactory,
			AuthOptions,
			JwtOptions,
			TestTimeProviderBuilder.CreateDefault(),
			new TransactionManager(context),
			Logger);
	}

	#region LoginAsync Tests

	[Fact]
	public async Task LoginAsync_ValidCredentials_ReturnsSuccessAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				$"validcreds_{testId}",
				$"validcreds_{testId}@example.com",
				"Password123");

		SetupTokenServiceMock(user);

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: $"validcreds_{testId}",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		Assert.Equal("test-access-token", result.AccessToken);
		Assert.Equal("test-refresh-token", result.RefreshToken);
	}

	[Fact]
	public async Task LoginAsync_ValidEmailCredentials_ReturnsSuccessAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				$"emailcreds_{testId}",
				$"emailcreds_{testId}@example.com",
				"Password123");

		SetupTokenServiceMock(user);

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: $"emailcreds_{testId}@example.com",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
	}

	[Fact]
	public async Task LoginAsync_InvalidUsername_ReturnsFailureAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "nonexistent",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.InvalidCredentials, result.ErrorCode);
	}

	[Fact]
	public async Task LoginAsync_InvalidPassword_ReturnsFailureAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		await CreateTestUserWithPasswordAsync(
			context,
			$"badpass_{testId}",
			$"badpass_{testId}@example.com",
			"Password123");

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: $"badpass_{testId}",
				Password: "WrongPassword");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.InvalidCredentials, result.ErrorCode);
	}

	[Fact]
	public async Task LoginAsync_InactiveAccount_ReturnsFailureAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		await CreateTestUserWithPasswordAsync(
			context,
			$"inactive_{testId}",
			$"inactive_{testId}@example.com",
			"Password123",
			isActive: false);

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: $"inactive_{testId}",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.AccountInactive, result.ErrorCode);
	}

	[Fact]
	public async Task LoginAsync_LockedAccount_ReturnsAccountLockedAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"lockeduser",
				"locked@example.com",
				"Password123");

		// Lock the account
		user.FailedLoginCount = 5;
		user.LockoutEndUtc = FixedTime.AddMinutes(15).UtcDateTime;
		await context.SaveChangesAsync();

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "lockeduser",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.AccountLocked, result.ErrorCode);
	}

	[Fact]
	public async Task LoginAsync_ExpiredLockout_AllowsLoginAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"expiredlockuser",
				"expiredlock@example.com",
				"Password123");

		// Set expired lockout (in the past)
		user.FailedLoginCount = 5;
		user.LockoutEndUtc = FixedTime.AddMinutes(-1).UtcDateTime;
		await context.SaveChangesAsync();

		SetupTokenServiceMock(user);

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "expiredlockuser",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
	}

	[Fact]
	public async Task LoginAsync_FailedAttempts_IncrementsCounterAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"failuser",
				"fail@example.com",
				"Password123");

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "failuser",
				Password: "WrongPassword");

		// Act - attempt 3 failed logins
		await service.LoginAsync(
			request,
			"127.0.0.1",
			CancellationToken.None);
		await service.LoginAsync(
			request,
			"127.0.0.1",
			CancellationToken.None);
		await service.LoginAsync(
			request,
			"127.0.0.1",
			CancellationToken.None);

		// Assert
		await context.Entry(user).ReloadAsync();
		Assert.Equal(3, user.FailedLoginCount);
		Assert.Null(user.LockoutEndUtc); // Not locked yet
	}

	[Fact]
	public async Task LoginAsync_MaxFailedAttempts_LocksAccountAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"maxfailuser",
				"maxfail@example.com",
				"Password123");

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "maxfailuser",
				Password: "WrongPassword");

		// Act - attempt 5 failed logins (max)
		for (int i = 0; i < 5; i++)
		{
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);
		}

		// Assert
		await context.Entry(user).ReloadAsync();
		Assert.Equal(5, user.FailedLoginCount);
		Assert.NotNull(user.LockoutEndUtc);
		Assert.True(user.LockoutEndUtc > FixedTime.UtcDateTime);
	}

	[Fact]
	public async Task LoginAsync_SuccessfulLogin_ResetsLockoutCounterAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				$"resetlock_{testId}",
				$"resetlock_{testId}@example.com",
				"Password123");

		// Set some failed attempts (but not locked)
		user.FailedLoginCount = 3;
		await context.SaveChangesAsync();

		SetupTokenServiceMock(user);

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: $"resetlock_{testId}",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		await context.Entry(user).ReloadAsync();
		Assert.Equal(0, user.FailedLoginCount);
		Assert.Null(user.LockoutEndUtc);
	}

	#endregion

	#region RefreshTokensAsync Tests

	[Fact]
	public async Task RefreshTokensAsync_ValidToken_ReturnsNewTokensAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				$"refresh_{testId}",
				$"refresh_{testId}@example.com",
				"Password123");

		TokenService
			.ValidateRefreshTokenAsync(
				"valid-refresh-token",
				Arg.Any<CancellationToken>())
			.Returns(user.Id);

		SetupTokenServiceMock(user);

		AuthService service = CreateService(context);

		// Act
		AuthResult result =
			await service.RefreshTokensAsync(
				"valid-refresh-token",
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		Assert.Equal("test-access-token", result.AccessToken);
	}

	[Fact]
	public async Task RefreshTokensAsync_InvalidToken_ReturnsFailureAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		TokenService
			.ValidateRefreshTokenAsync(
				"invalid-refresh-token",
				Arg.Any<CancellationToken>())
			.Returns((int?)null);

		AuthService service = CreateService(context);

		// Act
		AuthResult result =
			await service.RefreshTokensAsync(
				"invalid-refresh-token",
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.InvalidToken, result.ErrorCode);
	}

	[Fact]
	public async Task RefreshTokensAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		TokenService
			.ValidateRefreshTokenAsync(
				"valid-refresh-token",
				Arg.Any<CancellationToken>())
			.Returns(99999); // Non-existent user ID

		AuthService service = CreateService(context);

		// Act
		AuthResult result =
			await service.RefreshTokensAsync(
				"valid-refresh-token",
				"127.0.0.1",
				CancellationToken.None);

		// Assert - service returns AccountInactive for non-existent or inactive users
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.AccountInactive, result.ErrorCode);
	}

	#endregion

	#region Multiple Roles Tests

	[Fact]
	public async Task LoginAsync_UserWithMultipleRoles_IncludesAllRolesAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"devadmin",
				"devadmin@example.com",
				"Password123");

		// Look up role IDs from SecurityRoles
		int developerRoleId =
			await context.SecurityRoles
				.Where(r => r.Name == TestRoleConstants.Developer)
				.Select(r => r.Id)
				.FirstAsync();

		int adminRoleId =
			await context.SecurityRoles
				.Where(r => r.Name == TestRoleConstants.Admin)
				.Select(r => r.Id)
				.FirstAsync();

		// Add multiple roles
		context.UserRoles.AddRange(
			new UserRole { UserId = user.Id, RoleId = developerRoleId },
			new UserRole { UserId = user.Id, RoleId = adminRoleId });
		await context.SaveChangesAsync();

		// Capture the roles passed to GenerateAccessToken
		List<string> capturedRoles = [];
		TokenService
			.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				Arg.Any<string?>(),
				Arg.Do<IEnumerable<string>>(roles => capturedRoles.AddRange(roles)))
			.Returns("test-access-token");

		TokenService
			.GenerateRefreshTokenAsync(
				user.Id,
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("test-refresh-token");

		AuthService service = CreateService(context);

		LoginRequest request =
			new(
				UsernameOrEmail: "devadmin",
				Password: "Password123");

		// Act
		AuthResult result =
			await service.LoginAsync(
				request,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		Assert.Contains(TestRoleConstants.Developer, capturedRoles);
		Assert.Contains(TestRoleConstants.Admin, capturedRoles);
	}

	#endregion

	#region Helper Methods

	/// <summary>
	/// Creates a test user with password credentials using pre-computed hash.
	/// </summary>
	/// <remarks>
	/// Uses <see cref="TestUserHelper.SimplePasswordHash"/> to avoid runtime BCrypt computation.
	/// </remarks>
	private async Task<User> CreateTestUserWithPasswordAsync(
		IdentityDbContext context,
		string username,
		string email,
		string password,
		bool isActive = true)
	{
		User user =
			new()
			{
				Username = username,
				Email = email,
				IsActive = isActive,
				CreateDate = FixedTime.UtcDateTime,
				CreatedBy = "Test",
			};

		context.Users.Add(user);
		await context.SaveChangesAsync();

		// Use pre-computed hash for "Password123" to avoid ~100ms BCrypt computation
		string passwordHash =
			password == TestUserHelper.SimplePassword
				? TestUserHelper.SimplePasswordHash
				: BCrypt.Net.BCrypt.HashPassword(
					password,
					AuthOptions.Value.Password.WorkFactor);

		UserCredential credential =
			new()
			{
				UserId = user.Id,
				PasswordHash = passwordHash,
				CreateDate = FixedTime.UtcDateTime,
			};

		context.UserCredentials.Add(credential);
		await context.SaveChangesAsync();

		return user;
	}

	/// <summary>
	/// Creates a test user without password credentials.
	/// </summary>
	/// <remarks>
	/// Used for testing password reset flow for new users.
	/// </remarks>
	private async Task<User> CreateTestUserWithoutPasswordAsync(
		IdentityDbContext context,
		string username,
		string email,
		bool isActive = true)
	{
		User user =
			new()
			{
				Username = username,
				Email = email,
				IsActive = isActive,
				CreateDate = FixedTime.UtcDateTime,
				CreatedBy = "Test",
			};

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}

	private void SetupTokenServiceMock(User user)
	{
		TokenService
			.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				Arg.Any<string?>(),
				Arg.Any<IEnumerable<string>>())
			.Returns("test-access-token");

		TokenService
			.GenerateRefreshTokenAsync(
				user.Id,
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns("test-refresh-token");
	}

	#endregion
}