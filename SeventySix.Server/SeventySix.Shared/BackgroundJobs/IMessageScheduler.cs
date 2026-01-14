// <copyright file="IMessageScheduler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Framework-agnostic contract for scheduling delayed messages.
/// Implemented by Wolverine adapter in Domains layer.
/// </summary>
public interface IMessageScheduler
{
	/// <summary>
	/// Schedules a message for future delivery.
	/// </summary>
	/// <typeparam name="TMessage">
	/// The type of message to schedule.
	/// </typeparam>
	/// <param name="message">
	/// The message instance to schedule.
	/// </param>
	/// <param name="scheduledTime">
	/// When the message should be delivered.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task ScheduleAsync<TMessage>(
		TMessage message,
		DateTimeOffset scheduledTime,
		CancellationToken cancellationToken = default)
		where TMessage : class;
}
