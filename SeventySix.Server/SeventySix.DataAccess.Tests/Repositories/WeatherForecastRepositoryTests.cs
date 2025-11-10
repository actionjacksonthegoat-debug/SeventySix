using FluentAssertions;
using SeventySix.Core.Entities;
using SeventySix.DataAccess.Repositories;

namespace SeventySix.DataAccess.Tests.Repositories;

/// <summary>
/// Unit tests for WeatherForecastRepository
/// </summary>
public class WeatherForecastRepositoryTests
{
	private readonly WeatherForecastRepository Repository;

	public WeatherForecastRepositoryTests()
	{
		Repository = new WeatherForecastRepository();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnEmptyList_WhenNoForecastsExistAsync()
	{
		// Act
		var result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Should().BeEmpty();
	}

	[Fact]
	public async Task CreateAsync_ShouldCreateForecast_WithValidDataAsync()
	{
		// Arrange
		var forecast = new WeatherForecast
		{
			Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			TemperatureC = 25,
			Summary = "Sunny"
		};

		// Act
		var result = await Repository.CreateAsync(forecast, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Date.Should().Be(forecast.Date);
		result.TemperatureC.Should().Be(25);
		result.TemperatureF.Should().Be(76); // Calculated property
		result.Summary.Should().Be("Sunny");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnForecast_WhenForecastExistsAsync()
	{
		// Arrange
		var forecast = new WeatherForecast
		{
			Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			TemperatureC = 20,
			Summary = "Cloudy"
		};
		var created = await Repository.CreateAsync(forecast, CancellationToken.None);

		// Act
		var result = await Repository.GetByIdAsync(created.Date.DayNumber, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Date.Should().Be(created.Date);
		result.Summary.Should().Be("Cloudy");
	}

	[Fact]
	public async Task GetByIdAsync_ShouldReturnNull_WhenForecastDoesNotExistAsync()
	{
		// Act
		var result = await Repository.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
	}

	[Fact]
	public async Task UpdateAsync_ShouldUpdateForecast_WhenForecastExistsAsync()
	{
		// Arrange
		var forecast = new WeatherForecast
		{
			Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			TemperatureC = 20,
			Summary = "Cloudy"
		};
		var created = await Repository.CreateAsync(forecast, CancellationToken.None);

		created.TemperatureC = 30;
		created.Summary = "Hot";

		// Act
		var result = await Repository.UpdateAsync(created, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.TemperatureC.Should().Be(30);
		result.TemperatureF.Should().Be(86); // Calculated property
		result.Summary.Should().Be("Hot");
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnTrue_WhenForecastExistsAsync()
	{
		// Arrange
		var forecast = new WeatherForecast
		{
			Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			TemperatureC = 20,
			Summary = "Rainy"
		};
		var created = await Repository.CreateAsync(forecast, CancellationToken.None);

		// Act
		var result = await Repository.DeleteAsync(created.Date.DayNumber, CancellationToken.None);

		// Assert
		result.Should().BeTrue();

		// Verify forecast is deleted
		var deletedForecast = await Repository.GetByIdAsync(created.Date.DayNumber, CancellationToken.None);
		deletedForecast.Should().BeNull();
	}

	[Fact]
	public async Task DeleteAsync_ShouldReturnFalse_WhenForecastDoesNotExistAsync()
	{
		// Act
		var result = await Repository.DeleteAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	[Fact]
	public async Task GetAllAsync_ShouldReturnMultipleForecasts_WhenForecastsExistAsync()
	{
		// Arrange
		var forecast1 = new WeatherForecast { Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)), TemperatureC = 20, Summary = "Sunny" };
		var forecast2 = new WeatherForecast { Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)), TemperatureC = 25, Summary = "Cloudy" };
		var forecast3 = new WeatherForecast { Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)), TemperatureC = 30, Summary = "Hot" };

		await Repository.CreateAsync(forecast1, CancellationToken.None);
		await Repository.CreateAsync(forecast2, CancellationToken.None);
		await Repository.CreateAsync(forecast3, CancellationToken.None);

		// Act
		var result = await Repository.GetAllAsync(CancellationToken.None);

		// Assert
		result.Should().HaveCount(3);
		result.Select(f => f.Summary).Should().Contain(new[] { "Sunny", "Cloudy", "Hot" });
	}

	[Fact]
	public void TemperatureF_ShouldCalculateCorrectly()
	{
		// Arrange & Act
		var forecast = new WeatherForecast
		{
			TemperatureC = 0
		};

		// Assert
		forecast.TemperatureF.Should().Be(32);

		// Test another value
		forecast.TemperatureC = 100;
		forecast.TemperatureF.Should().Be(212);
	}
}
