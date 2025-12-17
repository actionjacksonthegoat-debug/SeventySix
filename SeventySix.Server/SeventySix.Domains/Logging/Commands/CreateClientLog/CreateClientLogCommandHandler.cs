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
	/// Handles the request to create a client log entry.
	/// </summary>
	/// <param name="request">The client log creation request.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	public static async Task HandleAsync(
		CreateLogRequest request,
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