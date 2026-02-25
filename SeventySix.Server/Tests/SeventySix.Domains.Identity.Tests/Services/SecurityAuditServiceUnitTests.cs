// <copyright file="SecurityAuditServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="SecurityAuditService"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule - tests critical paths:
/// - Successful event logging with all parameters
/// - User overload delegates correctly
/// - Client info extraction
/// </remarks>
public sealed class SecurityAuditServiceUnitTests
{
	private readonly FakeTimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="SecurityAuditServiceUnitTests"/> class.
	/// </summary>
	public SecurityAuditServiceUnitTests()
	{
		TimeProvider =
			TestDates.CreateDefaultTimeProvider();
	}

	private static IdentityDbContext CreateInMemoryDbContext()
	{
		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
				.Options;

		return new IdentityDbContext(options);
	}

	/// <summary>
	/// Verifies that LogEventAsync extracts client info and saves event.
	/// </summary>
	[Fact]
	public async Task LogEventAsync_WithUserId_ExtractsClientInfoAndSavesEventAsync()
	{
		// Arrange
		await using IdentityDbContext dbContext =
			CreateInMemoryDbContext();

		IClientInfoService clientInfoService =
			Substitute.For<IClientInfoService>();
		clientInfoService.ExtractClientIp().Returns("192.168.1.100");
		clientInfoService.ExtractUserAgent().Returns("Mozilla/5.0 Test Agent");

		ILogger<SecurityAuditService> logger =
			Substitute.For<ILogger<SecurityAuditService>>();

		SecurityAuditService serviceUnderTest =
			new(
				dbContext,
				clientInfoService,
				TimeProvider,
				logger);

		const long UserId = 123;
		const string Username = "testuser";

		// Act
		await serviceUnderTest.LogEventAsync(
			SecurityEventType.LoginSuccess,
			UserId,
			Username,
			success: true,
			details: null,
			CancellationToken.None);

		// Assert
		SecurityEvent? savedEvent =
			await dbContext.SecurityEvents.FirstOrDefaultAsync();

		savedEvent.ShouldNotBeNull();
		savedEvent.EventType.ShouldBe(SecurityEventType.LoginSuccess);
		savedEvent.UserId.ShouldBe(UserId);
		savedEvent.Username.ShouldBe(Username);
		savedEvent.Success.ShouldBeTrue();
		savedEvent.IpAddress.ShouldBe("192.168.1.100");
		savedEvent.UserAgent.ShouldBe("Mozilla/5.0 Test Agent");
		savedEvent.CreateDate.ShouldBe(TimeProvider.GetUtcNow());
	}

	/// <summary>
	/// Verifies that LogEventAsync with ApplicationUser extracts user details correctly.
	/// </summary>
	[Fact]
	public async Task LogEventAsync_WithApplicationUser_ExtractsUserDetailsAsync()
	{
		// Arrange
		await using IdentityDbContext dbContext =
			CreateInMemoryDbContext();

		IClientInfoService clientInfoService =
			Substitute.For<IClientInfoService>();
		clientInfoService.ExtractClientIp().Returns("10.0.0.1");
		clientInfoService.ExtractUserAgent().Returns("Test Browser");

		ILogger<SecurityAuditService> logger =
			Substitute.For<ILogger<SecurityAuditService>>();

		SecurityAuditService serviceUnderTest =
			new(
				dbContext,
				clientInfoService,
				TimeProvider,
				logger);

		ApplicationUser user =
			new()
			{
				Id = 456,
				UserName = "adminuser"
			};

		// Act
		await serviceUnderTest.LogEventAsync(
			SecurityEventType.AccountLocked,
			user,
			success: false,
			details: "Too many failed attempts",
			CancellationToken.None);

		// Assert
		SecurityEvent? savedEvent =
			await dbContext.SecurityEvents.FirstOrDefaultAsync();

		savedEvent.ShouldNotBeNull();
		savedEvent.UserId.ShouldBe(user.Id);
		savedEvent.Username.ShouldBe(user.UserName);
		savedEvent.Success.ShouldBeFalse();
		savedEvent.Details.ShouldBe("Too many failed attempts");
	}

	/// <summary>
	/// Verifies that LogEventAsync with null user throws ArgumentNullException.
	/// </summary>
	[Fact]
	public async Task LogEventAsync_WithNullUser_ThrowsArgumentNullExceptionAsync()
	{
		// Arrange
		await using IdentityDbContext dbContext =
			CreateInMemoryDbContext();

		IClientInfoService clientInfoService =
			Substitute.For<IClientInfoService>();

		ILogger<SecurityAuditService> logger =
			Substitute.For<ILogger<SecurityAuditService>>();

		SecurityAuditService serviceUnderTest =
			new(
				dbContext,
				clientInfoService,
				TimeProvider,
				logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(
			async () =>
				await serviceUnderTest.LogEventAsync(
					SecurityEventType.LoginFailed,
					user: null!,
					success: false,
					details: null,
					CancellationToken.None));
	}

	/// <summary>
	/// Verifies that details are properly stored when provided.
	/// </summary>
	[Fact]
	public async Task LogEventAsync_WithDetails_StoresDetailsCorrectlyAsync()
	{
		// Arrange
		await using IdentityDbContext dbContext =
			CreateInMemoryDbContext();

		IClientInfoService clientInfoService =
			Substitute.For<IClientInfoService>();
		clientInfoService.ExtractClientIp().Returns(default(string?));
		clientInfoService.ExtractUserAgent().Returns(default(string?));

		ILogger<SecurityAuditService> logger =
			Substitute.For<ILogger<SecurityAuditService>>();

		SecurityAuditService serviceUnderTest =
			new(
				dbContext,
				clientInfoService,
				TimeProvider,
				logger);

		const string Details = "Token reuse detected from different IP";

		// Act
		await serviceUnderTest.LogEventAsync(
			SecurityEventType.TokenReuseDetected,
			userId: 100,
			username: "suspicious",
			success: false,
			details: Details,
			CancellationToken.None);

		// Assert
		SecurityEvent? savedEvent =
			await dbContext.SecurityEvents.FirstOrDefaultAsync();

		savedEvent.ShouldNotBeNull();
		savedEvent.Details.ShouldBe(Details);
		savedEvent.IpAddress.ShouldBeNull();
		savedEvent.UserAgent.ShouldBeNull();
	}
}