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
	private readonly Mock<IWeatherForecastRepository> _mockRepository;
	private readonly Mock<IValidator<CreateWeatherForecastRequest>> _mockValidator;
	private readonly WeatherForecastService _service;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastServiceTests"/> class.
	/// </summary>
	public WeatherForecastServiceTests()
	{
		_mockRepository = new Mock<IWeatherForecastRepository>();
		_mockValidator = new Mock<IValidator<CreateWeatherForecastRequest>>();
		_service = new WeatherForecastService(_mockRepository.Object, _mockValidator.Object);
	}

	[Fact]
	public void Constructor_WithNullRepository_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastService(null!, _mockValidator.Object));
		exception.ParamName.Should().Be("repository");
	}

	[Fact]
	public void Constructor_WithNullValidator_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastService(_mockRepository.Object, null!));
		exception.ParamName.Should().Be("createValidator");
	}

	[Fact]
	public async Task GetAllForecastsAsync_ReturnsEmptyList_WhenNoForecasts()
	{
		// Arrange
		_mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecast>());

		// Act
		var result = await _service.GetAllForecastsAsync(CancellationToken.None);

		// Assert
		result.Should().BeEmpty();
		_mockRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllForecastsAsync_ReturnsMappedDtos_WhenForecastsExist()
	{
		// Arrange
		var entities = new List<WeatherForecast>
		{
			new() { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" },
			new() { Date = new DateOnly(2025, 11, 11), TemperatureC = 22, Summary = "Hot" }
		};
		_mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(entities);

		// Act
		var result = await _service.GetAllForecastsAsync(CancellationToken.None);

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
	public async Task GetForecastByIdAsync_ReturnsNull_WhenNotFound()
	{
		// Arrange
		_mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecast?)null);

		// Act
		var result = await _service.GetForecastByIdAsync(999, CancellationToken.None);

		// Assert
		result.Should().BeNull();
		_mockRepository.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetForecastByIdAsync_ReturnsMappedDto_WhenFound()
	{
		// Arrange
		var entity = new WeatherForecast { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" };
		_mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(entity);

		// Act
		var result = await _service.GetForecastByIdAsync(1, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result!.Date.Should().Be(new DateOnly(2025, 11, 10));
		result.TemperatureC.Should().Be(20);
		result.Summary.Should().Be("Warm");
		result.TemperatureF.Should().Be(67); // Calculated from entity
	}

	[Fact]
	public async Task CreateForecastAsync_WithValidRequest_ReturnsCreatedDto()
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

		_mockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());
		_mockRepository.Setup(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdEntity);

		// Act
		var result = await _service.CreateForecastAsync(request, CancellationToken.None);

		// Assert
		result.Should().NotBeNull();
		result.Date.Should().Be(new DateOnly(2025, 11, 10));
		result.TemperatureC.Should().Be(20);
		result.Summary.Should().Be("Warm");
		result.TemperatureF.Should().Be(67);
		_mockValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()), Times.Once);
		_mockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task CreateForecastAsync_WithInvalidRequest_ThrowsValidationException()
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
		_mockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(validationResult);

		// ValidateAndThrowAsync will throw if validation fails, so we need to simulate that
		var validationException = new ValidationException(validationResult.Errors);
		_mockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(validationException);

		// Act & Assert
		await Assert.ThrowsAsync<ValidationException>(
			() => _service.CreateForecastAsync(request, CancellationToken.None));

		_mockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()), Times.Never);
	}

	[Fact]
	public async Task GetAllForecastsAsync_RespectsCancellationToken()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		_mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecast>());

		// Act
		await _service.GetAllForecastsAsync(cts.Token);

		// Assert
		_mockRepository.Verify(r => r.GetAllAsync(cts.Token), Times.Once);
	}

	[Fact]
	public async Task GetForecastByIdAsync_RespectsCancellationToken()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		_mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecast?)null);

		// Act
		await _service.GetForecastByIdAsync(1, cts.Token);

		// Assert
		_mockRepository.Verify(r => r.GetByIdAsync(1, cts.Token), Times.Once);
	}

	[Fact]
	public async Task CreateForecastAsync_RespectsCancellationToken()
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

		_mockValidator.Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());
		_mockRepository.Setup(r => r.CreateAsync(It.IsAny<WeatherForecast>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(createdEntity);

		// Act
		await _service.CreateForecastAsync(request, cts.Token);

		// Assert
		_mockValidator.Verify(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateWeatherForecastRequest>>(), cts.Token), Times.Once);
		_mockRepository.Verify(r => r.CreateAsync(It.IsAny<WeatherForecast>(), cts.Token), Times.Once);
	}
}
