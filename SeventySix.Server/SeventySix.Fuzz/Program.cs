// <copyright file="Program.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Globalization;
using System.Text;
using SeventySix.Shared.Utilities;

namespace SeventySix.Fuzz;

/// <summary>
/// SharpFuzz multi-target dispatcher exercising user-controlled input
/// surfaces in <see cref="SeventySix.Shared.Utilities"/>.
/// </summary>
/// <remarks>
/// <para>
/// The harness selects which target to fuzz via the <c>FUZZ_TARGET</c>
/// environment variable (default: <c>registration-token</c>). Every target
/// must:
/// </para>
/// <list type="number">
///   <item>Never throw an unhandled exception (catch known bad-input cases
///   and return a sentinel value).</item>
///   <item>Never enter an unbounded loop or allocate unbounded memory.</item>
/// </list>
/// <para>
/// Memory-leak detection: when <c>FUZZ_MEMORY_BUDGET_MB</c> is set, the
/// harness wraps each iteration with a managed-heap growth check.
/// Sustained growth above the budget across iterations indicates a
/// managed-memory leak (e.g. unbounded cache, retained event-handler).
/// SharpFuzz catches the resulting exception and reports it as a crash.
/// </para>
/// </remarks>
public static class Program
{
	/// <summary>
	/// Environment variable used to select the active fuzz target.
	/// </summary>
	private const string FuzzTargetEnvVar = "FUZZ_TARGET";

	/// <summary>
	/// Default fuzz target used when no environment variable is set.
	/// </summary>
	private const string DefaultTarget = "registration-token";

	/// <summary>
	/// Environment variable used to enable per-iteration managed-heap
	/// growth tracking (off by default to keep the libFuzzer hot path fast).
	/// </summary>
	private const string MemoryBudgetEnvVar = "FUZZ_MEMORY_BUDGET_MB";

	/// <summary>
	/// SharpFuzz entry point. Dispatches to the selected fuzz target.
	/// </summary>
	public static void Main()
	{
		string target =
			Environment.GetEnvironmentVariable(FuzzTargetEnvVar)
			?? DefaultTarget;

		long memoryBudgetBytes =
			ParseMemoryBudget(
				Environment.GetEnvironmentVariable(MemoryBudgetEnvVar));

		Action<Stream> fuzzAction =
			ResolveFuzzAction(target);

		Action<Stream> wrappedAction =
			memoryBudgetBytes > 0
				? WrapWithMemoryBudget(fuzzAction, memoryBudgetBytes)
				: fuzzAction;

		Console.Error.WriteLine(
			$"[fuzz] target={target} memory-budget-bytes={memoryBudgetBytes}");

		SharpFuzz.Fuzzer.Run(wrappedAction);
	}

	/// <summary>
	/// Resolves the named fuzz target to its harness implementation.
	/// </summary>
	/// <param name="target">
	/// The fuzz target name from <see cref="FuzzTargetEnvVar"/>.
	/// </param>
	/// <returns>
	/// A stream-consuming action that exercises the target.
	/// </returns>
	private static Action<Stream> ResolveFuzzAction(string target)
	{
		return target switch
		{
			"registration-token" => FuzzRegistrationToken,
			"log-sanitize" => FuzzLogSanitize,
			"log-mask-email" => FuzzLogMaskEmail,
			"log-mask-username" => FuzzLogMaskUsername,
			"log-mask-email-subject" => FuzzLogMaskEmailSubject,
			_ => throw new ArgumentOutOfRangeException(
				nameof(target),
				target,
				"Unknown FUZZ_TARGET. Valid values: registration-token, "
					+ "log-sanitize, log-mask-email, log-mask-username, "
					+ "log-mask-email-subject."),
		};
	}

	/// <summary>
	/// Parses the optional memory-budget environment variable.
	/// </summary>
	/// <param name="raw">
	/// Raw value of <see cref="MemoryBudgetEnvVar"/>; null/empty disables
	/// per-iteration tracking.
	/// </param>
	/// <returns>
	/// Budget in bytes, or 0 when tracking is disabled.
	/// </returns>
	private static long ParseMemoryBudget(string? raw)
	{
		if (string.IsNullOrWhiteSpace(raw))
		{
			return 0;
		}

		bool parsed =
			long.TryParse(
				raw,
				NumberStyles.Integer,
				CultureInfo.InvariantCulture,
				out long megabytes);

		if (!parsed || megabytes <= 0)
		{
			return 0;
		}

		return megabytes * 1024L * 1024L;
	}

