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
		this.TimeProvider = new FakeTimeProvider();
		this.TimeProvider.SetUtcNow(
			new DateTime(2025, 12, 17, 12, 0, 0, DateTimeKind.Utc));

		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		this.DbContext =
			new IdentityDbContext(options);
		this.DbContext.Database.OpenConnection();
		this.DbContext.Database.EnsureCreated();

		// Arrange ServiceScope mocking
		IServiceScope scope =
			Substitute.For<IServiceScope>();
		scope
			.ServiceProvider.GetService(typeof(IdentityDbContext))
			.Returns(this.DbContext);

		this.ServiceScopeFactory =
			Substitute.For<IServiceScopeFactory>();
		this.ServiceScopeFactory.CreateScope().Returns(scope);

		// Arrange settings - 90 days retention
		this.Settings =
			Options.Create(
			new IpAnonymizationSettings
			{
				IntervalDays = 7,
				RetentionDays = 90,
			});

		this.Logger =
			Substitute.For<ILogger<IpAnonymizationService>>();

		// Act
		this.AnonymizationService =
			new IpAnonymizationService(
			this.ServiceScopeFactory,
			this.Settings,
			this.Logger,
			this.TimeProvider);
	}

	[Fact]
	public async Task AnonymizeIpAddressesAsync_ShouldAnonymizeUserIpsOlderThanRetentionPeriodAsync()
	{
		// Arrange
		DateTime now =
			this.TimeProvider.GetUtcNow().UtcDateTime;

		// User with login 100 days ago (should be anonymized - older than 90 days)
		User oldLoginUser =
			new()
			{
				Username = "olduser",
				Email = "old@example.com",
				LastLoginAt =
					now.AddDays(-100),
				LastLoginIp = "192.168.1.100",
				CreateDate =
					now.AddDays(-200),
				CreatedBy = "system",
			};

		// User with login 60 days ago (should NOT be anonymized - within 90 days)
		User recentLoginUser =
			new()
			{
				Username = "recentuser",
				Email = "recent@example.com",
				LastLoginAt =
					now.AddDays(-60),
				LastLoginIp = "192.168.1.200",
				CreateDate =
					now.AddDays(-100),
				CreatedBy = "system",
			};

		// User with login today (should NOT be anonymized)
		User activeUser =
			new()
			{
				Username = "activeuser",
				Email = "active@example.com",
				LastLoginAt = now,
				LastLoginIp = "192.168.1.300",
				CreateDate =
					now.AddDays(-30),
				CreatedBy = "system",
			};

		// User with null IP (should be ignored)
		User noIpUser =
			new()
			{
				Username = "noipuser",
				Email = "noip@example.com",
				LastLoginAt =
					now.AddDays(-100),
				LastLoginIp = null,
				CreateDate =
					now.AddDays(-200),
				CreatedBy = "system",
			};

		this.DbContext.Users.AddRange(
			oldLoginUser,
			recentLoginUser,
			activeUser,
			noIpUser);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - old user IP should be anonymized (set to null)
		// Note: Must use AsNoTracking() because ExecuteUpdateAsync updates DB directly without updating tracked entities
		User? oldUserAfter =
			await this.DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == oldLoginUser.Id);
		oldUserAfter.ShouldNotBeNull();
		oldUserAfter.LastLoginIp.ShouldBeNull();

		// Assert - recent user IP should remain
		User? recentUserAfter =
			await this.DbContext
				.Users
				.AsNoTracking()
				.FirstOrDefaultAsync(user => user.Id == recentLoginUser.Id);
		recentUserAfter.ShouldNotBeNull();
		recentUserAfter.LastLoginIp.ShouldBe("192.168.1.200");

		// Assert - active user IP should remain
		User? activeUserAfter =
			await this.DbContext
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
			this.TimeProvider.GetUtcNow().UtcDateTime;

		User boundaryUser =
			new()
			{
				Username = "boundaryuser",
				Email = "boundary@example.com",
				LastLoginAt =
					now.AddDays(-90),
				LastLoginIp = "10.0.0.1",
				CreateDate =
					now.AddDays(-180),
				CreatedBy = "system",
			};

		this.DbContext.Users.Add(boundaryUser);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - exactly at cutoff should be anonymized (<= cutoff)
		User? userAfter =
			await this.DbContext
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
			this.TimeProvider.GetUtcNow().UtcDateTime;

		User safeUser =
			new()
			{
				Username = "safeuser",
				Email = "safe@example.com",
				LastLoginAt =
					now.AddDays(-89),
				LastLoginIp = "172.16.0.1",
				CreateDate =
					now.AddDays(-180),
				CreatedBy = "system",
			};

		this.DbContext.Users.Add(safeUser);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should NOT be anonymized (within retention)
		User? userAfter =
			await this.DbContext
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
			this.TimeProvider.GetUtcNow().UtcDateTime;

		User oldUser =
			new()
			{
				Username = "loguser",
				Email = "log@example.com",
				LastLoginAt =
					now.AddDays(-100),
				LastLoginIp = "192.168.1.1",
				CreateDate =
					now.AddDays(-200),
				CreatedBy = "system",
			};

		this.DbContext.Users.Add(oldUser);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should log at Information level
		this.Logger.ReceivedWithAnyArgs(1).Log(
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
			this.TimeProvider.GetUtcNow().UtcDateTime;

		User recentUser =
			new()
			{
				Username = "nologuser",
				Email = "nolog@example.com",
				LastLoginAt =
					now.AddDays(-30),
				LastLoginIp = "192.168.1.1",
				CreateDate =
					now.AddDays(-60),
				CreatedBy = "system",
			};

		this.DbContext.Users.Add(recentUser);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.AnonymizationService.AnonymizeIpAddressesAsync();

		// Assert - should NOT log (nothing anonymized)
		this.Logger.DidNotReceiveWithAnyArgs().Log(
			default,
			default,
			default!,
			default,
			default!);
	}

	public void Dispose()
	{
		this.DbContext.Dispose();
		GC.SuppressFinalize(this);
	}
}
