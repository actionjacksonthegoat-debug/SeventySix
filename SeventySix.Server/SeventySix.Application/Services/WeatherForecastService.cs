// <copyright file="WeatherForecastService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Extensions;
using SeventySix.Application.Interfaces;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Application.Services;

/// <summary>
/// Weather forecast service implementation.
/// Encapsulates business logic for weather forecast operations.
/// </summary>
public class WeatherForecastService : IWeatherForecastService
{
	private readonly IWeatherForecastRepository _repository;
	private readonly IValidator<CreateWeatherForecastRequest> _createValidator;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastService"/> class.
	/// </summary>
	/// <param name="repository">Weather forecast repository.</param>
	/// <param name="createValidator">Validator for create requests.</param>
	public WeatherForecastService(
		IWeatherForecastRepository repository,
		IValidator<CreateWeatherForecastRequest> createValidator)
	{
		_repository = repository ?? throw new ArgumentNullException(nameof(repository));
		_createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<WeatherForecastDto>> GetAllForecastsAsync(CancellationToken cancellationToken = default)
	{
		var forecasts = await _repository.GetAllAsync(cancellationToken);
		return forecasts.ToDto();
	}

	/// <inheritdoc/>
	public async Task<WeatherForecastDto?> GetForecastByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		var forecast = await _repository.GetByIdAsync(id, cancellationToken);
		return forecast?.ToDto();
	}

	/// <inheritdoc/>
	public async Task<WeatherForecastDto> CreateForecastAsync(
		CreateWeatherForecastRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request using FluentValidation
		await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Map request to entity using extension method
		var forecast = request.ToEntity();

		// Save via repository
		var created = await _repository.CreateAsync(forecast, cancellationToken);

		// Map entity to DTO using extension method
		return created.ToDto();
	}
}
