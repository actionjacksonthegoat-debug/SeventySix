// <copyright file="ApiTrackingHealthCheck.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;
using Wolverine;

namespace SeventySix.ApiTracking;

/// <summary>
/// Health check implementation for ApiTracking context using Wolverine CQRS pattern.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ApiTrackingHealthCheck"/> class.
/// </remarks>
/// <param name="messageBus">The Wolverine message bus for executing health check query.</param>
public class ApiTrackingHealthCheck(IMessageBus messageBus) : IDatabaseHealthCheck
{
	/// <inheritdoc/>
	public string ContextName => "ApiTracking";

	/// <inheritdoc/>
	public async Task<bool> CheckHealthAsync(
		CancellationToken cancellationToken = default)
	{
		return await messageBus.InvokeAsync<bool>(
			new CheckApiTrackingHealthQuery(),
			cancellationToken);
	}
}