// <copyright file="PasswordServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for PasswordService.
/// Tests InitiatePasswordResetAsync, SetPasswordAsync, ChangePasswordAsync, InitiatePasswordResetByEmailAsync.
/// </summary>
[Collection("DatabaseTests")]
public class PasswordServiceTests(TestcontainersPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private readonly ITokenService TokenService =
		Substitute.For<ITokenService>();
	private readonly IValidator<ChangePasswordRequest> ChangePasswordValidator =
		new ChangePasswordRequestValidator();
	private readonly IValidator<SetPasswordRequest> SetPasswordValidator =
		new SetPasswordRequestValidator();
	private readonly IEmailService EmailService =
		Substitute.For<IEmailService>();
	private readonly ILogger<PasswordService> Logger =
		Substitute.For<ILogger<PasswordService>>();

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

	private PasswordService CreateService(IdentityDbContext context)
	{
		return new PasswordService(
			new CredentialRepository(context),
			new PasswordResetTokenRepository(context),
			new UserQueryRepository(context),
			new UserRoleRepository(context),
			TokenService,
			AuthOptions,
			JwtOptions,
			ChangePasswordValidator,
			SetPasswordValidator,
			EmailService,
			TestTimeProviderBuilder.CreateDefault(),
			Logger);
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
			.Returns(Task.FromResult("test-refresh-token"));
	}

	#region InitiatePasswordResetAsync Tests

	[Fact]
	public async Task InitiatePasswordResetAsync_SendsWelcomeEmail_WhenIsNewUserTrueAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithoutPasswordAsync(
				context,
				$"welcome_{testId}",
				$"welcome_{testId}@example.com");

		PasswordService service = CreateService(context);

		// Act
		await service.InitiatePasswordResetAsync(
			user.Id,
			isNewUser: true,
			CancellationToken.None);

		// Assert
		await EmailService
			.Received(1)
			.SendWelcomeEmailAsync(
				user.Email,
				user.Username,
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());

		PasswordResetToken? token =
			await context.PasswordResetTokens
				.FirstOrDefaultAsync(t => t.UserId == user.Id && !t.IsUsed);
		Assert.NotNull(token);
	}

	[Fact]
	public async Task InitiatePasswordResetAsync_SendsResetEmail_WhenIsNewUserFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"existinguser",
				"existing@example.com",
				"Password123");

		PasswordService service = CreateService(context);

		// Act
		await service.InitiatePasswordResetAsync(
			user.Id,
			isNewUser: false,
			CancellationToken.None);

		// Assert
		await EmailService
			.Received(1)
			.SendPasswordResetEmailAsync(
				user.Email,
				user.Username,
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());

		PasswordResetToken? token =
			await context.PasswordResetTokens
				.FirstOrDefaultAsync(t => t.UserId == user.Id && !t.IsUsed);
		Assert.NotNull(token);
	}

	#endregion

	#region SetPasswordAsync Tests

	[Fact]
	public async Task SetPasswordAsync_ReturnsSuccess_WhenTokenValidAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithoutPasswordAsync(
				context,
				$"setpw_{testId}",
				$"setpw_{testId}@example.com");

		string validToken =
			Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

		PasswordResetToken resetToken =
			new()
			{
				UserId = user.Id,
				Token = validToken,
				ExpiresAt = FixedTime.AddHours(24).UtcDateTime,
				CreateDate = FixedTime.UtcDateTime,
				IsUsed = false,
			};
		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync();

		SetupTokenServiceMock(user);

		PasswordService service = CreateService(context);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "NewPassword123!");

		// Act
		AuthResult result =
			await service.SetPasswordAsync(
				request,
				clientIp: "127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.True(result.Success);
		Assert.NotNull(result.AccessToken);
		Assert.NotNull(result.RefreshToken);

		// Token should be marked as used
		PasswordResetToken? usedToken =
			await context.PasswordResetTokens
				.FirstOrDefaultAsync(t => t.Token == validToken);
		Assert.NotNull(usedToken);
		Assert.True(usedToken.IsUsed);

		// Credential should be created
		UserCredential? credential =
			await context.UserCredentials
				.FirstOrDefaultAsync(c => c.UserId == user.Id);
		Assert.NotNull(credential);
	}

	[Fact]
	public async Task SetPasswordAsync_ReturnsFailed_WhenTokenInvalidAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordService service = CreateService(context);

		// Use a valid base64 string that doesn't exist in the database
		string nonExistentToken =
			Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

		SetPasswordRequest request =
			new(
				Token: nonExistentToken,
				NewPassword: "NewPassword123!");

		// Act
		AuthResult result =
			await service.SetPasswordAsync(
				request,
				clientIp: "127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.InvalidToken, result.ErrorCode);
	}

	[Fact]
	public async Task SetPasswordAsync_ReturnsFailed_WhenTokenExpiredAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithoutPasswordAsync(
				context,
				"expireduser",
				"expired@example.com");

		string expiredToken =
			Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

		// Token expired 1 hour ago
		PasswordResetToken resetToken =
			new()
			{
				UserId = user.Id,
				Token = expiredToken,
				ExpiresAt = FixedTime.AddHours(-1).UtcDateTime,
				CreateDate = FixedTime.AddHours(-25).UtcDateTime,
				IsUsed = false,
			};
		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync();

		PasswordService service = CreateService(context);

		SetPasswordRequest request =
			new(
				Token: expiredToken,
				NewPassword: "NewPassword123!");

		// Act
		AuthResult result =
			await service.SetPasswordAsync(
				request,
				clientIp: "127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal(AuthErrorCodes.TokenExpired, result.ErrorCode);
	}

	[Fact]
	public async Task SetPasswordAsync_ReturnsFailed_WhenPasswordValidationFailsAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithoutPasswordAsync(
				context,
				"weakpassuser",
				"weakpass@example.com");

		string validToken =
			Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

		PasswordResetToken resetToken =
			new()
			{
				UserId = user.Id,
				Token = validToken,
				ExpiresAt = FixedTime.AddHours(24).UtcDateTime,
				CreateDate = FixedTime.UtcDateTime,
				IsUsed = false,
			};
		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync();

		PasswordService service = CreateService(context);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "weak");

		// Act
		AuthResult result =
			await service.SetPasswordAsync(
				request,
				clientIp: "127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.False(result.Success);
		Assert.Equal("VALIDATION_ERROR", result.ErrorCode);
	}

	#endregion

	#region InitiatePasswordResetByEmailAsync Tests

	[Fact]
	public async Task InitiatePasswordResetByEmailAsync_SendsEmail_WhenUserExistsAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"resetuser",
				"reset@example.com",
				"Password123");

		PasswordService service = CreateService(context);

		// Act
		await service.InitiatePasswordResetByEmailAsync(
			"reset@example.com",
			CancellationToken.None);

		// Assert
		await EmailService
			.Received(1)
			.SendPasswordResetEmailAsync(
				"reset@example.com",
				"resetuser",
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());

		// Verify token was created (get the unused one)
		PasswordResetToken? token =
			await context.PasswordResetTokens
				.Where(t => t.UserId == user.Id && !t.IsUsed)
				.FirstOrDefaultAsync();
		Assert.NotNull(token);
	}

	[Fact]
	public async Task InitiatePasswordResetByEmailAsync_DoesNotThrow_WhenUserNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordService service = CreateService(context);

		// Act - should not throw
		await service.InitiatePasswordResetByEmailAsync(
			"nonexistent@example.com",
			CancellationToken.None);

		// Assert - no email should be sent
		await EmailService
			.DidNotReceive()
			.SendPasswordResetEmailAsync(
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task InitiatePasswordResetByEmailAsync_DoesNotSendEmail_WhenUserInactiveAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await using IdentityDbContext context = CreateIdentityDbContext();
		await CreateTestUserWithPasswordAsync(
			context,
			$"pwreset_inactive_{testId}",
			$"pwreset_inactive_{testId}@example.com",
			"Password123",
			isActive: false);

		PasswordService service = CreateService(context);

		// Act
		await service.InitiatePasswordResetByEmailAsync(
			$"pwreset_inactive_{testId}@example.com",
			CancellationToken.None);

		// Assert - no email should be sent for inactive users
		await EmailService
			.DidNotReceive()
			.SendPasswordResetEmailAsync(
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task InitiatePasswordResetByEmailAsync_IsCaseInsensitive_ForEmailAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user =
			await CreateTestUserWithPasswordAsync(
				context,
				"caseuser",
				"CaseTest@Example.COM",
				"Password123");

		PasswordService service = CreateService(context);

		// Act - use different case
		await service.InitiatePasswordResetByEmailAsync(
			"casetest@example.com",
			CancellationToken.None);

		// Assert - email should still be sent
		await EmailService
			.Received(1)
			.SendPasswordResetEmailAsync(
				"CaseTest@Example.COM",
				"caseuser",
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region Helper Methods

	/// <summary>
	/// Creates a test user with password credentials using pre-computed hash.
	/// </summary>
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

	#endregion
}