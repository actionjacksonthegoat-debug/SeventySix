// <copyright file="IMessageScheduler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Framework-agnostic contract for scheduling delayed messages.
/// Implemented by Wolverine adapter in Domains layer.
/// </summary>
/// <remarks>
/// This abstraction is intentionally retained: Wolverine's <c>IMessageBus.ScheduleAsync</c> is an
/// extension method (<c>Wolverine.MessageBusExtensions</c>) which NSubstitute cannot intercept.
/// An instance-level interface is required to allow argument-matching assertions on scheduled
/// messages in unit tests. Do not remove without providing an equivalent testability seam.
/// </remarks>
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