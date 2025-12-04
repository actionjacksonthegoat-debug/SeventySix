// <copyright file="LogLevelConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Constants for Serilog log level strings used in API requests and responses.
/// These match Serilog's LogEventLevel enum string representations.
/// </summary>
public static class LogLevelConstants
{
	/// <summary>Verbose log level (most detailed, for tracing).</summary>
	public const string Verbose = "Verbose";

	/// <summary>Debug log level (internal system events).</summary>
	public const string Debug = "Debug";

	/// <summary>Information log level (normal operation events).</summary>
	public const string Information = "Information";

	/// <summary>Warning log level (abnormal but handled events).</summary>
	public const string Warning = "Warning";

	/// <summary>Error log level (functionality unavailable or unexpected).</summary>
	public const string Error = "Error";

	/// <summary>Fatal log level (application crash or critical failure).</summary>
	public const string Fatal = "Fatal";

	/// <summary>Critical log level (alias for Fatal, .NET-style naming).</summary>
	public const string Critical = "Critical";

	/// <summary>Valid log levels for query filtering (Serilog levels only).</summary>
	public static readonly string[] QueryLevels =
		[Verbose, Debug, Information, Warning, Error, Fatal];

	/// <summary>Valid log levels for creating logs (includes Critical alias).</summary>
	public static readonly string[] CreateLevels =
		[Verbose, Debug, Information, Warning, Error, Fatal, Critical];
}