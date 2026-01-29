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
/// </remarks>
public record ValkeySettings
{
	/// <summary>
	/// Whether Valkey distributed caching is enabled.
	/// </summary>
	/// <remarks>
	/// Set to false when running without Docker/Valkey infrastructure.
	/// When disabled, caches fall back to in-memory only mode.
	/// </remarks>
	public bool Enabled { get; init; } =
		true;

	/// <summary>
	/// Valkey connection string.
	/// </summary>
	/// <remarks>
	/// Format: "host:port" for development, "host:port,password=xxx,ssl=true" for production.
	/// </remarks>
	public string ConnectionString { get; init; } =
		"localhost:6379";

	/// <summary>
	/// Instance name prefix for cache keys.
	/// </summary>
	/// <remarks>
	/// Used to namespace cache keys and prevent collisions in shared Valkey instances.
	/// </remarks>
	public string InstanceName { get; init; } =
		"seventysix:";

	/// <summary>
	/// Connection timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait when establishing a new connection to Valkey.
	/// Default: 5000ms (5 seconds). Use shorter values in test environments.
	/// </remarks>
	public int ConnectTimeoutMs { get; init; } =
		5000;

	/// <summary>
	/// Synchronous operation timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait for synchronous cache operations to complete.
	/// Default: 1000ms (1 second). Use shorter values in test environments.
	/// </remarks>
	public int SyncTimeoutMs { get; init; } =
		1000;

	/// <summary>
	/// Number of connection retry attempts.
	/// </summary>
	/// <remarks>
	/// How many times to retry connection before giving up.
	/// Default: 3 for development, consider 5 for production.
	/// </remarks>
	public int ConnectRetry { get; init; } =
		3;

	/// <summary>
	/// Keep-alive interval in seconds.
	/// </summary>
	/// <remarks>
	/// Sends periodic PING commands to maintain connection and detect failures early.
	/// Default: 60 seconds.
	/// </remarks>
	public int KeepAliveSeconds { get; init; } =
		60;

	/// <summary>
	/// Base delay for exponential retry policy in milliseconds.
	/// </summary>
	/// <remarks>
	/// Used with ExponentialRetry policy for connection failures.
	/// Actual delay increases exponentially: baseMs * 2^attempt.
	/// Default: 5000ms (5 seconds).
	/// </remarks>
	public int RetryBaseMs { get; init; } =
		5000;

	/// <summary>
	/// Async operation timeout in milliseconds.
	/// </summary>
	/// <remarks>
	/// Time to wait for asynchronous cache operations to complete.
	/// Should be higher than SyncTimeoutMs.
	/// Default: 5000ms (5 seconds).
	/// </remarks>
	public int AsyncTimeoutMs { get; init; } =
		5000;

	/// <summary>
	/// Enable SSL/TLS for Valkey connections.
	/// </summary>
	/// <remarks>
	/// Required for production environments with encrypted connections.
	/// Default: false for development.
	/// </remarks>
	public bool UseSsl { get; init; } =
		false;

	/// <summary>
	/// Connection pool size per endpoint.
	/// </summary>
	/// <remarks>
	/// Number of concurrent connections to maintain.
	/// Default: 1 for development. Increase to 2-4 for high-traffic production.
	/// </remarks>
	public int ConnectionPoolSize { get; init; } =
		1;
}