	/// <summary>
	/// Wraps a fuzz action with a per-iteration managed-heap growth check.
	/// Throws when sustained growth exceeds the configured budget so
	/// SharpFuzz/libFuzzer records it as a crash (leak indicator).
	/// </summary>
	/// <param name="inner">
	/// The underlying fuzz action.
	/// </param>
	/// <param name="budgetBytes">
	/// The maximum allowed managed-heap growth above the established
	/// baseline (post-warmup) before the iteration is treated as a leak.
	/// </param>
	/// <returns>
	/// A wrapped stream action that enforces the memory budget.
	/// </returns>
	private static Action<Stream> WrapWithMemoryBudget(
		Action<Stream> inner,
		long budgetBytes)
	{
		long baseline = -1;
		int iteration = 0;
		const int WarmupIterations = 16;

		return stream =>
		{
			inner(stream);

			iteration++;

			// Establish baseline only after warmup so JIT and one-time
			// allocations do not register as leaks.
			if (iteration < WarmupIterations)
			{
				return;
			}

			long currentBytes =
				GC.GetTotalMemory(forceFullCollection: true);

			if (baseline < 0)
			{
				baseline = currentBytes;
				return;
			}

			long growth =
				currentBytes - baseline;

			if (growth > budgetBytes)
			{
				throw new InvalidOperationException(
					$"Managed-heap growth {growth} bytes exceeds budget "
						+ $"{budgetBytes} bytes (baseline {baseline}, "
						+ $"current {currentBytes}, iteration {iteration}). "
						+ "Possible memory leak in fuzz target.");
			}
		};
	}

	/// <summary>
	/// Reads the entire fuzz input as a UTF-8 string (replacement chars
	/// for invalid byte sequences).
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	/// <returns>
	/// Decoded UTF-8 string.
	/// </returns>
	private static string ReadInputAsString(Stream stream)
	{
		using MemoryStream memory =
			new MemoryStream();
		stream.CopyTo(memory);

		return Encoding.UTF8.GetString(memory.ToArray());
	}

	// ──────────────────────────────────────────────────────────────────
	//  Fuzz targets — every method must be total (never throw on bad input).
	// ──────────────────────────────────────────────────────────────────

	/// <summary>
	/// Fuzz target: <see cref="RegistrationTokenService.Decode"/> —
	/// exercises Base64Url + UTF-8 + JSON parsing of a user-controlled token.
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	private static void FuzzRegistrationToken(Stream stream)
	{
		string input =
			ReadInputAsString(stream);

		// Decode catches FormatException, JsonException, ArgumentException
		// and returns null; any other escape is recorded as a crash.
		_ =
			RegistrationTokenService.Decode(input);
	}

	/// <summary>
	/// Fuzz target: <see cref="LogSanitizer.Sanitize"/> — strips CR/LF
	/// from a user-controlled value to prevent log-forging.
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	private static void FuzzLogSanitize(Stream stream)
	{
		string input =
			ReadInputAsString(stream);
		_ =
			LogSanitizer.Sanitize(input);
	}

	/// <summary>
	/// Fuzz target: <see cref="LogSanitizer.MaskEmail"/> — masks an
	/// email address for safe logging.
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	private static void FuzzLogMaskEmail(Stream stream)
	{
		string input =
			ReadInputAsString(stream);
		_ =
			LogSanitizer.MaskEmail(input);
	}

	/// <summary>
	/// Fuzz target: <see cref="LogSanitizer.MaskUsername"/> — masks a
	/// username for safe logging.
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	private static void FuzzLogMaskUsername(Stream stream)
	{
		string input =
			ReadInputAsString(stream);
		_ =
			LogSanitizer.MaskUsername(input);
	}

	/// <summary>
	/// Fuzz target: <see cref="LogSanitizer.MaskEmailSubject"/> —
	/// categorises a subject line without leaking content.
	/// </summary>
	/// <param name="stream">
	/// The libFuzzer input stream.
	/// </param>
	private static void FuzzLogMaskEmailSubject(Stream stream)
	{
		string input =
			ReadInputAsString(stream);
		_ =
			LogSanitizer.MaskEmailSubject(input);
	}
}