// <copyright file="WeatherForecastRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Domain.Entities;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Infrastructure.Repositories;

/// <summary>
/// In-memory implementation of weather forecast repository.
/// </summary>
public class WeatherForecastRepository : IWeatherForecastRepository
{
	private readonly List<WeatherForecast> _forecasts = [];
	private int _nextId = 1;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastRepository"/> class.
	/// Seeds with sample data.
	/// </summary>
	public WeatherForecastRepository()
	{
		SeedData();
	}

	/// <inheritdoc/>
	public Task<IEnumerable<WeatherForecast>> GetAllAsync(CancellationToken cancellationToken = default)
	{
		return Task.FromResult<IEnumerable<WeatherForecast>>(_forecasts.ToList());
	}

	/// <inheritdoc/>
	public Task<WeatherForecast?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		var forecast = _forecasts.FirstOrDefault(f => f.Date == DateOnly.FromDayNumber(id));
		return Task.FromResult(forecast);
	}

	/// <inheritdoc/>
	public Task<WeatherForecast> CreateAsync(WeatherForecast entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		_forecasts.Add(entity);
		_nextId++;
		return Task.FromResult(entity);
	}

	/// <inheritdoc/>
	public Task<WeatherForecast> UpdateAsync(WeatherForecast entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		var existing = _forecasts.FirstOrDefault(f => f.Date == entity.Date);
		if (existing is not null)
		{
			_forecasts.Remove(existing);
			_forecasts.Add(entity);
		}

		return Task.FromResult(entity);
	}

	/// <inheritdoc/>
	public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
	{
		var forecast = _forecasts.FirstOrDefault(f => f.Date == DateOnly.FromDayNumber(id));
		if (forecast is null)
		{
			return Task.FromResult(false);
		}

		_forecasts.Remove(forecast);
		return Task.FromResult(true);
	}

	private void SeedData()
	{
		var summaries = new[]
		{
			"Freezing", "Bracing", "Chilly", "Cool", "Mild",
			"Warm", "Balmy", "Hot", "Sweltering", "Scorching",
		};

		var startDate = DateOnly.FromDateTime(DateTime.Now);
		for (int i = 0; i < 5; i++)
		{
			_forecasts.Add(new WeatherForecast
			{
				Date = startDate.AddDays(i),
				TemperatureC = Random.Shared.Next(-20, 55),
				Summary = summaries[Random.Shared.Next(summaries.Length)],
			});
		}
	}
}
