// <copyright file="TrustedDeviceServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Integration tests for TrustedDeviceService.
/// Tests trusted device creation, validation, and revocation with real database.
/// </summary>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class TrustedDeviceServiceTests(IdentityPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset FixedTime =
		TestTimeProviderBuilder.DefaultTime;

	private const string TestUserAgent =
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

	private const int TestTokenLifetimeDays = 30;
	private const int TestMaxDevicesPerUser = 5;

	private IOptions<TrustedDeviceSettings> DefaultSettings =>
		Options.Create(
			new TrustedDeviceSettings
			{
				TokenLifetimeDays = TestTokenLifetimeDays,
				MaxDevicesPerUser = TestMaxDevicesPerUser,
				CookieName = "__TD"
			});

	private TrustedDeviceService CreateService(
		IdentityDbContext context,
		FakeTimeProvider timeProvider)
	{
		return new TrustedDeviceService(
			context,
			DefaultSettings,
			timeProvider);
	}

	private TrustedDeviceRevocationService CreateRevocationService(
		IdentityDbContext context)
	{
		return new TrustedDeviceRevocationService(context);
	}

	#region CreateTrustedDeviceAsync Tests

	[Fact]
	public async Task CreateTrustedDeviceAsync_ReturnsPlainTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Act
		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Assert
		token.ShouldNotBeNullOrEmpty();
		token.Length.ShouldBe(64); // 32 bytes = 64 hex chars
	}

	[Fact]
	public async Task CreateTrustedDeviceAsync_StoresHashedTokenInDatabaseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Act
		string plainToken =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Assert
		TrustedDevice? storedDevice =
			await context
				.TrustedDevices
				.FirstOrDefaultAsync(device => device.UserId == user.Id);

		storedDevice.ShouldNotBeNull();
		storedDevice.TokenHash.ShouldNotBe(plainToken); // Should be hashed
	}

	[Fact]
	public async Task CreateTrustedDeviceAsync_SetsCorrectExpirationAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		DateTimeOffset expectedExpiration =
			FixedTime.UtcDateTime.AddDays(TestTokenLifetimeDays);

		// Act
		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			CancellationToken.None);

		// Assert
		TrustedDevice? storedDevice =
			await context
				.TrustedDevices
				.FirstOrDefaultAsync(device => device.UserId == user.Id);

		storedDevice!.ExpiresAt.ShouldBe(expectedExpiration);
	}

	[Fact]
	public async Task CreateTrustedDeviceAsync_EnforcesMaxDeviceLimitAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Create 5 devices (max limit)
		for (int index = 0; index < TestMaxDevicesPerUser; index++)
		{
			await service.CreateTrustedDeviceAsync(
				user.Id,
				$"Agent{index}",
				CancellationToken.None);
		}

		// Act - Create a 6th device
		await service.CreateTrustedDeviceAsync(
			user.Id,
			"NewAgent",
			CancellationToken.None);

		// Assert - Should still have max 5 devices
		int deviceCount =
			await context
				.TrustedDevices
				.CountAsync(device => device.UserId == user.Id);

		deviceCount.ShouldBe(TestMaxDevicesPerUser);
	}

	#endregion

	#region ValidateTrustedDeviceAsync Tests

	[Fact]
	public async Task ValidateTrustedDeviceAsync_ValidToken_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				TestUserAgent,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task ValidateTrustedDeviceAsync_InvalidToken_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			CancellationToken.None);

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				"invalid-token",
				TestUserAgent,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task ValidateTrustedDeviceAsync_ExpiredToken_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Advance time beyond expiration
		timeProvider.Advance(TimeSpan.FromDays(31));

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				TestUserAgent,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task ValidateTrustedDeviceAsync_DifferentFingerprint_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Act - Validate with different User-Agent
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				"Different/Browser",
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task ValidateTrustedDeviceAsync_ValidToken_UpdatesLastUsedAtAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Advance time
		timeProvider.Advance(TimeSpan.FromHours(1));
		DateTimeOffset expectedLastUsed =
			timeProvider.GetUtcNow();

		// Act
		await service.ValidateTrustedDeviceAsync(
			user.Id,
			token,
			TestUserAgent,
			CancellationToken.None);

		// Assert
		TrustedDevice? device =
			await context
				.TrustedDevices
				.FirstOrDefaultAsync(device => device.UserId == user.Id);

		device!.LastUsedAt.ShouldBe(expectedLastUsed);
	}

	#endregion

	#region RevokeAllAsync Tests

	[Fact]
	public async Task RevokeAllAsync_DeletesAllUserDevicesAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);
		TrustedDeviceRevocationService revocationService =
			CreateRevocationService(context);

		// Create multiple devices
		for (int index = 0; index < 3; index++)
		{
			await service.CreateTrustedDeviceAsync(
				user.Id,
				$"Agent{index}",
				CancellationToken.None);
		}

		// Act
		await revocationService.RevokeAllAsync(
			user.Id,
			CancellationToken.None);

		// Assert
		int deviceCount =
			await context
				.TrustedDevices
				.CountAsync(device => device.UserId == user.Id);

		deviceCount.ShouldBe(0);
	}

	#endregion

	#region RevokeDeviceAsync Tests

	[Fact]
	public async Task RevokeDeviceAsync_ValidDevice_ReturnsTrueAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);
		TrustedDeviceRevocationService revocationService =
			CreateRevocationService(context);

		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			CancellationToken.None);

		TrustedDevice device =
			await context
				.TrustedDevices
				.FirstAsync(device => device.UserId == user.Id);

		// Act
		bool result =
			await revocationService.RevokeDeviceAsync(
				user.Id,
				device.Id,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public async Task RevokeDeviceAsync_InvalidDevice_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		TrustedDeviceRevocationService revocationService =
			CreateRevocationService(context);

		// Act
		bool result =
			await revocationService.RevokeDeviceAsync(
				user.Id,
				999,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	#endregion

	#region GetUserDevicesAsync Tests

	[Fact]
	public async Task GetUserDevicesAsync_ReturnsNonExpiredDevicesAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			CancellationToken.None);

		// Act
		IReadOnlyList<TrustedDeviceDto> devices =
			await service.GetUserDevicesAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		devices.Count.ShouldBe(1);
		devices[0].DeviceName.ShouldBe("Windows PC");
	}

	#endregion

	#region Gap-Fill Tests

	[Fact]
	public async Task CreateTrustedDeviceAsync_StoreFingerprintHashed_NotPlaintextUserAgentAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Act
		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			CancellationToken.None);

		// Assert — fingerprint in DB must not equal the raw User-Agent
		TrustedDevice? device =
			await context
				.TrustedDevices
				.FirstOrDefaultAsync(device => device.UserId == user.Id);

		device.ShouldNotBeNull();
		device.DeviceFingerprint.ShouldNotBe(TestUserAgent);
		// SHA256 hex strings are 64 characters
		device.DeviceFingerprint.Length.ShouldBe(64);
	}

	[Fact]
	public async Task CreateTrustedDeviceAsync_EnforcesMaxDeviceCount_PrunesOldestDeviceAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Create devices at staggered times so we can identify the oldest
		for (int index = 0; index < TestMaxDevicesPerUser; index++)
		{
			await service.CreateTrustedDeviceAsync(
				user.Id,
				$"OldAgent{index}",
				CancellationToken.None);
			timeProvider.Advance(TimeSpan.FromMinutes(1));
		}

		// The very first device is now the oldest
		TrustedDevice oldestDevice =
			await context
				.TrustedDevices
				.Where(device => device.UserId == user.Id)
				.OrderBy(device => device.CreateDate)
				.FirstAsync();

		// Act — create one more device (must prune oldest)
		await service.CreateTrustedDeviceAsync(
			user.Id,
			"NewAgent",
			CancellationToken.None);

		// Assert — device count still at max, oldest device was removed
		int deviceCount =
			await context
				.TrustedDevices
				.CountAsync(device => device.UserId == user.Id);
		deviceCount.ShouldBe(TestMaxDevicesPerUser);

		bool oldestStillExists =
			await context
				.TrustedDevices
				.AnyAsync(device => device.Id == oldestDevice.Id);
		oldestStillExists.ShouldBeFalse();
	}

	[Fact]
	public async Task ValidateTrustedDeviceAsync_AfterRevoke_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);
		TrustedDeviceRevocationService revocationService =
			CreateRevocationService(context);

		string token =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		TrustedDevice device =
			await context
				.TrustedDevices
				.FirstAsync(device => device.UserId == user.Id);

		await revocationService.RevokeDeviceAsync(
			user.Id,
			device.Id,
			CancellationToken.None);

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				TestUserAgent,
				CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public async Task RevokeDeviceAsync_ScopesToCorrectUser_DoesNotAffectOtherUserAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser userA =
			await CreateTestUserAsync(context);
		ApplicationUser userB =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);
		TrustedDeviceRevocationService revocationService =
			CreateRevocationService(context);

		string tokenA =
			await service.CreateTrustedDeviceAsync(
				userA.Id,
				TestUserAgent,
				CancellationToken.None);
		string tokenB =
			await service.CreateTrustedDeviceAsync(
				userB.Id,
				TestUserAgent,
				CancellationToken.None);

		TrustedDevice deviceA =
			await context
				.TrustedDevices
				.FirstAsync(device => device.UserId == userA.Id);

		// Act — revoke userA's device only
		await revocationService.RevokeDeviceAsync(
			userA.Id,
			deviceA.Id,
			CancellationToken.None);

		// Assert — userB's device is unaffected
		bool resultB =
			await service.ValidateTrustedDeviceAsync(
				userB.Id,
				tokenB,
				TestUserAgent,
				CancellationToken.None);

		resultB.ShouldBeTrue();

		// And userA's device is gone
		bool resultA =
			await service.ValidateTrustedDeviceAsync(
				userA.Id,
				tokenA,
				TestUserAgent,
				CancellationToken.None);

		resultA.ShouldBeFalse();
	}

	[Fact]
	public async Task CreateTrustedDeviceAsync_GeneratesUniqueCsprngToken_EachCallAsync()
	{
		// Arrange — verify CSPRNG output: two calls must produce different tokens
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		ApplicationUser user =
			await CreateTestUserAsync(context);
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Act
		string token1 =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);
		string token2 =
			await service.CreateTrustedDeviceAsync(
				user.Id,
				TestUserAgent,
				CancellationToken.None);

		// Assert — tokens must be unique (CSPRNG entropy)
		token1.ShouldNotBe(token2);
		token1.Length.ShouldBe(64);
		token2.Length.ShouldBe(64);
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
				.WithUsername($"devicetest_{uniqueId}")
				.WithEmail($"device_{uniqueId}@test.com")
				.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}
}