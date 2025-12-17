// <copyright file="CreateClientLogBatchCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using System.Text.Json;

namespace SeventySix.Logging;

/// <summary>
/// Handler for creating multiple client-side log entries in a batch.
/// </summary>
public static class CreateClientLogBatchCommandHandler
{
	/// <summary>
	/// Handles the request to create multiple client log entries.
	/// </summary>
	/// <param name="requests">The array of client log creation requests.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
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

		foreach (CreateLogRequest request in requests)
		{
			Log log =
				new()
				{
					LogLevel = request.LogLevel,
					Message = request.Message,
					ExceptionMessage = request.ExceptionMessage,
					StackTrace = request.StackTrace,
					SourceContext = request.SourceContext,
					RequestPath = request.RequestUrl,
					RequestMethod = request.RequestMethod,
					StatusCode = request.StatusCode,
					CorrelationId =
						request.CorrelationId ?? traceId,
					SpanId = spanId,
					ParentSpanId = parentSpanId,
					Properties =
						JsonSerializer.Serialize(
							new
							{
								request.UserAgent,
								request.ClientTimestamp,
								request.AdditionalContext,
							}),
					MachineName = "Browser",
					Environment = "Client",
				};

			await repository.CreateAsync(log, cancellationToken);
		}
	}
}