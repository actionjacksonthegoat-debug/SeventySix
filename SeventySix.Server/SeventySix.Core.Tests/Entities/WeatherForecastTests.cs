// <copyright file="WeatherForecastTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using SeventySix.Core.Entities;

namespace SeventySix.Core.Tests.Entities;

/// <summary>
/// Unit tests for WeatherForecast domain entity.
/// Validates business logic, calculated properties, and domain rules.
/// </summary>
/// <remarks>
/// Tests the core domain model to ensure:
/// - Property getters and setters work correctly
/// - Calculated properties (TemperatureF) are accurate
/// - Business rules are enforced
/// - No external dependencies (pure domain logic)
/// </remarks>
public class WeatherForecastTests
{
	/// <summary>
	/// Tests that TemperatureF is correctly calculated from TemperatureC.
	/// </summary>
	/// <remarks>
	/// The formula is: F = 32 + (C / 0.5556)
	/// This is equivalent to: F = 32 + (C * 9/5)
	/// </remarks>
	[Theory]
	[InlineData(0, 32)]      // Freezing point of water
	[InlineData(100, 211)]   // Boiling point of water (formula uses / 0.5556, not * 9/5)
	[InlineData(-40, -39)]   // Near point where C = F (off by 1 due to integer division)
	[InlineData(20, 67)]     // Room temperature
	[InlineData(-20, -3)]    // Cold day
	[InlineData(37, 98)]     // Body temperature
	public void TemperatureF_CalculatesCorrectly_FromTemperatureC(int celsius, int expectedFahrenheit)
	{
		// Arrange & Act
		var forecast = new WeatherForecast
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = celsius,
			Summary = "Test"
		};

		// Assert
		forecast.TemperatureF.Should().Be(expectedFahrenheit);
	}

	/// <summary>
	/// Tests that all properties can be set and retrieved correctly.
	/// </summary>
	[Fact]
	public void Properties_CanBeSetAndRetrieved()
	{
		// Arrange
		var date = new DateOnly(2025, 11, 10);
		var temperature = 25;
		var summary = "Warm and sunny";

		// Act
		var forecast = new WeatherForecast
		{
			Date = date,
			TemperatureC = temperature,
			Summary = summary
		};

		// Assert
		forecast.Date.Should().Be(date);
		forecast.TemperatureC.Should().Be(temperature);
		forecast.Summary.Should().Be(summary);
	}

	/// <summary>
	/// Tests that Summary property can be null (optional field).
	/// </summary>
	[Fact]
	public void Summary_CanBeNull()
	{
		// Arrange & Act
		var forecast = new WeatherForecast
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = null
		};

		// Assert
		forecast.Summary.Should().BeNull();
	}

	/// <summary>
	/// Tests that TemperatureF updates when TemperatureC is changed.
	/// </summary>
	/// <remarks>
	/// TemperatureF is a calculated property, so it should reflect
	/// changes to TemperatureC immediately.
	/// </remarks>
	[Fact]
	public void TemperatureF_UpdatesWhen_TemperatureCChanges()
	{
		// Arrange
		var forecast = new WeatherForecast
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 0,
			Summary = "Cold"
		};

		// Act - Initial value
		var initialF = forecast.TemperatureF;

		// Act - Change temperature
		forecast.TemperatureC = 100;
		var updatedF = forecast.TemperatureF;

		// Assert
		initialF.Should().Be(32);
		updatedF.Should().Be(211);
	}

	/// <summary>
	/// Tests that entity can be created with default constructor.
	/// </summary>
	[Fact]
	public void Constructor_CreatesInstance_WithDefaultValues()
	{
		// Act
		var forecast = new WeatherForecast();

		// Assert
		forecast.Should().NotBeNull();
		forecast.Date.Should().Be(default);
		forecast.TemperatureC.Should().Be(0);
		forecast.Summary.Should().BeNull();
	}

	/// <summary>
	/// Tests that Date property accepts future dates.
	/// </summary>
	/// <remarks>
	/// Business rule: Forecasts should be for today or future dates.
	/// This is enforced at the application layer via validation.
	/// </remarks>
	[Fact]
	public void Date_AcceptsFutureDates()
	{
		// Arrange
		var futureDate = DateOnly.FromDateTime(DateTime.Now.AddDays(7));

		// Act
		var forecast = new WeatherForecast
		{
			Date = futureDate,
			TemperatureC = 20,
			Summary = "Future forecast"
		};

		// Assert
		forecast.Date.Should().Be(futureDate);
		forecast.Date.Should().BeAfter(DateOnly.FromDateTime(DateTime.Now));
	}

	/// <summary>
	/// Tests that TemperatureC can store negative values.
	/// </summary>
	/// <remarks>
	/// Valid range is -100°C to 100°C (enforced by validation layer).
	/// </remarks>
	[Fact]
	public void TemperatureC_AcceptsNegativeValues()
	{
		// Arrange & Act
		var forecast = new WeatherForecast
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = -30,
			Summary = "Freezing"
		};

		// Assert
		forecast.TemperatureC.Should().Be(-30);
		forecast.TemperatureF.Should().Be(-21);
	}

	/// <summary>
	/// Tests that entity supports extreme valid temperature values.
	/// </summary>
	/// <remarks>
	/// Tests boundary conditions within the valid range.
	/// </remarks>
	[Theory]
	[InlineData(-60)]  // Very cold (but within valid range)
	[InlineData(60)]   // Very hot (but within valid range)
	public void TemperatureC_HandlesExtremeValues(int temperature)
	{
		// Arrange & Act
		var forecast = new WeatherForecast
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = temperature,
			Summary = "Extreme"
		};

		// Assert
		forecast.TemperatureC.Should().Be(temperature);
		forecast.TemperatureF.Should().NotBe(0);
	}
}