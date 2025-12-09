// <copyright file="LoggingHealthCheck.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;
using Wolverine;

namespace SeventySix.Logging;

/// <summary>
/// Health check implementation for the Logging database using Wolverine.
/// </summary>
internal class LoggingHealthCheck(IMessageBus messageBus) : IDatabaseHealthCheck
{
	/// <inheritdoc/>
	public string ContextName => "Logging";

	/// <inheritdoc/>
	public async Task<bool> CheckHealthAsync(CancellationToken cancellationToken = default)
	{
		return await messageBus.InvokeAsync<bool>(
			new CheckLoggingHealthQuery(),
			cancellationToken);
	}
}
