// <copyright file="WolverineMessageScheduler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.BackgroundJobs;
using Wolverine;

namespace SeventySix.Registration;

/// <summary>
/// Wolverine implementation of <see cref="IMessageScheduler"/>.
/// Wraps Wolverine's ScheduleAsync for framework-agnostic scheduling.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus.
/// </param>
public class WolverineMessageScheduler(
	IMessageBus messageBus) : IMessageScheduler
{
	/// <inheritdoc />
	public async Task ScheduleAsync<TMessage>(
		TMessage message,
		DateTimeOffset scheduledTime,
		CancellationToken cancellationToken = default)
		where TMessage : class
	{
		await messageBus.ScheduleAsync(
			message,
			scheduledTime);
	}
}
