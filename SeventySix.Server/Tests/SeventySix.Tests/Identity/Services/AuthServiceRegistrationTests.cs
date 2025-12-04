// <copyright file="AuthServiceRegistrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for AuthService self-registration methods.
/// Tests InitiateRegistrationAsync and CompleteRegistrationAsync.
/// </summary>
[Collection("DatabaseTests")]
public class AuthServiceRegistrationTests(TestcontainersPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private readonly ITokenService TokenService =
		Substitute.For<ITokenService>();
	private readonly IHttpClientFactory HttpClientFactory =
		Substitute.For<IHttpClientFactory>();
	private readonly IValidator<ChangePasswordRequest> ChangePasswordValidator =
		new ChangePasswordRequestValidator();
	private readonly IValidator<SetPasswordRequest> SetPasswordValidator =
		new SetPasswordRequestValidator();
	private readonly IValidator<InitiateRegistrationRequest> InitiateRegistrationValidator =
		new InitiateRegistrationRequestValidator();
	private readonly IValidator<CompleteRegistrationRequest> CompleteRegistrationValidator =
		new CompleteRegistrationRequestValidator();
	private readonly IEmailService EmailService =
		Substitute.For<IEmailService>();
	private readonly ILogger<AuthService> Logger =
		Substitute.For<ILogger<AuthService>>();

	/// <summary>
	/// Fixed time for deterministic tests.
	/// </summary>
	private static readonly DateTimeOffset FixedTime =
		TestTimeProviderBuilder.DefaultTime;

	private static IOptions<JwtSettings> JwtOptions =>
		Options.Create(
			new JwtSettings
			{
				SecretKey = "Kj8#mP2$vN5@xQ9&wL4*hR7!cT3^bF6%",
				Issuer = "https://test.issuer.com",
				Audience = "https://test.audience.com",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 7,
			});

	private static IOptions<AuthSettings> AuthOptions =>
		Options.Create(
			new AuthSettings
			{
				Password = new PasswordSettings
				{
					MinLength = 8,
					RequireUppercase = true,
					RequireLowercase = true,
					RequireDigit = true,
					RequireSpecialChar = false,
					WorkFactor = 4, // Lower for tests
				},
				Lockout = new LockoutSettings
				{
					Enabled = true,
					MaxFailedAttempts = 5,
					LockoutDurationMinutes = 15,
				},
			});

	private AuthService CreateService(IdentityDbContext context)
	{
		TokenService
			.GenerateAccessToken(
				Arg.Any<int>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string?>(),
				Arg.Any<IEnumerable<string>>())
			.Returns("test-access-token");
		TokenService
			.GenerateRefreshTokenAsync(
				Arg.Any<int>(),
				Arg.Any<string?>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.FromResult("test-refresh-token"));

		return new AuthService(
			context,
			TokenService,
			HttpClientFactory,
			AuthOptions,
			JwtOptions,
			ChangePasswordValidator,
			SetPasswordValidator,
			InitiateRegistrationValidator,
			CompleteRegistrationValidator,
			EmailService,
			TestTimeProviderBuilder.CreateDefault(),
			new TransactionManager(context),
			Logger);
	}

	#region InitiateRegistrationAsync Tests

	[Fact]
	public async Task InitiateRegistrationAsync_SendsVerificationEmail_WhenEmailIsNewAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"sendsemail_{testId}@example.com";

		// Act
		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		// Assert
		await EmailService
			.Received(1)
			.SendVerificationEmailAsync(
				email,
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task InitiateRegistrationAsync_CreatesVerificationToken_WhenEmailIsNewAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"createstoken_{testId}@example.com";

		// Act
		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		// Assert
		EmailVerificationToken? token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstOrDefaultAsync();

		token.ShouldNotBeNull();
		token.Token.ShouldNotBeNullOrWhiteSpace();
		token.ExpiresAt.ShouldBe(FixedTime.UtcDateTime.AddHours(24));
	}

	[Fact]
	public async Task InitiateRegistrationAsync_DoesNotSendEmail_WhenEmailAlreadyRegisteredAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			context,
			username: $"existingnosend_{testId}",
			email: $"existingnosend_{testId}@example.com");

		AuthService service =
			CreateService(context);

		// Act
		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest($"existingnosend_{testId}@example.com"));

		// Assert - should silently succeed but not send email
		await EmailService
			.DidNotReceive()
			.SendVerificationEmailAsync(
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task InitiateRegistrationAsync_InvalidatesOldTokens_WhenRequestedAgainAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"repeated_{testId}@example.com";

		// First request
		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		// Second request
		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		// Assert
		int unusedTokenCount =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.CountAsync();

		unusedTokenCount.ShouldBe(1);
	}

	[Fact]
	public async Task InitiateRegistrationAsync_DoesNotThrow_WhenEmailExistsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			context,
			username: $"existingnothrow_{testId}",
			email: $"existingnothrow_{testId}@example.com");

		AuthService service =
			CreateService(context);

		// Act & Assert - should not throw
		await Should.NotThrowAsync(async () =>
			await service.InitiateRegistrationAsync(new InitiateRegistrationRequest($"existingnothrow_{testId}@example.com")));
	}

	#endregion

	#region CompleteRegistrationAsync Tests

	[Fact]
	public async Task CompleteRegistrationAsync_ReturnsSuccess_WhenValidTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"success_{testId}@example.com";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: $"success_{testId}",
				Password: "SecurePass123!");

		// Act
		AuthResult result =
			await service.CompleteRegistrationAsync(
				request,
				clientIp: "127.0.0.1");

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldNotBeNullOrWhiteSpace();
	}

	[Fact]
	public async Task CompleteRegistrationAsync_CreatesUser_WhenValidTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"creates_{testId}@example.com";
		string username =
			$"creates_{testId}";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: username,
				Password: "SecurePass123!");

		// Act
		await service.CompleteRegistrationAsync(
			request,
			clientIp: "127.0.0.1");

		// Assert
		User? user =
			await context.Users
				.Where(u => u.Email == email)
				.FirstOrDefaultAsync();

		user.ShouldNotBeNull();
		user.Username.ShouldBe(username);
		user.IsActive.ShouldBeTrue();
	}

	[Fact]
	public async Task CompleteRegistrationAsync_MarksTokenAsUsed_WhenSuccessfulAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"marks_{testId}@example.com";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: $"marks_{testId}",
				Password: "SecurePass123!");

		// Act
		await service.CompleteRegistrationAsync(
			request,
			clientIp: "127.0.0.1");

		// Assert
		EmailVerificationToken updatedToken =
			await context.EmailVerificationTokens
				.Where(t => t.Id == token.Id)
				.FirstAsync();

		updatedToken.IsUsed.ShouldBeTrue();
	}

	[Fact]
	public async Task CompleteRegistrationAsync_ReturnsError_WhenTokenInvalidAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];

		CompleteRegistrationRequest request =
			new(
				Token: $"invalid-token-{testId}",
				Username: $"invalid_{testId}",
				Password: "SecurePass123!");

		// Act
		AuthResult result =
			await service.CompleteRegistrationAsync(
				request,
				clientIp: "127.0.0.1");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("INVALID_TOKEN");
	}

	[Fact]
	public async Task CompleteRegistrationAsync_ReturnsError_WhenTokenExpiredAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"expired_{testId}@example.com";

		// Create an already-expired token manually
		EmailVerificationToken expiredToken =
			new()
			{
				Email = email,
				Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
				ExpiresAt = FixedTime.UtcDateTime.AddHours(-1), // Expired 1 hour ago
				CreateDate = FixedTime.UtcDateTime.AddHours(-25),
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(expiredToken);
		await context.SaveChangesAsync();

		AuthService service =
			CreateService(context);

		CompleteRegistrationRequest request =
			new(
				Token: expiredToken.Token,
				Username: $"expired_{testId}",
				Password: "SecurePass123!");

		// Act
		AuthResult result =
			await service.CompleteRegistrationAsync(
				request,
				clientIp: "127.0.0.1");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("TOKEN_EXPIRED");
	}

	[Fact]
	public async Task CompleteRegistrationAsync_ReturnsError_WhenTokenAlreadyUsedAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"alreadyused_{testId}@example.com";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: $"alreadyused_{testId}",
				Password: "SecurePass123!");

		// First use - should succeed
		await service.CompleteRegistrationAsync(
			request,
			clientIp: "127.0.0.1");

		// Act - second use with same token
		CompleteRegistrationRequest secondRequest =
			new(
				Token: token.Token,
				Username: $"alreadyused2_{testId}",
				Password: "SecurePass456!");

		AuthResult result =
			await service.CompleteRegistrationAsync(
				secondRequest,
				clientIp: "127.0.0.1");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("TOKEN_EXPIRED");
	}

	[Fact]
	public async Task CompleteRegistrationAsync_ReturnsError_WhenUsernameAlreadyExistsAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			context,
			username: $"existingname_{testId}",
			email: $"other_{testId}@example.com");

		AuthService service =
			CreateService(context);

		string email =
			$"newuser_{testId}@example.com";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: $"existingname_{testId}",
				Password: "SecurePass123!");

		// Act
		AuthResult result =
			await service.CompleteRegistrationAsync(
				request,
				clientIp: "127.0.0.1");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe("USERNAME_EXISTS");
	}

	[Fact]
	public async Task CompleteRegistrationAsync_AssignsUserRole_WhenSuccessfulAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		AuthService service =
			CreateService(context);

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"assigns_{testId}@example.com";

		await service.InitiateRegistrationAsync(new InitiateRegistrationRequest(email));

		EmailVerificationToken token =
			await context.EmailVerificationTokens
				.Where(t => t.Email == email
					&& !t.IsUsed)
				.FirstAsync();

		CompleteRegistrationRequest request =
			new(
				Token: token.Token,
				Username: $"assigns_{testId}",
				Password: "SecurePass123!");

		// Act
		await service.CompleteRegistrationAsync(
			request,
			clientIp: "127.0.0.1");

		// Assert
		User user =
			await context.Users
				.Where(u => u.Email == email)
				.FirstAsync();

		UserRole? role =
			await context.UserRoles
				.Include(r => r.Role)
				.Where(r => r.UserId == user.Id)
				.FirstOrDefaultAsync();

		role.ShouldNotBeNull();
		role.Role!.Name.ShouldBe("User");
	}

	#endregion
}