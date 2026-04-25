// <copyright file="DatabaseLogSink.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using Serilog.Core;
using Serilog.Events;
using SeventySix.Logging;

namespace SeventySix.Api.Logging;

/// <summary>
/// Custom Serilog sink that writes log events to the database via
/// <see cref="ILogRepository"/> using batched asynchronous writes.
/// </summary>
/// <remarks>
/// Responsibilities:
/// - Enqueue events for background batching (every 5 seconds or 50 events).
/// - Capture Activity context at enqueue time (AsyncLocal cannot be read later).
/// - Delegate property / exception / trace extraction to
///   <see cref="LogEventEnricher"/> so enrichment remains pure and testable.
///
/// Performance:
/// - Single background task with dedicated scope per batch.
/// - Only logs Warning level and above.
/// - Prevents connection pool exhaustion during high load.
/// </remarks>
/// <param name="serviceProvider">
/// Service provider for creating scopes and resolving dependencies.
/// </param>
/// <param name="environment">
/// Optional environment name (e.g., "Production").
/// </param>
/// <param name="machineName">
/// Optional machine or container name.
/// </param>
public sealed class DatabaseLogSink(
	IServiceProvider serviceProvider,
	string? environment = null,
	string? machineName = null) : ILogEventSink, IAsyncDisposable
{
	private const int BatchSize = 50;
	private const int BatchIntervalMs = 5000;

	private readonly ConcurrentQueue<LogEvent> LogQueue = new();
	private readonly SemaphoreSlim ProcessingSemaphore =
		new(1, 1);
	private volatile Timer? BatchTimer;
	private bool Disposed;

	/// <summary>
	/// Ensures the batch timer is initialized on first emit.
	/// </summary>
	private void EnsureTimerInitialized()
	{
		if (BatchTimer == null)
		{
			lock (ProcessingSemaphore)
			{
				BatchTimer ??=
					new Timer(
						callback: _ => _ = ProcessBatchAsync(),
						state: null,
						dueTime: TimeSpan.FromMilliseconds(BatchIntervalMs),
						period: TimeSpan.FromMilliseconds(BatchIntervalMs));
			}
		}
	}

	/// <inheritdoc/>
	public void Emit(LogEvent logEvent)
	{
		ArgumentNullException.ThrowIfNull(logEvent);

		if (Disposed)
		{
			return;
		}

		EnsureTimerInitialized();

		if (logEvent.Level < LogEventLevel.Warning)
		{
			return;
		}

		LogEvent enqueued =
			CaptureActivityContext(logEvent);

		LogQueue.Enqueue(enqueued);

		if (LogQueue.Count >= BatchSize)
		{
			_ = ProcessBatchAsync();
		}
	}

	/// <summary>
	/// Captures the current <see cref="System.Diagnostics.Activity"/> context
	/// and attaches it to the log event. Activity.Current is AsyncLocal so it
	/// must be captured on the producing thread, not the background processor.
	/// </summary>
	/// <param name="logEvent">
	/// The original log event.
	/// </param>
	/// <returns>
	/// A new <see cref="LogEvent"/> enriched with activity properties when
	/// available, otherwise the input unchanged.
	/// </returns>
	private static LogEvent CaptureActivityContext(LogEvent logEvent)
	{
		System.Diagnostics.Activity? activity =
			System.Diagnostics.Activity.Current;

		if (activity == null
			|| logEvent.Properties.ContainsKey("__ActivityTraceId"))
		{
			return logEvent;
		}

		Dictionary<string, LogEventPropertyValue> enrichedProperties =
			new(logEvent.Properties)
			{
				["__ActivityTraceId"] =
					new ScalarValue(activity.TraceId.ToString()),
				["__ActivitySpanId"] =
					new ScalarValue(activity.SpanId.ToString()),
				["__ActivityParentSpanId"] =
					new ScalarValue(activity.ParentSpanId.ToString()),
			};

		return new LogEvent(
			logEvent.Timestamp,
			logEvent.Level,
			logEvent.Exception,
			logEvent.MessageTemplate,
			enrichedProperties.Select(kvp => new LogEventProperty(
				kvp.Key,
				kvp.Value)));
	}

	/// <summary>
	/// Drains up to <see cref="BatchSize"/> events and persists them through
	/// a single <see cref="ILogRepository"/> scope.
	/// </summary>
	/// <param name="isDisposing">
	/// When true, waits for the semaphore for up to ten seconds to allow a
	/// final flush during disposal.
	/// </param>
	/// <returns>
	/// A task that completes after the batch is persisted.
	/// </returns>
	private async Task ProcessBatchAsync(bool isDisposing = false)
	{
		bool acquired =
			isDisposing
				? await ProcessingSemaphore.WaitAsync(TimeSpan.FromSeconds(10))
				: await ProcessingSemaphore.WaitAsync(0);

		if (!acquired || (Disposed && !isDisposing))
		{
			return;
		}

		try
		{
			List<LogEvent> batch =
				new(BatchSize);

			while (batch.Count < BatchSize
				&& LogQueue.TryDequeue(out LogEvent? logEvent))
			{
				batch.Add(logEvent);
			}

			if (batch.Count == 0)
			{
				return;
			}

			using IServiceScope scope = serviceProvider.CreateScope();
			ILogRepository logRepository =
				scope
					.ServiceProvider
					.GetRequiredService<ILogRepository>();

			IEnumerable<Log> logs =
				batch.Select(logEvent =>
					LogEventEnricher.BuildLog(
						logEvent,
						environment,
						machineName));

			foreach (Log log in logs)
			{
				await logRepository.CreateAsync(log);
			}
		}
		finally
		{
			ProcessingSemaphore.Release();
		}
	}

	/// <summary>
	/// Disposes resources and flushes remaining logs asynchronously.
	/// </summary>
	/// <returns>
	/// A value task that completes after the final flush.
	/// </returns>
	public async ValueTask DisposeAsync()
	{
		if (Disposed)
		{
			return;
		}

		Disposed = true;

		if (BatchTimer != null)
		{
			await BatchTimer.DisposeAsync();
		}

		await ProcessBatchAsync(isDisposing: true);

		ProcessingSemaphore?.Dispose();

		GC.SuppressFinalize(this);
	}
}
// <copyright file="DatabaseLogSink.cs" company="SeventySix">