// <copyright file="DatabaseLogSinkExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Serilog;
using Serilog.Configuration;

namespace SeventySix.Api.Logging;

/// <summary>
/// Extension methods for configuring DatabaseLogSink.
/// </summary>
public static class DatabaseLogSinkExtensions
{
	/// <summary>
	/// Adds the custom database sink to Serilog configuration.
	/// </summary>
	/// <param name="loggerConfiguration">
	/// The logger configuration.
	/// </param>
	/// <param name="serviceProvider">
	/// Service provider for dependency injection.
	/// </param>
	/// <param name="environment">
	/// Application environment.
	/// </param>
	/// <param name="machineName">
	/// Machine/container name.
	/// </param>
	/// <returns>
	/// Logger configuration for method chaining.
	/// </returns>
	public static LoggerConfiguration Database(
		this LoggerSinkConfiguration loggerConfiguration,
		IServiceProvider serviceProvider,
		string? environment = null,
		string? machineName = null)
	{
		return loggerConfiguration.Sink(
			new DatabaseLogSink(serviceProvider, environment, machineName));
	}
}