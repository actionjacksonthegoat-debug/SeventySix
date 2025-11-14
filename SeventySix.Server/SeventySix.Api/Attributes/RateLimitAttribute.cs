// <copyright file="RateLimitAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Attributes;

/// <summary>
/// Attribute to configure rate limiting for a controller or action.
/// </summary>
/// <remarks>
/// Apply this attribute to controllers or actions to override the default rate limit.
/// When not applied, the global rate limit (100 req/min) applies.
///
/// <para>Examples:</para>
/// <code>
/// [RateLimit(MaxRequests = 10, WindowSeconds = 60)]
/// public class ExpensiveController : ControllerBase { }
///
/// [RateLimit(MaxRequests = 1000, WindowSeconds = 3600)]
/// public async Task&lt;IActionResult&gt; HighVolumeEndpoint() { }
/// </code>
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class RateLimitAttribute : Attribute
{
	/// <summary>
	/// Gets or sets the maximum number of requests allowed in the time window.
	/// </summary>
	/// <value>Default: 250 requests.</value>
	public int MaxRequests { get; set; } = 250;

	/// <summary>
	/// Gets or sets the time window in seconds for the rate limit.
	/// </summary>
	/// <value>Default: 3600 seconds (1 hour).</value>
	public int WindowSeconds { get; set; } = 3600;

	/// <summary>
	/// Gets or sets a value indicating whether rate limiting is enabled.
	/// Set to false to disable rate limiting for this endpoint.
	/// </summary>
	/// <value>Default: true.</value>
	public bool Enabled { get; set; } = true;

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitAttribute"/> class.
	/// </summary>
	public RateLimitAttribute()
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitAttribute"/> class with specified limits.
	/// </summary>
	/// <param name="maxRequests">Maximum number of requests allowed.</param>
	/// <param name="windowSeconds">Time window in seconds.</param>
	public RateLimitAttribute(int maxRequests, int windowSeconds)
	{
		MaxRequests = maxRequests;
		WindowSeconds = windowSeconds;
	}
}
