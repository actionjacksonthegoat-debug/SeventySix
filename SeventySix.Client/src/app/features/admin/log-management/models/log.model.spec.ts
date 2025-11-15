import {
	LogLevel,
	parseLogLevel,
	getLogLevelDisplayName,
	getLogLevelClass,
	getLogLevelIcon
} from "./log.model";

describe("Log Model", () =>
{
	describe("parseLogLevel", () =>
	{
		it("should parse 'verbose' to LogLevel.Verbose", () =>
		{
			expect(parseLogLevel("verbose")).toBe(LogLevel.Verbose);
			expect(parseLogLevel("VERBOSE")).toBe(LogLevel.Verbose);
		});

		it("should parse 'debug' to LogLevel.Debug", () =>
		{
			expect(parseLogLevel("debug")).toBe(LogLevel.Debug);
			expect(parseLogLevel("DEBUG")).toBe(LogLevel.Debug);
		});

		it("should parse 'information' to LogLevel.Information", () =>
		{
			expect(parseLogLevel("information")).toBe(LogLevel.Information);
			expect(parseLogLevel("INFORMATION")).toBe(LogLevel.Information);
		});

		it("should parse 'info' to LogLevel.Information", () =>
		{
			expect(parseLogLevel("info")).toBe(LogLevel.Information);
			expect(parseLogLevel("INFO")).toBe(LogLevel.Information);
		});

		it("should parse 'warning' to LogLevel.Warning", () =>
		{
			expect(parseLogLevel("warning")).toBe(LogLevel.Warning);
			expect(parseLogLevel("WARNING")).toBe(LogLevel.Warning);
		});

		it("should parse 'warn' to LogLevel.Warning", () =>
		{
			expect(parseLogLevel("warn")).toBe(LogLevel.Warning);
			expect(parseLogLevel("WARN")).toBe(LogLevel.Warning);
		});

		it("should parse 'error' to LogLevel.Error", () =>
		{
			expect(parseLogLevel("error")).toBe(LogLevel.Error);
			expect(parseLogLevel("ERROR")).toBe(LogLevel.Error);
		});

		it("should parse 'fatal' to LogLevel.Fatal", () =>
		{
			expect(parseLogLevel("fatal")).toBe(LogLevel.Fatal);
			expect(parseLogLevel("FATAL")).toBe(LogLevel.Fatal);
		});

		it("should parse 'critical' to LogLevel.Fatal", () =>
		{
			expect(parseLogLevel("critical")).toBe(LogLevel.Fatal);
			expect(parseLogLevel("CRITICAL")).toBe(LogLevel.Fatal);
		});

		it("should return LogLevel.Information for unknown log level", () =>
		{
			expect(parseLogLevel("unknown")).toBe(LogLevel.Information);
			expect(parseLogLevel("invalid")).toBe(LogLevel.Information);
			expect(parseLogLevel("")).toBe(LogLevel.Information);
		});

		it("should handle null and undefined gracefully", () =>
		{
			expect(parseLogLevel(null as any)).toBe(LogLevel.Information);
			expect(parseLogLevel(undefined as any)).toBe(LogLevel.Information);
		});
	});

	describe("getLogLevelDisplayName", () =>
	{
		it("should return 'Verbose' for LogLevel.Verbose", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Verbose)).toBe("Verbose");
		});

		it("should return 'Debug' for LogLevel.Debug", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Debug)).toBe("Debug");
		});

		it("should return 'Information' for LogLevel.Information", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Information)).toBe(
				"Information"
			);
		});

		it("should return 'Warning' for LogLevel.Warning", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Warning)).toBe("Warning");
		});

		it("should return 'Error' for LogLevel.Error", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Error)).toBe("Error");
		});

		it("should return 'Fatal' for LogLevel.Fatal", () =>
		{
			expect(getLogLevelDisplayName(LogLevel.Fatal)).toBe("Fatal");
		});

		it("should return 'Unknown' for invalid log level", () =>
		{
			expect(getLogLevelDisplayName(999 as LogLevel)).toBe("Unknown");
			expect(getLogLevelDisplayName(-1 as LogLevel)).toBe("Unknown");
		});
	});

	describe("getLogLevelClass", () =>
	{
		it("should return 'log-level-debug' for LogLevel.Verbose", () =>
		{
			expect(getLogLevelClass(LogLevel.Verbose)).toBe("log-level-debug");
		});

		it("should return 'log-level-debug' for LogLevel.Debug", () =>
		{
			expect(getLogLevelClass(LogLevel.Debug)).toBe("log-level-debug");
		});

		it("should return 'log-level-info' for LogLevel.Information", () =>
		{
			expect(getLogLevelClass(LogLevel.Information)).toBe(
				"log-level-info"
			);
		});

		it("should return 'log-level-warning' for LogLevel.Warning", () =>
		{
			expect(getLogLevelClass(LogLevel.Warning)).toBe(
				"log-level-warning"
			);
		});

		it("should return 'log-level-error' for LogLevel.Error", () =>
		{
			expect(getLogLevelClass(LogLevel.Error)).toBe("log-level-error");
		});

		it("should return 'log-level-fatal' for LogLevel.Fatal", () =>
		{
			expect(getLogLevelClass(LogLevel.Fatal)).toBe("log-level-fatal");
		});

		it("should return empty string for invalid log level", () =>
		{
			expect(getLogLevelClass(999 as LogLevel)).toBe("");
			expect(getLogLevelClass(-1 as LogLevel)).toBe("");
		});
	});

	describe("getLogLevelIcon", () =>
	{
		it("should return 'bug_report' for LogLevel.Verbose", () =>
		{
			expect(getLogLevelIcon(LogLevel.Verbose)).toBe("bug_report");
		});

		it("should return 'bug_report' for LogLevel.Debug", () =>
		{
			expect(getLogLevelIcon(LogLevel.Debug)).toBe("bug_report");
		});

		it("should return 'info' for LogLevel.Information", () =>
		{
			expect(getLogLevelIcon(LogLevel.Information)).toBe("info");
		});

		it("should return 'warning' for LogLevel.Warning", () =>
		{
			expect(getLogLevelIcon(LogLevel.Warning)).toBe("warning");
		});

		it("should return 'error' for LogLevel.Error", () =>
		{
			expect(getLogLevelIcon(LogLevel.Error)).toBe("error");
		});

		it("should return 'cancel' for LogLevel.Fatal", () =>
		{
			expect(getLogLevelIcon(LogLevel.Fatal)).toBe("cancel");
		});

		it("should return 'circle' for invalid log level", () =>
		{
			expect(getLogLevelIcon(999 as LogLevel)).toBe("circle");
			expect(getLogLevelIcon(-1 as LogLevel)).toBe("circle");
		});
	});
});
