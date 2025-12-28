// <copyright file="InitiatePasswordResetCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.TestBases;
using Shouldly;
using Wolverine;

namespace SeventySix.Domains.Tests.Identity.Commands.InitiatePasswordReset;

/// <summary>
/// Tests for <see cref="InitiatePasswordResetCommandHandler"/>.
/// </summary>
/// <remarks>
/// Follows TDD approach - tests written first to drive implementation.
/// Tests security-critical token hashing behavior (100% coverage required).
/// </remarks>
[Collection("DatabaseTests")]
public class InitiatePasswordResetCommandHandlerTests : DataPostgreSqlTestBase
{
	private readonly IMessageBus MessageBus;
	private readonly IEmailService EmailService;
	private readonly FakeTimeProvider TimeProvider;
	private readonly IOptions<JwtSettings> JwtSettings;

	public InitiatePasswordResetCommandHandlerTests(
		TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		MessageBus = Substitute.For<IMessageBus>();
		EmailService =
			Substitute.For<IEmailService>();
		TimeProvider = new FakeTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2025, 12, 15, 0, 0, 0, TimeSpan.Zero));

		JwtSettings =
			Options.Create(
			new JwtSettings
			{
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 1,
			});
	}

	[Fact]
	public async Task HandleAsync_ShouldStoreHashedToken_WhenValidUserProvidedAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordResetTokenRepository repository =
			new(context);

		// Create User entity first to satisfy FK constraint
		string uniqueSuffix =
			Guid.NewGuid().ToString("N");
		string uniqueEmail =
			$"test-{uniqueSuffix}@example.com";
		User user =
			new()
			{
				Username =
					$"testuser-{uniqueSuffix}",
				Email = uniqueEmail,
				FullName = "Test User",
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "System",
				ModifiedBy = "System",
			};
		context.Users.Add(user);
		await context.SaveChangesAsync();

		UserDto testUser =
			new(
			Id: user.Id,
			Username: "testuser",
			Email: uniqueEmail,
			FullName: "Test User",
			CreateDate: TimeProvider.GetUtcNow().UtcDateTime,
			IsActive: true,
			CreatedBy: "System",
			ModifyDate: null,
			ModifiedBy: "System",
			LastLoginAt: null,
			IsDeleted: false,
			DeletedAt: null,
			DeletedBy: null);

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(testUser);

		InitiatePasswordResetCommand command =
			new(
			testUser.Id,
			IsNewUser: false);

		// Act
		await InitiatePasswordResetCommandHandler.HandleAsync(
			command,
			repository,
			MessageBus,
			EmailService,
			JwtSettings,
			TimeProvider,
			NullLogger<InitiatePasswordResetCommand>.Instance,
			CancellationToken.None);

		// Assert
		PasswordResetToken? resetToken =
			await context.PasswordResetTokens.FirstOrDefaultAsync(token =>
				token.UserId == testUser.Id);

		resetToken.ShouldNotBeNull();
		resetToken.TokenHash.ShouldNotBeNullOrEmpty();
		resetToken.TokenHash.Length.ShouldBe(64); // SHA256 hex length
		resetToken.UserId.ShouldBe(testUser.Id);
		resetToken.IsUsed.ShouldBeFalse();
		resetToken.ExpiresAt.ShouldBeGreaterThan(
			TimeProvider.GetUtcNow().UtcDateTime);
	}

	[Fact]
	public async Task HandleAsync_ShouldInvalidateOldTokens_BeforeCreatingNewOneAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		PasswordResetTokenRepository repository =
			new(context);

		// Create User entity first to satisfy FK constraint
		string uniqueSuffix =
			Guid.NewGuid().ToString("N");
		string uniqueEmail =
			$"test-{uniqueSuffix}@example.com";
		User user =
			new()
			{
				Username =
					$"testuser-{uniqueSuffix}",
				Email = uniqueEmail,
				FullName = "Test User",
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime,
				CreatedBy = "System",
				ModifiedBy = "System",
			};
		context.Users.Add(user);
		await context.SaveChangesAsync();

		UserDto testUser =
			new(
			Id: user.Id,
			Username: $"testuser-{uniqueSuffix}",
			Email: uniqueEmail,
			FullName: "Test User",
			CreateDate: TimeProvider.GetUtcNow().UtcDateTime,
			IsActive: true,
			CreatedBy: "System",
			ModifyDate: null,
			ModifiedBy: "System",
			LastLoginAt: null,
			IsDeleted: false,
			DeletedAt: null,
			DeletedBy: null);

		string oldTokenHash =
			CryptoExtensions.ComputeSha256Hash("old-token");

		PasswordResetToken oldToken =
			new()
			{
				UserId = testUser.Id,
				TokenHash = oldTokenHash,
				ExpiresAt =
					TimeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				IsUsed = false,
				CreateDate =
					TimeProvider.GetUtcNow().UtcDateTime.AddMinutes(-10),
			};

		context.PasswordResetTokens.Add(oldToken);
		await context.SaveChangesAsync();

		MessageBus
			.InvokeAsync<UserDto?>(
				Arg.Any<GetUserByIdQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(testUser);

		InitiatePasswordResetCommand command =
			new(
			testUser.Id,
			IsNewUser: false);

		// Act
		await InitiatePasswordResetCommandHandler.HandleAsync(
			command,
			repository,
			MessageBus,
			EmailService,
			JwtSettings,
			TimeProvider,
			NullLogger<InitiatePasswordResetCommand>.Instance,
			CancellationToken.None);

		// Assert - old token should be marked as used
		// Reload from database to get fresh state after ExecuteUpdateAsync
		context.Entry(oldToken).Reload();

		oldToken.IsUsed.ShouldBeTrue();
	}
}