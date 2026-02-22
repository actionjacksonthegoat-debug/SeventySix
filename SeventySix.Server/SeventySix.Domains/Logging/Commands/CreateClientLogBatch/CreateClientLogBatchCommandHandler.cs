// <copyright file="CreateClientLogBatchCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using SeventySix.Logging.Commands.CreateClientLogBatch;

namespace SeventySix.Logging;

/// <summary>
/// Handler for creating multiple client-side log entries in a batch.
/// </summary>
public static class CreateClientLogBatchCommandHandler
{
	/// <summary>
	/// Handles the command to create multiple client log entries.
	/// </summary>
	/// <param name="command">
	/// The batch command containing the array of client log creation requests.
	/// </param>
	/// <param name="repository">
	/// The log repository for data access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public static async Task HandleAsync(
		CreateClientLogBatchCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		if (command.Requests.Length == 0)
		{
			return;
		}

		string? traceId =
			Activity.Current?.TraceId.ToString();
		string? spanId =
			Activity.Current?.SpanId.ToString();
		string? parentSpanId =
			Activity.Current?.ParentSpanId.ToString();

		List<Log> logs =
			command.Requests
				.Select(
					request =>
						request.ToClientLogEntity(
							traceId,
							spanId,
							parentSpanId))
				.ToList();

		await repository.CreateBatchAsync(logs, cancellationToken);
	}
}