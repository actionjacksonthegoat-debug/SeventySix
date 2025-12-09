// <copyright file="CreateClientLogCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics;
using System.Text.Json;

namespace SeventySix.Logging;

/// <summary>
/// Handler for creating a single client-side log entry.
/// </summary>
public static class CreateClientLogCommandHandler
{
	/// <summary>
	/// Handles the command to create a client log entry.
	/// </summary>
	/// <param name="command">The command containing log creation details.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	public static async Task HandleAsync(
		CreateClientLogCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		string? traceId =
			Activity.Current?.TraceId.ToString();
		string? spanId =
			Activity.Current?.SpanId.ToString();
		string? parentSpanId =
			Activity.Current?.ParentSpanId.ToString();

		Log log =
			new()
			{
				LogLevel = command.Request.LogLevel,
				Message = command.Request.Message,
				ExceptionMessage = command.Request.ExceptionMessage,
				StackTrace = command.Request.StackTrace,
				SourceContext = command.Request.SourceContext,
				RequestPath = command.Request.RequestUrl,
				RequestMethod = command.Request.RequestMethod,
				StatusCode = command.Request.StatusCode,
				CorrelationId = command.Request.CorrelationId ?? traceId,
				SpanId = spanId,
				ParentSpanId = parentSpanId,
				Properties =
					JsonSerializer.Serialize(
						new
						{
							command.Request.UserAgent,
							command.Request.ClientTimestamp,
							command.Request.AdditionalContext,
						}),
				MachineName = "Browser",
				Environment = "Client",
			};

		await repository.CreateAsync(
			log,
			cancellationToken);
	}
}