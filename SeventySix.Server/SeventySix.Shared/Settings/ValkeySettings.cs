// <copyright file="ValkeySettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Configuration settings for Valkey (Redis-compatible) cache connection.
/// </summary>
/// <remarks>
/// Valkey is an open-source Redis fork under BSD 3-Clause license, backed by Linux Foundation.
/// Connection string format: "host:port" or "host:port,password=xxx,ssl=true".
/// All numeric values MUST be configured in appsettings.json.
/// </remarks>
public sealed record ValkeySettings
{
	/// <summary>
	/// Whether Valkey distributed caching is enabled.
	/// </summary>
	/// <remarks>
	/// Set to false when running without Docker/Valkey infrastructure.
	/// When disabled, caches fall back to in-memory only mode.
	/// </remarks>
	public bool Enabled { get; init; }

	/// <summary>
	/// Valkey connection string.
	/// </summary>
	/// <remarks>
	/// Format: "host:port" for development, "host:port,password=xxx,ssl=true" for production.
	/// Must be set when Enabled=true; validator will catch missing values.
	/// </remarks>
	public string ConnectionString { get; init; } =
		string.Empty;

	/// <summary>
	/// Instance name prefix for cache keys.
	/// </summary>
	/// <remarks>
	/// Used to namespace cache keys and prevent collisions in shared Valkey instances.
	/// Must be configured in appsettings.json when Enabled=true.
	/// </remarks>
	public string InstanceName { get; init; } =
		string.Empty;

	/// <summary>
	/// Connection timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait when establishing a new connection to Valkey.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int ConnectTimeoutMs { get; init; }

	/// <summary>
	/// Synchronous operation timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait for synchronous cache operations to complete.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int SyncTimeoutMs { get; init; }

	/// <summary>
	/// Number of connection retry attempts.
	/// </summary>
	/// <remarks>
	/// How many times to retry connection before giving up.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int ConnectRetry { get; init; }

	/// <summary>
	/// Keep-alive interval in seconds.
	/// </summary>
	/// <remarks>
	/// Sends periodic PING commands to maintain connection and detect failures early.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int KeepAliveSeconds { get; init; }

	/// <summary>
	/// Base delay for exponential retry policy in milliseconds.
	/// </summary>
	/// <remarks>
	/// Used with ExponentialRetry policy for connection failures.
	/// Actual delay increases exponentially: baseMs * 2^attempt.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int RetryBaseMs { get; init; }

	/// <summary>
	/// Async operation timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait for asynchronous cache operations to complete.
	/// Should be higher than SyncTimeoutMs.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int AsyncTimeoutMs { get; init; }

	/// <summary>
	/// Enable SSL/TLS for Valkey connections.
	/// </summary>
	/// <remarks>
	/// Required for production environments with encrypted connections.
	/// </remarks>
	public bool UseSsl { get; init; }

	/// <summary>
	/// Connection pool size per endpoint.
	/// </summary>
	/// <remarks>
	/// Number of concurrent connections to maintain.
	/// Must be configured in appsettings.json.
	/// </remarks>
	public int ConnectionPoolSize { get; init; }
}