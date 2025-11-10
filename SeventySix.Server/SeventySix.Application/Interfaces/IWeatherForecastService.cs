// <copyright file="IWeatherForecastService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Interfaces;

/// <summary>
/// Weather forecast service interface.
/// Defines the contract for business logic operations related to weather forecasts.
/// </summary>
/// <remarks>
/// This interface follows the Interface Segregation Principle (ISP) by defining
/// only the operations needed for weather forecast management.
///
/// It serves as an abstraction layer (Dependency Inversion Principle) between
/// the API layer and the business logic implementation, allowing for:
/// - Easy testing through mocking
/// - Multiple implementations (e.g., caching decorator)
/// - Loose coupling between layers
///
/// All methods are async to support scalable I/O operations.
/// </remarks>
public interface IWeatherForecastService
{
	/// <summary>
	/// Retrieves all weather forecasts from the system.
	/// </summary>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains a collection of weather forecast DTOs.
	/// </returns>
	/// <remarks>
	/// This method returns all forecasts without pagination.
	/// Consider adding pagination for production systems with large datasets.
	/// </remarks>
	public Task<IEnumerable<WeatherForecastDto>> GetAllForecastsAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Retrieves a specific weather forecast by its unique identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the forecast to retrieve.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the weather forecast DTO if found; otherwise, null.
	/// </returns>
	/// <remarks>
	/// Returns null if the forecast doesn't exist rather than throwing an exception.
	/// The caller should handle the null case appropriately (e.g., return 404).
	/// </remarks>
	public Task<WeatherForecastDto?> GetForecastByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new weather forecast in the system.
	/// </summary>
	/// <param name="request">The request containing forecast data to create.</param>
	/// <param name="cancellationToken">Token to cancel the operation if needed.</param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// The task result contains the created weather forecast DTO.
	/// </returns>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails FluentValidation rules.
	/// </exception>
	/// <exception cref="BusinessRuleViolationException">
	/// Thrown when the request violates business rules (e.g., duplicate forecast for the same date).
	/// </exception>
	/// <remarks>
	/// The request is automatically validated using FluentValidation before processing.
	/// Validation rules include:
	/// - Date must be today or in the future
	/// - Temperature must be between -100°C and 100°C
	/// - Summary must not exceed 200 characters
	/// </remarks>
	public Task<WeatherForecastDto> CreateForecastAsync(CreateWeatherForecastRequest request, CancellationToken cancellationToken = default);
}