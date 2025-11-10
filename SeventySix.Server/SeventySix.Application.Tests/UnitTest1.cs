// <copyright file="WeatherForecastServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Moq;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Services;
using SeventySix.Domain.Entities;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Application.Tests.Services;

/// <summary>
/// Unit tests for WeatherForecastService.
/// </summary>
public class WeatherForecastServiceTests
{
	private readonly Mock<IWeatherForecastRepository> MockRepository;
	private readonly Mock<IValidator<CreateWeatherForecastRequest>> MockValidator;
	private readonly WeatherForecastService Service;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastServiceTests"/> class.
	/// </summary>
	public WeatherForecastServiceTests()
	{
		MockRepository = new Mock<IWeatherForecastRepository>();
		MockValidator = new Mock<IValidator<CreateWeatherForecastRequest>>();
		Service = new WeatherForecastService(MockRepository.Object, MockValidator.Object);
	}

	[Fact]
	public void Constructor_WithNullRepository_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastService(null!, MockValidator.Object));
		exception.ParamName.Should().Be("repository");
	}

	[Fact]
	public void Constructor_WithNullValidator_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastService(MockRepository.Object, null!));
		exception.ParamName.Should().Be("createValidator");
	}

	[Fact]
	public async Task GetAllForecastsAsync_ReturnsEmptyList_WhenNoForecastsAsync()
	{
		// Arrange
		MockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecast>());

		// Act
		var result = await Service.GetAllForecastsAsync(CancellationToken.None);

		// Assert
		result.Should().BeEmpty();
		MockRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllForecastsAsync_ReturnsMappedDtos_WhenForecastsExistAsync()
	{
		// Arrange
		var entities = new List<WeatherForecast>
		{
			new() { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" },
			new() { Date = new DateOnly(2025, 11, 11), TemperatureC = 22, Summary = "Hot" }
		};
		MockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(entities);

		// Act
		var result = await Service.GetAllForecastsAsync(CancellationToken.None);

		// Assert
		result.Should().HaveCount(2);
		var dtos = result.ToList();
		dtos[0].Date.Should().Be(new DateOnly(2025, 11, 10));
		dtos[0].TemperatureC.Should().Be(20);
		dtos[0].Summary.Should().Be("Warm");
		dtos[0].TemperatureF.Should().Be(67); // Calculated from entity
		dtos[1].Date.Should().Be(new DateOnly(2025, 11, 11));
		dtos[1].TemperatureC.Should().Be(22);
		dtos[1].Summary.Should().Be("Hot");
		dtos[1].TemperatureF.Should().Be(71); // Calculated from entity
	}

	[Fact]
	public async Task GetForecastByIdAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		MockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecast?)null);

		// Act
		var result = await Service.GetForecastByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
		MockRepository.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetForecastByIdAsync_ReturnsMappedDto_WhenFoundAsync()
	{
		// Arrange
		var entity = new WeatherForecast { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" };
		MockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(entity);

		// Act
		var result = await Service.GetForecastByIdAsync(1, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result!.Date.Should().Be(new DateOnly(2025, 11, 10));
		result.TemperatureC.Should().Be(20);
		result.Summary.Should().Be("Warm");
		result.TemperatureF.Should().Be(67); // Calculated from entity
	}

	[Fact]
	public async Task CreateForecastAsync_WithValidRequest_ReturnsCreatedDtoAsync()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var createdEntity = new WeatherForecast
		{
			Date = request.Date,
			TemperatureC = request.TemperatureC,
			Summary = request.Summary
		};

		MockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());
		MockRepository.Setup(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdEntity);

		// Act
		var result = await Service.CreateForecastAsync(request, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Date.Should().Be(new DateOnly(2025, 11, 10));
		result.TemperatureC.Should().Be(20);
		result.Summary.Should().Be("Warm");
		result.TemperatureF.Should().Be(67);
		MockValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()), Times.Once);
		MockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task CreateForecastAsync_WithInvalidRequest_ThrowsValidationExceptionAsync()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = -100,
			Summary = "Too Cold"
		};

		var validationFailures = new List<ValidationFailure>
		{
			new("TemperatureC", "Temperature must be between -60 and 60")
		};
		var validationResult = new ValidationResult(validationFailures);
		MockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		// ValidateAndThrowAsync will throw if validation fails, so we need to simulate that
		var validationException = new ValidationException(validationResult.Errors);
		MockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(validationException);

		// Act & Assert
		await Assert.ThrowsAsync<ValidationException>(
			() => Service.CreateForecastAsync(request, CancellationToken.None));

		MockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()), Times.Never);
	}

	[Fact]
	public async Task GetAllForecastsAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		MockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecast>());

		// Act
		await Service.GetAllForecastsAsync(cts.Token);

		// Assert
		MockRepository.Verify(r => r.GetAllAsync(cts.Token), Times.Once);
	}

	[Fact]
	public async Task GetForecastByIdAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		MockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecast?)null);

		// Act
		await Service.GetForecastByIdAsync(1, cts.Token);

		// Assert
		MockRepository.Verify(r => r.GetByIdAsync(1, cts.Token), Times.Once);
	}

	[Fact]
	public async Task CreateForecastAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var createdEntity = new WeatherForecast
		{
			Date = request.Date,
			TemperatureC = request.TemperatureC,
			Summary = request.Summary
		};

		MockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());
		MockRepository.Setup(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdEntity);

		// Act
		await Service.CreateForecastAsync(request, cts.Token);

		// Assert
		MockValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), cts.Token), Times.Once);
		MockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), cts.Token), Times.Once);
	}
}