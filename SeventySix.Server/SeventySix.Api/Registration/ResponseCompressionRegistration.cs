// <copyright file="ResponseCompressionRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for response compression services.
/// </summary>
[ExcludeFromCodeCoverage]
public static class ResponseCompressionRegistration
{
	/// <summary>
	/// Adds response compression with optimized settings.
	/// </summary>
	/// <remarks>
	/// Reads configuration key: "ResponseCompression:Enabled" to
	/// optionally disable compression in Test environments.
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddOptimizedResponseCompression(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Skip response compression in Test environment for performance
		bool isResponseCompressionEnabled =
			configuration.GetValue<bool>("ResponseCompression:Enabled");
		if (!isResponseCompressionEnabled)
		{
			return services;
		}

		services.AddResponseCompression(
			options =>
			{
				options.EnableForHttps = true;
				options.Providers.Add<BrotliCompressionProvider>();
				options.Providers.Add<GzipCompressionProvider>();
			});

		services.Configure<BrotliCompressionProviderOptions>(
			options =>
			{
				options.Level = CompressionLevel.Fastest;
			});

		services.Configure<GzipCompressionProviderOptions>(
			options =>
			{
				options.Level = CompressionLevel.Fastest;
			});

		return services;
	}
}