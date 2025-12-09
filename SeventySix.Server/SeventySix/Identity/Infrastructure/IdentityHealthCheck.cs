// <copyright file="IdentityHealthCheck.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Health check implementation for the Identity database using Wolverine.
/// </summary>
internal class IdentityHealthCheck(IMessageBus messageBus) : IDatabaseHealthCheck
{
	/// <inheritdoc/>
	public string ContextName => "Identity";

	/// <inheritdoc/>
	public async Task<bool> CheckHealthAsync(CancellationToken cancellationToken = default)
	{
		return await messageBus.InvokeAsync<bool>(
			new CheckIdentityHealthQuery(),
			cancellationToken);
	}
}
