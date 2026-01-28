// <copyright file="CreateClientLogBatchCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;

namespace SeventySix.Logging;

/// <summary>
/// Handler for creating multiple client-side log entries in a batch.
/// </summary>
public static class CreateClientLogBatchCommandHandler
{
	/// <summary>
	/// Handles the request to create multiple client log entries.
	/// </summary>
	/// <param name="requests">
	/// The array of client log creation requests.
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
		CreateLogRequest[] requests,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		if (requests.Length == 0)
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
			requests
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