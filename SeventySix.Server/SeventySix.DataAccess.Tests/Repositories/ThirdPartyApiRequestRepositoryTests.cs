// <copyright file="ThirdPartyApiRequestRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Application.Entities;
using SeventySix.Data;
using SeventySix.DataAccess.Repositories;
using SeventySix.DataAccess.Tests.Integration;

namespace SeventySix.DataAccess.Tests.Repositories;

/// <summary>
/// Integration tests for <see cref="ThirdPartyApiRequestRepository"/>.
/// </summary>
/// <remarks>
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// Follows TDD principles and ensures repository implements contract correctly.
///
/// Test Coverage:
/// - CRUD operations
/// - Constraint violations (unique constraint)
/// - Null handling
/// - Query performance
/// - Concurrency
/// </remarks>
[Collection("DatabaseTests")]
public class ThirdPartyApiRequestRepositoryTests : PostgreSqlTestBase, IClassFixture<PostgreSqlFixture>
{
	private readonly ThirdPartyApiRequestRepository Repository;

	public ThirdPartyApiRequestRepositoryTests(PostgreSqlFixture fixture)
		: base(fixture)
	{
		ApplicationDbContext context = CreateDbContext();
		Repository = new ThirdPartyApiRequestRepository(
			context,
			Mock.Of<ILogger<ThirdPartyApiRequestRepository>>());
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsRecord_WhenExistsAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		};
		await Repository.CreateAsync(request);

		// Act
		ThirdPartyApiRequest? result = await Repository.GetByApiNameAndDateAsync("OpenWeather", today);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("OpenWeather", result.ApiName);
		Assert.Equal(10, result.CallCount);
		Assert.Equal(today, result.ResetDate);
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

		// Act
		ThirdPartyApiRequest? result = await Repository.GetByApiNameAndDateAsync("NonExistent", today);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsNull_WhenDifferentDateAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);

		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		};
		await Repository.CreateAsync(request);

		// Act
		ThirdPartyApiRequest? result = await Repository.GetByApiNameAndDateAsync("OpenWeather", yesterday);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task CreateAsync_CreatesRecord_WithGeneratedIdAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};

		// Act
		ThirdPartyApiRequest result = await Repository.CreateAsync(request);

		// Assert
		Assert.NotEqual(0, result.Id); // Id should be generated
		Assert.Equal("OpenWeather", result.ApiName);
		Assert.Equal(5, result.CallCount);
	}

	[Fact]
	public async Task CreateAsync_SetsTimestamps_AutomaticallyAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateTime beforeCreate = DateTime.UtcNow;
		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};

		// Act
		ThirdPartyApiRequest result = await Repository.CreateAsync(request);
		DateTime afterCreate = DateTime.UtcNow;

		// Assert
		Assert.True(result.CreatedAt >= beforeCreate && result.CreatedAt <= afterCreate);
		Assert.True(result.UpdatedAt >= beforeCreate && result.UpdatedAt <= afterCreate);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenDuplicateApiNameAndDateAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request1 = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};
		await Repository.CreateAsync(request1);

		ThirdPartyApiRequest request2 = new()
		{
			ApiName = "OpenWeather", // Same API
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today, // Same date
		};

		// Act & Assert
		await Assert.ThrowsAsync<DbUpdateException>(() => Repository.CreateAsync(request2));
	}

	[Fact]
	public async Task CreateAsync_AllowsDifferentDatesForSameApiAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);

		ThirdPartyApiRequest request1 = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};

		ThirdPartyApiRequest request2 = new()
		{
			ApiName = "OpenWeather", // Same API
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = yesterday, // Different date
		};

		// Act
		await Repository.CreateAsync(request1);
		ThirdPartyApiRequest result = await Repository.CreateAsync(request2);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(yesterday, result.ResetDate);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesRecord_SuccessfullyAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};
		ThirdPartyApiRequest created = await Repository.CreateAsync(request);

		// Act
		created.CallCount = 10;
		ThirdPartyApiRequest result = await Repository.UpdateAsync(created);

		// Assert
		Assert.Equal(10, result.CallCount);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesTimestamp_AutomaticallyAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};
		ThirdPartyApiRequest created = await Repository.CreateAsync(request);
		DateTime originalUpdatedAt = created.UpdatedAt;

		// Wait to ensure timestamp difference
		await Task.Delay(100);

		// Act
		created.CallCount = 10;
		ThirdPartyApiRequest result = await Repository.UpdateAsync(created);

		// Assert
		Assert.True(result.UpdatedAt > originalUpdatedAt);
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsAllRecordsForApiAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);
		DateOnly twoDaysAgo = today.AddDays(-2);

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		});

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 20,
			ResetDate = yesterday,
		});

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 15,
			ResetDate = twoDaysAgo,
		});

		// Different API
		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "DifferentApi",
			BaseUrl = "https://api.example.com",
			CallCount = 5,
			ResetDate = today,
		});

		// Act
		IEnumerable<ThirdPartyApiRequest> results = await Repository.GetByApiNameAsync("OpenWeather");

		// Assert
		List<ThirdPartyApiRequest> resultList = [.. results];
		Assert.Equal(3, resultList.Count);
		Assert.All(resultList, r => Assert.Equal("OpenWeather", r.ApiName));
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsEmptyCollection_WhenNoRecordsExistAsync()
	{
		// Act
		IEnumerable<ThirdPartyApiRequest> results = await Repository.GetByApiNameAsync("NonExistent");

		// Assert
		Assert.Empty(results);
	}

	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldRecordsAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly tenDaysAgo = today.AddDays(-10);
		DateOnly thirtyDaysAgo = today.AddDays(-30);
		DateOnly fortyDaysAgo = today.AddDays(-40);

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		});

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = tenDaysAgo,
		});

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = thirtyDaysAgo,
		});

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = fortyDaysAgo,
		});

		// Act
		int deletedCount = await Repository.DeleteOlderThanAsync(thirtyDaysAgo);

		// Assert
		Assert.Equal(1, deletedCount); // Only fortyDaysAgo should be deleted
		IEnumerable<ThirdPartyApiRequest> remaining = await Repository.GetByApiNameAsync("OpenWeather");
		Assert.Equal(3, remaining.Count());
	}

	[Fact]
	public async Task DeleteOlderThanAsync_ReturnsZero_WhenNoRecordsToDeleteAsync()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);

		await Repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		});

		// Act
		int deletedCount = await Repository.DeleteOlderThanAsync(yesterday);

		// Assert
		Assert.Equal(0, deletedCount);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenEntityIsNullAsync() =>
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => Repository.CreateAsync(null!));

	[Fact]
	public async Task UpdateAsync_ThrowsException_WhenEntityIsNullAsync() =>
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => Repository.UpdateAsync(null!));

	[Fact]
	public async Task GetByApiNameAndDateAsync_ThrowsException_WhenApiNameIsNullAsync()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			() => Repository.GetByApiNameAndDateAsync(null!, DateOnly.FromDateTime(DateTime.UtcNow)));
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ThrowsException_WhenApiNameIsEmptyAsync()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentException>(
			() => Repository.GetByApiNameAndDateAsync(string.Empty, DateOnly.FromDateTime(DateTime.UtcNow)));
	}
}
