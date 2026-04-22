// <copyright file="LogEventEnricherTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Serilog.Events;
using Serilog.Parsing;
using SeventySix.Api.Logging;
using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Api.Tests.Logging;

/// <summary>
/// Unit tests for the pure-function <see cref="LogEventEnricher"/>.
/// </summary>
public sealed class LogEventEnricherTests
{
	private static LogEvent CreateEvent(
		LogEventLevel level = LogEventLevel.Warning,
		Exception? exception = null,
		IEnumerable<LogEventProperty>? properties = null)
	{
		return new LogEvent(
			DateTimeOffset.Parse(
				"2026-04-16T12:00:00Z",
				System.Globalization.CultureInfo.InvariantCulture),
			level,
			exception,
			new MessageTemplateParser().Parse(
				"test message"),
			properties ?? []);
	}

	[Fact]
	public void BuildLog_SetsBasicFields()
	{
		LogEvent logEvent =
			CreateEvent();

		Log log =
			LogEventEnricher.BuildLog(
				logEvent,
				"Test",
				"machine-1");

		log.LogLevel.ShouldBe("Warning");
		log.Message.ShouldBe("test message");
		log.Environment.ShouldBe("Test");
		log.MachineName.ShouldBe("machine-1");
	}

	[Fact]
	public void BuildLog_ExtractsActivityTraceProperties()
	{
		LogEvent logEvent =
			CreateEvent(
				properties:
				[
					new LogEventProperty(
						"__ActivityTraceId",
						new ScalarValue("trace-123")),
					new LogEventProperty(
						"__ActivitySpanId",
						new ScalarValue("span-456")),
					new LogEventProperty(
						"__ActivityParentSpanId",
						new ScalarValue("parent-789")),
				]);

		Log log =
			LogEventEnricher.BuildLog(
				logEvent,
				null,
				null);

		log.CorrelationId.ShouldBe("trace-123");
		log.SpanId.ShouldBe("span-456");
		log.ParentSpanId.ShouldBe("parent-789");
	}

	[Fact]
	public void BuildLog_ExtractsHttpContextProperties()
	{
		LogEvent logEvent =
			CreateEvent(
				properties:
				[
					new LogEventProperty(
						"RequestMethod",
						new ScalarValue("POST")),
					new LogEventProperty(
						"RequestPath",
						new ScalarValue("/v1/test")),
					new LogEventProperty(
						"StatusCode",
						new ScalarValue(500)),
					new LogEventProperty(
						"Elapsed",
						new ScalarValue(123.4m)),
					new LogEventProperty(
						"SourceContext",
						new ScalarValue("SeventySix.Api.Foo")),
				]);

		Log log =
			LogEventEnricher.BuildLog(
				logEvent,
				null,
				null);

		log.RequestMethod.ShouldBe("POST");
		log.RequestPath.ShouldBe("/v1/test");
		log.StatusCode.ShouldBe(500);
		log.DurationMs.ShouldBe(123);
		log.SourceContext.ShouldBe("SeventySix.Api.Foo");
	}

	[Fact]
	public void BuildLog_ExtractsExceptionInfo_FiltersStackToSeventySixFrames()
	{
		InvalidOperationException exception;

		try
		{
			throw new InvalidOperationException("outer");
		}
		catch (InvalidOperationException ex)
		{
			exception = ex;
		}

		LogEvent logEvent =
			CreateEvent(
				LogEventLevel.Error,
				exception);

		Log log =
			LogEventEnricher.BuildLog(
				logEvent,
				null,
				null);

		log.ExceptionMessage.ShouldBe("outer");
		log.StackTrace.ShouldNotBeNull();
	}

	[Fact]
	public void BuildLog_WritesNonStandardPropertiesAsJsonBlob()
	{
		LogEvent logEvent =
			CreateEvent(
				properties:
				[
					new LogEventProperty(
						"UserId",
						new ScalarValue(42)),
					new LogEventProperty(
						"RequestMethod",
						new ScalarValue("GET")),
				]);

		Log log =
			LogEventEnricher.BuildLog(
				logEvent,
				null,
				null);

		log.Properties.ShouldNotBeNull();
		log.Properties.ShouldContain("UserId");
		log.Properties.ShouldNotContain("RequestMethod");
	}

	[Fact]
	public void BuildLog_NullLogEvent_Throws()
	{
		Should.Throw<ArgumentNullException>(() =>
			LogEventEnricher.BuildLog(
				null!,
				null,
				null));
	}
}