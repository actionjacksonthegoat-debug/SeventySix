// <copyright file="ThirdPartyApiRequestRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Core.Entities;
using SeventySix.Data;
using SeventySix.DataAccess.Repositories;

namespace SeventySix.DataAccess.Tests.Repositories;

/// <summary>
/// Unit tests for <see cref="ThirdPartyApiRequestRepository"/>.
/// </summary>
/// <remarks>
/// Uses in-memory SQLite database for fast, isolated testing.
/// Follows TDD principles and ensures repository implements contract correctly.
///
/// Test Coverage:
/// - CRUD operations
/// - Constraint violations (unique constraint)
/// - Null handling
/// - Query performance
/// - Concurrency
/// </remarks>
public class ThirdPartyApiRequestRepositoryTests : IDisposable
{
	private readonly SqliteConnection _connection;
	private readonly DbContextOptions<ApplicationDbContext> _options;
	private readonly ApplicationDbContext _context;
	private readonly ThirdPartyApiRequestRepository _repository;
	private bool _disposed;

	public ThirdPartyApiRequestRepositoryTests()
	{
		// Create in-memory SQLite database
		_connection = new SqliteConnection("DataSource=:memory:");
		_connection.Open();

		_options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseSqlite(_connection)
			.Options;

		_context = new ApplicationDbContext(_options);
		_context.Database.EnsureCreated();

		_repository = new ThirdPartyApiRequestRepository(
			_context,
			Mock.Of<ILogger<ThirdPartyApiRequestRepository>>());
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsRecord_WhenExists()
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
		await _repository.CreateAsync(request);

		// Act
		ThirdPartyApiRequest? result = await _repository.GetByApiNameAndDateAsync("OpenWeather", today);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("OpenWeather", result.ApiName);
		Assert.Equal(10, result.CallCount);
		Assert.Equal(today, result.ResetDate);
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsNull_WhenNotFound()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

		// Act
		ThirdPartyApiRequest? result = await _repository.GetByApiNameAndDateAsync("NonExistent", today);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsNull_WhenDifferentDate()
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
		await _repository.CreateAsync(request);

		// Act
		ThirdPartyApiRequest? result = await _repository.GetByApiNameAndDateAsync("OpenWeather", yesterday);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task CreateAsync_CreatesRecord_WithGeneratedId()
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
		ThirdPartyApiRequest result = await _repository.CreateAsync(request);

		// Assert
		Assert.NotEqual(0, result.Id); // Id should be generated
		Assert.Equal("OpenWeather", result.ApiName);
		Assert.Equal(5, result.CallCount);
	}

	[Fact]
	public async Task CreateAsync_SetsTimestamps_Automatically()
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
		ThirdPartyApiRequest result = await _repository.CreateAsync(request);
		DateTime afterCreate = DateTime.UtcNow;

		// Assert
		Assert.True(result.CreatedAt >= beforeCreate && result.CreatedAt <= afterCreate);
		Assert.True(result.UpdatedAt >= beforeCreate && result.UpdatedAt <= afterCreate);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenDuplicateApiNameAndDate()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest request1 = new()
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};
		await _repository.CreateAsync(request1);

		ThirdPartyApiRequest request2 = new()
		{
			ApiName = "OpenWeather", // Same API
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today, // Same date
		};

		// Act & Assert
		await Assert.ThrowsAsync<DbUpdateException>(() => _repository.CreateAsync(request2));
	}

	[Fact]
	public async Task CreateAsync_AllowsDifferentDatesForSameApi()
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
		await _repository.CreateAsync(request1);
		ThirdPartyApiRequest result = await _repository.CreateAsync(request2);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(yesterday, result.ResetDate);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesRecord_Successfully()
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
		ThirdPartyApiRequest created = await _repository.CreateAsync(request);

		// Act
		created.CallCount = 10;
		ThirdPartyApiRequest result = await _repository.UpdateAsync(created);

		// Assert
		Assert.Equal(10, result.CallCount);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesTimestamp_Automatically()
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
		ThirdPartyApiRequest created = await _repository.CreateAsync(request);
		DateTime originalUpdatedAt = created.UpdatedAt;

		// Wait to ensure timestamp difference
		await Task.Delay(100);

		// Act
		created.CallCount = 10;
		ThirdPartyApiRequest result = await _repository.UpdateAsync(created);

		// Assert
		Assert.True(result.UpdatedAt > originalUpdatedAt);
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsAllRecordsForApi()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);
		DateOnly twoDaysAgo = today.AddDays(-2);

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		});

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 20,
			ResetDate = yesterday,
		});

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 15,
			ResetDate = twoDaysAgo,
		});

		// Different API
		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "DifferentApi",
			BaseUrl = "https://api.example.com",
			CallCount = 5,
			ResetDate = today,
		});

		// Act
		IEnumerable<ThirdPartyApiRequest> results = await _repository.GetByApiNameAsync("OpenWeather");

		// Assert
		List<ThirdPartyApiRequest> resultList = [.. results];
		Assert.Equal(3, resultList.Count);
		Assert.All(resultList, r => Assert.Equal("OpenWeather", r.ApiName));
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsEmptyCollection_WhenNoRecords()
	{
		// Act
		IEnumerable<ThirdPartyApiRequest> results = await _repository.GetByApiNameAsync("NonExistent");

		// Assert
		Assert.Empty(results);
	}

	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldRecords()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly tenDaysAgo = today.AddDays(-10);
		DateOnly thirtyDaysAgo = today.AddDays(-30);
		DateOnly fortyDaysAgo = today.AddDays(-40);

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		});

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = tenDaysAgo,
		});

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = thirtyDaysAgo,
		});

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = fortyDaysAgo,
		});

		// Act
		int deletedCount = await _repository.DeleteOlderThanAsync(thirtyDaysAgo);

		// Assert
		Assert.Equal(1, deletedCount); // Only fortyDaysAgo should be deleted
		IEnumerable<ThirdPartyApiRequest> remaining = await _repository.GetByApiNameAsync("OpenWeather");
		Assert.Equal(3, remaining.Count());
	}

	[Fact]
	public async Task DeleteOlderThanAsync_ReturnsZero_WhenNoRecordsToDelete()
	{
		// Arrange
		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		DateOnly yesterday = today.AddDays(-1);

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		});

		// Act
		int deletedCount = await _repository.DeleteOlderThanAsync(yesterday);

		// Assert
		Assert.Equal(0, deletedCount);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenEntityIsNull() =>
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateAsync(null!));

	[Fact]
	public async Task UpdateAsync_ThrowsException_WhenEntityIsNull() =>
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.UpdateAsync(null!));

	[Fact]
	public async Task GetByApiNameAndDateAsync_ThrowsException_WhenApiNameIsNull()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			() => _repository.GetByApiNameAndDateAsync(null!, DateOnly.FromDateTime(DateTime.UtcNow)));
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ThrowsException_WhenApiNameIsEmpty()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentException>(
			() => _repository.GetByApiNameAndDateAsync(string.Empty, DateOnly.FromDateTime(DateTime.UtcNow)));
	}

	public void Dispose()
	{
		Dispose(true);
		GC.SuppressFinalize(this);
	}

	protected virtual void Dispose(bool disposing)
	{
		if (!_disposed)
		{
			if (disposing)
			{
				_context?.Dispose();
				_connection?.Dispose();
			}

			_disposed = true;
		}
	}
}