// <copyright file="SetPasswordCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;
using Wolverine;

namespace SeventySix.Domains.Tests.Identity.Commands.SetPassword;

/// <summary>
/// Tests for <see cref="SetPasswordCommandHandler"/>.
/// </summary>
/// <remarks>
/// Focuses on token hash validation - security-critical path.
/// Tests must verify handler only accepts hashed tokens.
/// </remarks>
[Collection("DatabaseTests")]
public class SetPasswordCommandHandlerTests : DataPostgreSqlTestBase
{
	private readonly IMessageBus MessageBus;
	private readonly ICredentialRepository CredentialRepository;
	private readonly ITokenRepository TokenRepository;
	private readonly IPasswordHasher PasswordHasher;
	private readonly RegistrationService RegistrationService;
	private readonly FakeTimeProvider TimeProvider;

	public SetPasswordCommandHandlerTests(
		TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		MessageBus = Substitute.For<IMessageBus>();
		CredentialRepository =
			Substitute.For<ICredentialRepository>();
		TokenRepository =
			Substitute.For<ITokenRepository>();
		PasswordHasher =
			Substitute.For<IPasswordHasher>();
		RegistrationService =
			Substitute.ForPartsOf<RegistrationService>(
			Substitute.For<IAuthRepository>(),
			Substitute.For<ICredentialRepository>(),
			Substitute.For<IUserQueryRepository>(),
			Substitute.For<ITokenService>(),
			PasswordHasher,
			Options.Create(new JwtSettings()),
			new FakeTimeProvider(),
			NullLogger<RegistrationService>.Instance);
		TimeProvider = new FakeTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTime(2025, 12, 15, 0, 0, 0, DateTimeKind.Utc));
	}

	[Fact]
	public async Task HandleAsync_ShouldAcceptValidHashedToken_AndCompletePasswordResetAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordResetTokenRepository repository =
			new(context);

		// Create user first to satisfy FK constraint
		User testUser =
			await TestUserHelper.CreateUserWithPasswordAsync(
				context,
				"testuser",
				"test@example.com",
				TimeProvider);

		string rawToken = "base64-encoded-random-token-12345";
		string hashedToken =
			CryptoExtensions.ComputeSha256Hash(rawToken);

		PasswordResetToken resetToken =
			new()
			{
				UserId = testUser.Id,
				TokenHash = hashedToken,
				ExpiresAt =
					TimeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				IsUsed = false,
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime,
			};

		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync();

		UserDto userDto =
			CreateTestUserDto(testUser);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(userDto);

		RegistrationService
			.GenerateAuthResultAsync(
				Arg.Any<User>(),
				Arg.Any<string?>(),
				Arg.Any<bool>(),
				Arg.Any<bool>(),
				Arg.Any<CancellationToken>())
			.Returns(
				AuthResult.Succeeded(
					"token",
					"refresh",
					TimeProvider.GetUtcNow().UtcDateTime,
					"test@example.com",
					null,
					false));

		SetPasswordRequest passwordRequest =
			new(rawToken, "NewPassword123!");

		SetPasswordCommand command =
			new(passwordRequest, "127.0.0.1");

		// Act
		AuthResult passwordResult =
			await SetPasswordCommandHandler.HandleAsync(
			command,
			repository,
			CredentialRepository,
			MessageBus,
			TokenRepository,
			PasswordHasher,
			RegistrationService,
			TimeProvider,
			NullLogger<SetPasswordCommand>.Instance,
			CancellationToken.None);

		// Assert
		passwordResult.Success.ShouldBeTrue();

		PasswordResetToken? usedToken =
			await context.PasswordResetTokens.FindAsync(resetToken.Id);

		usedToken.ShouldNotBeNull();
		usedToken.IsUsed.ShouldBeTrue();
	}

	[Fact]
	public async Task HandleAsync_ShouldRejectExpiredToken_AndThrowExceptionAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordResetTokenRepository repository =
			new(context);

		// Create user first to satisfy FK constraint
		User testUser =
			await TestUserHelper.CreateUserWithPasswordAsync(
				context,
				"expiredtokenuser",
				"expired@example.com",
				TimeProvider);

		string rawToken = "expired-token-12345";
		string hashedToken =
			CryptoExtensions.ComputeSha256Hash(rawToken);

		PasswordResetToken expiredToken =
			new()
			{
				UserId = testUser.Id,
				TokenHash = hashedToken,
				ExpiresAt =
					TimeProvider.GetUtcNow().UtcDateTime.AddHours(-1), // Expired 1 hour ago
				IsUsed = false,
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime.AddDays(-1),
			};

		context.PasswordResetTokens.Add(expiredToken);
		await context.SaveChangesAsync();

		SetPasswordRequest passwordRequest =
			new(rawToken, "NewPassword123!");

		SetPasswordCommand command =
			new(passwordRequest, "127.0.0.1");

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await SetPasswordCommandHandler.HandleAsync(
				command,
				repository,
				CredentialRepository,
				MessageBus,
				TokenRepository,
				PasswordHasher,
				RegistrationService,
				TimeProvider,
				NullLogger<SetPasswordCommand>.Instance,
				CancellationToken.None));
	}

	[Fact]
	public async Task HandleAsync_ShouldRejectUsedToken_AndThrowExceptionAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordResetTokenRepository repository =
			new(context);

		// Create user first to satisfy FK constraint
		User testUser =
			await TestUserHelper.CreateUserWithPasswordAsync(
				context,
				"usedtokenuser",
				"used@example.com",
				TimeProvider);

		string rawToken = "used-token-12345";
		string hashedToken =
			CryptoExtensions.ComputeSha256Hash(rawToken);

		PasswordResetToken usedToken =
			new()
			{
				UserId = testUser.Id,
				TokenHash = hashedToken,
				ExpiresAt =
					TimeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				IsUsed = true, // Already used
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime,
			};

		context.PasswordResetTokens.Add(usedToken);
		await context.SaveChangesAsync();

		SetPasswordRequest passwordRequest =
			new(rawToken, "NewPassword123!");

		SetPasswordCommand command =
			new(passwordRequest, "127.0.0.1");

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(async () =>
			await SetPasswordCommandHandler.HandleAsync(
				command,
				repository,
				CredentialRepository,
				MessageBus,
				TokenRepository,
				PasswordHasher,
				RegistrationService,
				TimeProvider,
				NullLogger<SetPasswordCommand>.Instance,
				CancellationToken.None));
	}

	#region Helper Methods

	private UserDto CreateTestUserDto(User user) =>
		new(
			Id: user.Id,
			Username: user.Username,
			Email: user.Email,
			FullName: user.FullName,
			CreateDate: user.CreateDate,
			IsActive: user.IsActive,
			CreatedBy: user.CreatedBy,
			ModifyDate: user.ModifyDate,
			ModifiedBy: user.ModifiedBy,
			LastLoginAt: user.LastLoginAt,
			IsDeleted: user.IsDeleted,
			DeletedAt: user.DeletedAt,
			DeletedBy: user.DeletedBy);

	#endregion
}