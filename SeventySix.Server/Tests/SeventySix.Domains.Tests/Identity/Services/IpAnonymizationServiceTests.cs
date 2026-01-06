// <copyright file="IpAnonymizationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for IpAnonymizationService background service.
/// Focus: IP anonymization logic for User.LastLoginIp based on retention period.
/// Note: ExecuteAsync is not tested directly (BackgroundService lifecycle is framework-managed).
/// </summary>
public class IpAnonymizationServiceTests : IDisposable
{
	private readonly IdentityDbContext DbContext;
	private readonly IServiceScopeFactory ServiceScopeFactory;
	private readonly IOptions<IpAnonymizationSettings> Settings;
	private readonly ILogger<IpAnonymizationService> Logger;
	private readonly FakeTimeProvider TimeProvider;
	private readonly IpAnonymizationService AnonymizationService;

	public IpAnonymizationServiceTests()
	{
		// Arrange DbContext - SQLite required for ExecuteUpdateAsync support
		TimeProvider = new FakeTimeProvider();
		TimeProvider.SetUtcNow(
			new DateTimeOffset(2025, 12, 17, 12, 0, 0, TimeSpan.Zero));

		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		DbContext =
			new IdentityDbContext(options);
		DbContext.Database.OpenConnection();
		DbContext.Database.EnsureCreated();

		// Arrange ServiceScope mocking
		IServiceScope scope =
			Substitute.For<IServiceScope>();
		scope
			.ServiceProvider.GetService(typeof(IdentityDbContext))
			.Returns(DbContext);

		ServiceScopeFactory =
			Substitute.For<IServiceScopeFactory>();
		ServiceScopeFactory.CreateScope().Returns(scope);

		// Arrange settings - 90 days retention
		Settings =
			Options.Create(
			new IpAnonymizationSettings
			{
				IntervalDays = 7,
				RetentionDays = 90,
			});

		Logger =
			Substitute.For<ILogger<IpAnonymizationService>>();

		// Act
		AnonymizationService =
			new IpAnonymizationService(
			ServiceScopeFactory,
			Settings,
			Logger,
			TimeProvider);
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldAnonymizeUserIpsOlderThanRetentionPeriodAsync()
	{
		// Arrange
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		// Create test users with helper to reduce test length
		ApplicationUser oldLoginUser =
			CreateTestUser(
				"olduser",
				"old@example.com",
				now.AddDays(-100),
				"192.168.1.100",
				now.AddDays(-200));

		ApplicationUser recentLoginUser =
			CreateTestUser(
				"recentuser",
				"recent@example.com",
				now.AddDays(-60),
				"192.168.1.200",
				now.AddDays(-100));

		ApplicationUser activeUser =
			CreateTestUser(
				"activeuser",
				"active@example.com",
				now,
				"192.168.1.300",
				now.AddDays(-30));

		ApplicationUser noIpUser =
			CreateTestUser(
				"noipuser",
				"noip@example.com",
				now.AddDays(-100),
				null,
				now.AddDays(-200));

		DbContext.Users.AddRange(
			oldLoginUser,
			recentLoginUser,
			activeUser,
			noIpUser);
		await DbContext.SaveChangesAsync();

		// Act
		await AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - old user IP should be anonymized (set to null)
		ApplicationUser? oldUserAfter =
			await DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == oldLoginUser.Id);
		oldUserAfter.ShouldNotBeNull();
		oldUserAfter.LastLoginIp.ShouldBeNull();

		// Assert - recent user IP should remain
		ApplicationUser? recentUserAfter =
			await DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == recentLoginUser.Id);
		recentUserAfter.ShouldNotBeNull();
		recentUserAfter.LastLoginIp.ShouldBe("192.168.1.200");

		// Assert - active user IP should remain
		ApplicationUser? activeUserAfter =
			await DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == activeUser.Id);
		activeUserAfter.ShouldNotBeNull();
		activeUserAfter.LastLoginIp.ShouldBe("192.168.1.300");
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldAnonymizeUsersAtExactCutoffAsync()
	{
		// Arrange - User logged in exactly 90 days ago (boundary case)
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser boundaryUser =
			CreateTestUser(
				"boundaryuser",
				"boundary@example.com",
				now.AddDays(-90),
				"10.0.0.1",
				now.AddDays(-180));
		DbContext.Users.Add(boundaryUser);
		await DbContext.SaveChangesAsync();

		// Act
		await AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - exactly at cutoff should be anonymized (<= cutoff)
		ApplicationUser? userAfter =
			await DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == boundaryUser.Id);
		userAfter.ShouldNotBeNull();
		userAfter.LastLoginIp.ShouldBeNull();
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldNotAnonymizeUserOneDayBeforeCutoffAsync()
	{
		// Arrange - User logged in 89 days ago (just inside retention)
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser safeUser =
			CreateTestUser(
				"safeuser",
				"safe@example.com",
				now.AddDays(-89),
				"172.16.0.1",
				now.AddDays(-180));
		DbContext.Users.Add(safeUser);
		await DbContext.SaveChangesAsync();

		// Act
		await AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should NOT be anonymized (within retention)
		ApplicationUser? userAfter =
			await DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == safeUser.Id);
		userAfter.ShouldNotBeNull();
		userAfter.LastLoginIp.ShouldBe("172.16.0.1");
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldLogWhenIpsAnonymizedAsync()
	{
		// Arrange
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser oldUser =
			CreateTestUser(
				"loguser",
				"log@example.com",
				now.AddDays(-100),
				"192.168.1.1",
				now.AddDays(-200));
		DbContext.Users.Add(oldUser);
		await DbContext.SaveChangesAsync();

		// Act
		await AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should log at Information level
		Logger.ReceivedWithAnyArgs(1).Log(
			LogLevel.Information,
			default,
			default!,
			default,
			default!);
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldNotLogWhenNoIpsAnonymizedAsync()
	{
		// Arrange - only recent users
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		ApplicationUser recentUser =
			CreateTestUser(
				"nologuser",
				"nolog@example.com",
				now.AddDays(-30),
				"192.168.1.1",
				now.AddDays(-60));
		DbContext.Users.Add(recentUser);
		await DbContext.SaveChangesAsync();

		// Act
		await AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should NOT log (nothing anonymized)
		Logger.DidNotReceiveWithAnyArgs().Log(
			default,
			default,
			default!,
			default,
			default!);
	}

	private static ApplicationUser CreateTestUser(
		string username,
		string email,
		DateTime? lastLoginAt,
		string? lastLoginIp,
		DateTime createDate)
	{
		return new ApplicationUser
		{
			UserName = username,
			Email = email,
			LastLoginAt = lastLoginAt,
			LastLoginIp = lastLoginIp,
			CreateDate = createDate,
			CreatedBy =
				AuditConstants.SystemUser
		};
	}

	public void Dispose()
	{
		DbContext.Dispose();
		GC.SuppressFinalize(this);
	}
}
