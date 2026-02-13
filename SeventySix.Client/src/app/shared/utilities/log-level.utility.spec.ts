import { LOG_LEVEL_STRINGS, LogLevel, VALID_LOG_LEVELS } from "@shared/constants";
import {
	logLevelToString,
	parseLogLevel
} from "./log-level.utility";

describe("log-level.utility",
	() =>
	{
		describe("logLevelToString",
			() =>
			{
				it("should convert LogLevel.Information to 'Information' string",
					() =>
					{
						expect(logLevelToString(LogLevel.Information))
							.toBe("Information");
					});

				it("should convert all levels to valid server strings",
					() =>
					{
						const allLogLevels: LogLevel[] =
							[
								LogLevel.Verbose,
								LogLevel.Debug,
								LogLevel.Information,
								LogLevel.Warning,
								LogLevel.Error,
								LogLevel.Fatal,
								LogLevel.Critical
							];

						allLogLevels.forEach(
							(level) =>
							{
								const result: string =
									logLevelToString(level);
								expect(VALID_LOG_LEVELS)
									.toContain(result);
							});
					});

				it("should map each LogLevel to its corresponding string constant",
					() =>
					{
						expect(logLevelToString(LogLevel.Verbose))
							.toBe(LOG_LEVEL_STRINGS.Verbose);
						expect(logLevelToString(LogLevel.Debug))
							.toBe(LOG_LEVEL_STRINGS.Debug);
						expect(logLevelToString(LogLevel.Information))
							.toBe(LOG_LEVEL_STRINGS.Information);
						expect(logLevelToString(LogLevel.Warning))
							.toBe(LOG_LEVEL_STRINGS.Warning);
						expect(logLevelToString(LogLevel.Error))
							.toBe(LOG_LEVEL_STRINGS.Error);
						expect(logLevelToString(LogLevel.Fatal))
							.toBe(LOG_LEVEL_STRINGS.Fatal);
						expect(logLevelToString(LogLevel.Critical))
							.toBe(LOG_LEVEL_STRINGS.Critical);
					});
			});

		describe("parseLogLevel",
			() =>
			{
				it("should parse 'Information' to LogLevel.Information",
					() =>
					{
						expect(parseLogLevel("Information"))
							.toBe(LogLevel.Information);
					});

				it("should parse all valid log level strings",
					() =>
					{
						expect(parseLogLevel("Verbose"))
							.toBe(LogLevel.Verbose);
						expect(parseLogLevel("Debug"))
							.toBe(LogLevel.Debug);
						expect(parseLogLevel("Information"))
							.toBe(LogLevel.Information);
						expect(parseLogLevel("Warning"))
							.toBe(LogLevel.Warning);
						expect(parseLogLevel("Error"))
							.toBe(LogLevel.Error);
						expect(parseLogLevel("Fatal"))
							.toBe(LogLevel.Fatal);
						expect(parseLogLevel("Critical"))
							.toBe(LogLevel.Critical);
					});

				it("should default to Information for unknown values",
					() =>
					{
						expect(parseLogLevel("unknown"))
							.toBe(LogLevel.Information);
						expect(parseLogLevel(""))
							.toBe(LogLevel.Information);
					});

				it("should handle null/undefined gracefully",
					() =>
					{
						expect(parseLogLevel(null as unknown as string))
							.toBe(LogLevel.Information);
						expect(parseLogLevel(undefined as unknown as string))
							.toBe(LogLevel.Information);
					});
			});
	});
