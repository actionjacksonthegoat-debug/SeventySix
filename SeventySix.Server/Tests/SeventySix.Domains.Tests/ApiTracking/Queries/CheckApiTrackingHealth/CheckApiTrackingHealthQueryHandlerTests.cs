// <copyright file="CheckApiTrackingHealthQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Queries.CheckApiTrackingHealth;

/// <summary>
/// Unit tests for <see cref="CheckApiTrackingHealthQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the health check logic using in-memory database.
/// The handler now uses DbContext.Database.CanConnectAsync for efficient connectivity check.
/// </remarks>
public sealed class CheckApiTrackingHealthQueryHandlerTests : IDisposable
{
	private readonly ApiTrackingDbContext Context;

	/// <summary>
	/// Initializes a new instance of the <see cref="CheckApiTrackingHealthQueryHandlerTests"/> class.
	/// </summary>
	public CheckApiTrackingHealthQueryHandlerTests()
	{
		DbContextOptions<ApiTrackingDbContext> options =
			new DbContextOptionsBuilder<ApiTrackingDbContext>()
				.UseInMemoryDatabase(
					databaseName: Guid.NewGuid().ToString())
				.Options;

		Context =
			new ApiTrackingDbContext(options);
	}

	/// <summary>
	/// Tests that successful database connection returns true.
	/// </summary>
	[Fact]
	public async Task HandleAsync_HealthyDatabase_ReturnsTrueAsync()
	{
		// Arrange
		CheckApiTrackingHealthQuery query =
			new();

		// Act
		bool result =
			await CheckApiTrackingHealthQueryHandler.HandleAsync(
				query,
				Context,
				CancellationToken.None);

		// Assert
		result.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that the handler uses efficient connectivity check.
	/// </summary>
	/// <remarks>
	/// In-memory provider always returns true for CanConnectAsync,
	/// so this test verifies the handler doesn't throw.
	/// </remarks>
	[Fact]
	public async Task HandleAsync_CallsCanConnectAsync()
	{
		// Arrange
		CheckApiTrackingHealthQuery query =
			new();

		// Act
		bool result =
			await CheckApiTrackingHealthQueryHandler.HandleAsync(
				query,
				Context,
				CancellationToken.None);

		// Assert - should complete without throwing
		result.ShouldBeTrue();
	}

	/// <inheritdoc/>
	public void Dispose()
	{
		Context.Dispose();
		GC.SuppressFinalize(this);
	}
}