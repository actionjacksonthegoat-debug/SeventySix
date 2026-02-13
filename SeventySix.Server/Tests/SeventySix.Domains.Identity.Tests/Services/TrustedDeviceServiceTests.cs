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
public class TrustedDeviceServiceTests(IdentityPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset FixedTime =
		TestTimeProviderBuilder.DefaultTime;

	private const string TestUserAgent =
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

	private const string TestIpAddress =
		"192.168.1.100";

	private IOptions<TrustedDeviceSettings> DefaultSettings =>
		Options.Create(
			new TrustedDeviceSettings
			{
				TokenLifetimeDays = 30,
				MaxDevicesPerUser = 5,
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
				TestIpAddress,
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
				TestIpAddress,
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

		DateTime expectedExpiration =
			FixedTime.UtcDateTime.AddDays(30);

		// Act
		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			TestIpAddress,
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
		for (int index = 0; index < 5; index++)
		{
			await service.CreateTrustedDeviceAsync(
				user.Id,
				$"Agent{index}",
				$"192.168.1.{index}",
				CancellationToken.None);
		}

		// Act - Create a 6th device
		await service.CreateTrustedDeviceAsync(
			user.Id,
			"NewAgent",
			"10.0.0.1",
			CancellationToken.None);

		// Assert - Should still have max 5 devices
		int deviceCount =
			await context
				.TrustedDevices
				.CountAsync(device => device.UserId == user.Id);

		deviceCount.ShouldBe(5);
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
				TestIpAddress,
				CancellationToken.None);

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				TestUserAgent,
				TestIpAddress,
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
			TestIpAddress,
			CancellationToken.None);

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				"invalid-token",
				TestUserAgent,
				TestIpAddress,
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
				TestIpAddress,
				CancellationToken.None);

		// Advance time beyond expiration
		timeProvider.Advance(TimeSpan.FromDays(31));

		// Act
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				TestUserAgent,
				TestIpAddress,
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
				TestIpAddress,
				CancellationToken.None);

		// Act - Validate with different User-Agent
		bool result =
			await service.ValidateTrustedDeviceAsync(
				user.Id,
				token,
				"Different/Browser",
				TestIpAddress,
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
				TestIpAddress,
				CancellationToken.None);

		// Advance time
		timeProvider.Advance(TimeSpan.FromHours(1));
		DateTime expectedLastUsed =
			timeProvider.GetUtcNow().UtcDateTime;

		// Act
		await service.ValidateTrustedDeviceAsync(
			user.Id,
			token,
			TestUserAgent,
			TestIpAddress,
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

		// Create multiple devices
		for (int index = 0; index < 3; index++)
		{
			await service.CreateTrustedDeviceAsync(
				user.Id,
				$"Agent{index}",
				$"192.168.1.{index}",
				CancellationToken.None);
		}

		// Act
		await service.RevokeAllAsync(
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

		await service.CreateTrustedDeviceAsync(
			user.Id,
			TestUserAgent,
			TestIpAddress,
			CancellationToken.None);

		TrustedDevice device =
			await context
				.TrustedDevices
				.FirstAsync(device => device.UserId == user.Id);

		// Act
		bool result =
			await service.RevokeDeviceAsync(
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
		FakeTimeProvider timeProvider =
			new(FixedTime);
		TrustedDeviceService service =
			CreateService(context, timeProvider);

		// Act
		bool result =
			await service.RevokeDeviceAsync(
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
			TestIpAddress,
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