// <copyright file="TimeoutConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for timeout values.
/// Centralized timeout configuration for consistency (DRY).
/// </summary>
public static class TimeoutConstants
{
	/// <summary>
	/// Health check timeout constants.
	/// </summary>
	public static class HealthCheck
	{
		/// <summary>
		/// Default health check timeout in seconds.
		/// </summary>
		public const int DefaultSeconds = 5;

		/// <summary>
		/// Jaeger health check timeout in seconds.
		/// </summary>
		public const int JaegerSeconds = 3;
	}

	/// <summary>
	/// OAuth-related timeout constants.
	/// </summary>
	public static class OAuth
	{
		/// <summary>
		/// OAuth code exchange TTL in seconds.
		/// </summary>
		public const int CodeExchangeTtlSeconds = 60;

		/// <summary>
		/// OAuth state cookie expiry in minutes.
		/// </summary>
		public const int StateCookieMinutes = 10;
	}

	/// <summary>
	/// Batch processing constants.
	/// </summary>
	public static class Batch
	{
		/// <summary>
		/// Default batch size for bulk operations.
		/// </summary>
		public const int DefaultSize = 50;

		/// <summary>
		/// Default batch interval in milliseconds.
		/// </summary>
		public const int IntervalMs = 5000;
	}

	/// <summary>
	/// HTTP client timeout constants.
	/// </summary>
	public static class HttpClient
	{
		/// <summary>
		/// Default HTTP client timeout in seconds.
		/// </summary>
		public const int DefaultSeconds = 30;

		/// <summary>
		/// Short timeout for quick operations in seconds.
		/// </summary>
		public const int ShortSeconds = 10;
	}
}