// <copyright file="BackupCodeServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Integration tests for BackupCodeService.
/// Tests backup code generation and verification with real database.
/// </summary>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class BackupCodeServiceTests(IdentityPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset FixedTime =
		TestTimeProviderBuilder.DefaultTime;

	private IOptions<BackupCodeSettings> DefaultSettings =>
		Options.Create(
			new BackupCodeSettings
			{
				CodeCount = 10,
				CodeLength = 8
			});

	private BackupCodeService CreateService(
		IdentityDbContext context,
		TimeProvider timeProvider)
	{
		IPasswordHasher<BackupCode> passwordHasher =
			new PasswordHasher<BackupCode>();

		return new BackupCodeService(
			context,
			DefaultSettings,
			passwordHasher,
			timeProvider);
	}

	#region GenerateCodesAsync Tests

	[Fact]
	public async Task GenerateCodesAsync_ReturnsConfiguredNumberOfCodesAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		// Act
		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		codes.Count.ShouldBe(10);
	}

	[Fact]
	public async Task GenerateCodesAsync_ReturnsCodesWithCorrectLengthAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		// Act
		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		codes.ShouldAllBe(code => code.Length == 8);
	}

	[Fact]
	public async Task GenerateCodesAsync_StoresHashedCodesInDatabaseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		// Act
		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		List<BackupCode> storedCodes =
			await context
				.BackupCodes
				.Where(code => code.UserId == user.Id)
				.ToListAsync();

		storedCodes.Count.ShouldBe(10);
		// Verify codes are hashed (not plain text)
		storedCodes.ShouldAllBe(
			storedCode => !codes.Contains(storedCode.CodeHash));
	}

	[Fact]
	public async Task GenerateCodesAsync_DeletesExistingCodesBeforeGeneratingNewAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		// Generate initial codes
		await service.GenerateCodesAsync(
			user.Id,
			CancellationToken.None);

		// Act - Generate new codes
		await service.GenerateCodesAsync(
			user.Id,
			CancellationToken.None);

		// Assert - Should only have 10 codes total (not 20)
		int totalCodes =
			await context
				.BackupCodes
				.CountAsync(code => code.UserId == user.Id);

		totalCodes.ShouldBe(10);
	}

	#endregion

	#region VerifyAndConsumeCodeAsync Tests

	[Fact]
	public async Task VerifyAndConsumeCodeAsync_ValidCode_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		string codeToVerify =
			codes[0];

		// Act
		bool result =
			await service.VerifyAndConsumeCodeAsync(
				user.Id,
				codeToVerify,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task VerifyAndConsumeCodeAsync_ValidCode_MarksCodeAsUsedAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		string codeToVerify =
			codes[0];

		// Act
		await service.VerifyAndConsumeCodeAsync(
			user.Id,
			codeToVerify,
			CancellationToken.None);

		// Assert
		int usedCount =
			await context
				.BackupCodes
				.CountAsync(code =>
					code.UserId == user.Id
					&& code.IsUsed);

		usedCount.ShouldBe(1);
	}

	[Fact]
	public async Task VerifyAndConsumeCodeAsync_UsedCode_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		string codeToVerify =
			codes[0];

		// Use the code once
		await service.VerifyAndConsumeCodeAsync(
			user.Id,
			codeToVerify,
			CancellationToken.None);

		// Act - Try to use the same code again
		bool result =
			await service.VerifyAndConsumeCodeAsync(
				user.Id,
				codeToVerify,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task VerifyAndConsumeCodeAsync_InvalidCode_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		await service.GenerateCodesAsync(
			user.Id,
			CancellationToken.None);

		// Act
		bool result =
			await service.VerifyAndConsumeCodeAsync(
				user.Id,
				"INVALID1",
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task VerifyAndConsumeCodeAsync_WrongUser_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		// Act - Try with wrong user ID
		bool result =
			await service.VerifyAndConsumeCodeAsync(
				user.Id + 999,
				codes[0],
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	#endregion

	#region GetRemainingCountAsync Tests

	[Fact]
	public async Task GetRemainingCountAsync_AllUnused_ReturnsFullCountAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		await service.GenerateCodesAsync(
			user.Id,
			CancellationToken.None);

		// Act
		int remaining =
			await service.GetRemainingCountAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		remaining.ShouldBe(10);
	}

	[Fact]
	public async Task GetRemainingCountAsync_AfterUsingOne_ReturnsCorrectCountAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		BackupCodeService service =
			CreateService(context, timeProvider);

		IReadOnlyList<string> codes =
			await service.GenerateCodesAsync(
				user.Id,
				CancellationToken.None);

		await service.VerifyAndConsumeCodeAsync(
			user.Id,
			codes[0],
			CancellationToken.None);

		// Act
		int remaining =
			await service.GetRemainingCountAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		remaining.ShouldBe(9);
	}

	#endregion

	private async Task<ApplicationUser> CreateTestUserAsync(IdentityDbContext context)
	{
		FakeTimeProvider timeProvider =
			new(FixedTime);

		string uniqueId =
			Guid.NewGuid().ToString("N");

		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername($"backuptest_{uniqueId}")
				.WithEmail($"backup_{uniqueId}@test.com")
				.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}
}