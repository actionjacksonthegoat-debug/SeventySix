// <copyright file="HealthCheckServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for HealthCheckService.
/// </summary>
public class HealthCheckServiceTests
{
	private readonly IMetricsService MetricsService;
	private readonly IDatabaseHealthCheck IdentityHealthCheck;
	private readonly IDatabaseHealthCheck LoggingHealthCheck;
	private readonly IDatabaseHealthCheck ApiTrackingHealthCheck;

	public HealthCheckServiceTests()
	{
		MetricsService =
			Substitute.For<IMetricsService>();
		IdentityHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();
		LoggingHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();
		ApiTrackingHealthCheck =
			Substitute.For<IDatabaseHealthCheck>();

		// Setup default mock behaviors
		IdentityHealthCheck.ContextName.Returns("Identity");
		IdentityHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);

		LoggingHealthCheck.ContextName.Returns("Logging");
		LoggingHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);

		ApiTrackingHealthCheck.ContextName.Returns("ApiTracking");
		ApiTrackingHealthCheck
			.CheckHealthAsync(Arg.Any<CancellationToken>())
			.Returns(true);
	}

	private HealthCheckService CreateSut(TimeProvider? timeProvider = null)
	{
		IEnumerable<IDatabaseHealthCheck> databaseHealthChecks =
			[
			IdentityHealthCheck,
			LoggingHealthCheck,
			ApiTrackingHealthCheck,
		];

		return new HealthCheckService(
			MetricsService,
			databaseHealthChecks,
			timeProvider ?? TimeProvider.System);
	}

	[Fact]
	public async Task GetHealthStatusAsync_ReturnsHealthyStatusAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		HealthCheckService service =
			CreateSut(timeProvider);

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Status.ShouldBe(HealthStatusConstants.Healthy);
		result.Database.ShouldNotBeNull();
		result.ExternalApis.ShouldNotBeNull();
		result.ErrorQueue.ShouldNotBeNull();
		result.System.ShouldNotBeNull();
		result.CheckedAt.ShouldBeLessThanOrEqualTo(timeProvider.GetUtcNow().UtcDateTime);
		result.CheckedAt.ShouldBeGreaterThan(timeProvider.GetUtcNow().UtcDateTime.AddSeconds(-5));
	}

	[Fact]
	public async Task GetHealthStatusAsync_DatabaseIsConnectedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		result.Database.IsConnected.ShouldBeTrue();
		result.Database.Status.ShouldBe(HealthStatusConstants.Healthy);
		result.Database.ResponseTimeMs.ShouldBeGreaterThanOrEqualTo(0);

		// Verify all bounded contexts are checked
		result.Database.ContextResults.ShouldNotBeNull();
		result.Database.ContextResults.Count.ShouldBe(3);
		result.Database.ContextResults.ContainsKey("Identity").ShouldBeTrue();
		result.Database.ContextResults.ContainsKey("Logging").ShouldBeTrue();
		result.Database.ContextResults.ContainsKey("ApiTracking").ShouldBeTrue();
		result.Database.ContextResults["Identity"].ShouldBeTrue();
		result.Database.ContextResults["Logging"].ShouldBeTrue();
		result.Database.ContextResults["ApiTracking"].ShouldBeTrue();
	}

	[Fact]
	public async Task GetHealthStatusAsync_ExternalApisInitializedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		result.ExternalApis.ShouldNotBeNull();
		result.ExternalApis.Apis.ShouldNotBeNull();
	}

	[Fact]
	public async Task GetHealthStatusAsync_ErrorQueueHealthyAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		result.ErrorQueue.ShouldNotBeNull();
		result.ErrorQueue.Status.ShouldBe(HealthStatusConstants.Healthy);
		result.ErrorQueue.CircuitBreakerOpen.ShouldBeFalse();
		result.ErrorQueue.QueuedItems.ShouldBeGreaterThanOrEqualTo(0);
		result.ErrorQueue.FailedItems.ShouldBeGreaterThanOrEqualTo(0);
	}

	[Fact]
	public async Task GetHealthStatusAsync_SystemResourcesPopulatedAsync()
	{
		// Arrange
		HealthCheckService service = CreateSut();

		// Act
		HealthStatusResponse result =
			await service.GetHealthStatusAsync(
			CancellationToken.None);

		// Assert
		result.System.ShouldNotBeNull();
		result.System.CpuUsagePercent.ShouldBeGreaterThanOrEqualTo(0);
		result.System.CpuUsagePercent.ShouldBeLessThanOrEqualTo(100);
		result.System.MemoryUsedMb.ShouldBeGreaterThanOrEqualTo(0);
		result.System.MemoryTotalMb.ShouldBeGreaterThanOrEqualTo(result.System.MemoryUsedMb);
		result.System.DiskUsagePercent.ShouldBeGreaterThanOrEqualTo(0);
		result.System.DiskUsagePercent.ShouldBeLessThanOrEqualTo(100);
	}
}