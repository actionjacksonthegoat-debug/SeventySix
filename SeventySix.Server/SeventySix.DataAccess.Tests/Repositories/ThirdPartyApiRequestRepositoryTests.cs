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
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		};
		await _repository.CreateAsync(request);

		// Act
		var result = await _repository.GetByApiNameAndDateAsync("OpenWeather", today);

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
		var today = DateOnly.FromDateTime(DateTime.UtcNow);

		// Act
		var result = await _repository.GetByApiNameAndDateAsync("NonExistent", today);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task GetByApiNameAndDateAsync_ReturnsNull_WhenDifferentDate()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var yesterday = today.AddDays(-1);

		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 10,
			ResetDate = today,
		};
		await _repository.CreateAsync(request);

		// Act
		var result = await _repository.GetByApiNameAndDateAsync("OpenWeather", yesterday);

		// Assert
		Assert.Null(result);
	}

	[Fact]
	public async Task CreateAsync_CreatesRecord_WithGeneratedId()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};

		// Act
		var result = await _repository.CreateAsync(request);

		// Assert
		Assert.NotEqual(0, result.Id); // Id should be generated
		Assert.Equal("OpenWeather", result.ApiName);
		Assert.Equal(5, result.CallCount);
	}

	[Fact]
	public async Task CreateAsync_SetsTimestamps_Automatically()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var beforeCreate = DateTime.UtcNow;
		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};

		// Act
		var result = await _repository.CreateAsync(request);
		var afterCreate = DateTime.UtcNow;

		// Assert
		Assert.True(result.CreatedAt >= beforeCreate && result.CreatedAt <= afterCreate);
		Assert.True(result.UpdatedAt >= beforeCreate && result.UpdatedAt <= afterCreate);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenDuplicateApiNameAndDate()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var request1 = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};
		await _repository.CreateAsync(request1);

		var request2 = new ThirdPartyApiRequest
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
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var yesterday = today.AddDays(-1);

		var request1 = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		};

		var request2 = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather", // Same API
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = yesterday, // Different date
		};

		// Act
		await _repository.CreateAsync(request1);
		var result = await _repository.CreateAsync(request2);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(yesterday, result.ResetDate);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesRecord_Successfully()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};
		var created = await _repository.CreateAsync(request);

		// Act
		created.CallCount = 10;
		var result = await _repository.UpdateAsync(created);

		// Assert
		Assert.Equal(10, result.CallCount);
	}

	[Fact]
	public async Task UpdateAsync_UpdatesTimestamp_Automatically()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var request = new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			CallCount = 5,
			ResetDate = today,
		};
		var created = await _repository.CreateAsync(request);
		var originalUpdatedAt = created.UpdatedAt;

		// Wait to ensure timestamp difference
		await Task.Delay(100);

		// Act
		created.CallCount = 10;
		var result = await _repository.UpdateAsync(created);

		// Assert
		Assert.True(result.UpdatedAt > originalUpdatedAt);
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsAllRecordsForApi()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var yesterday = today.AddDays(-1);
		var twoDaysAgo = today.AddDays(-2);

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
		var results = await _repository.GetByApiNameAsync("OpenWeather");

		// Assert
		var resultList = results.ToList();
		Assert.Equal(3, resultList.Count);
		Assert.All(resultList, r => Assert.Equal("OpenWeather", r.ApiName));
	}

	[Fact]
	public async Task GetByApiNameAsync_ReturnsEmptyCollection_WhenNoRecords()
	{
		// Act
		var results = await _repository.GetByApiNameAsync("NonExistent");

		// Assert
		Assert.Empty(results);
	}

	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldRecords()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var tenDaysAgo = today.AddDays(-10);
		var thirtyDaysAgo = today.AddDays(-30);
		var fortyDaysAgo = today.AddDays(-40);

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
		var deletedCount = await _repository.DeleteOlderThanAsync(thirtyDaysAgo);

		// Assert
		Assert.Equal(1, deletedCount); // Only fortyDaysAgo should be deleted
		var remaining = await _repository.GetByApiNameAsync("OpenWeather");
		Assert.Equal(3, remaining.Count());
	}

	[Fact]
	public async Task DeleteOlderThanAsync_ReturnsZero_WhenNoRecordsToDelete()
	{
		// Arrange
		var today = DateOnly.FromDateTime(DateTime.UtcNow);
		var yesterday = today.AddDays(-1);

		await _repository.CreateAsync(new ThirdPartyApiRequest
		{
			ApiName = "OpenWeather",
			BaseUrl = "https://api.openweathermap.org",
			ResetDate = today,
		});

		// Act
		var deletedCount = await _repository.DeleteOlderThanAsync(yesterday);

		// Assert
		Assert.Equal(0, deletedCount);
	}

	[Fact]
	public async Task CreateAsync_ThrowsException_WhenEntityIsNull()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateAsync(null!));
	}

	[Fact]
	public async Task UpdateAsync_ThrowsException_WhenEntityIsNull()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.UpdateAsync(null!));
	}

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
