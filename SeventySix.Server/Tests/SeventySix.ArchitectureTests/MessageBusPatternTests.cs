// <copyright file="MessageBusPatternTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests ensuring MessageBus invocations follow CQRS patterns.
/// Verifies all InvokeAsync calls use record types (commands/queries) instead of raw primitives.
/// </summary>
public partial class MessageBusPatternTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Regex pattern to find InvokeAsync calls with raw primitive type arguments.
	/// Matches patterns like: InvokeAsync<int>(ids, where ids is a variable
	/// containing arrays of primitives.
	/// </summary>
	/// <returns>
	/// Compiled regex pattern.
	/// </returns>
	[GeneratedRegex(
		@"InvokeAsync<[^>]+>\(\s*(ids|logIds|notificationIds)\s*,",
		RegexOptions.Compiled | RegexOptions.IgnoreCase)]
	private static partial Regex RawArrayArgumentPattern();

	/// <summary>
	/// Regex pattern to find InvokeAsync calls with raw string type arguments.
	/// Matches patterns like: InvokeAsync<bool>(refreshToken, where refreshToken is a string.
	/// </summary>
	/// <returns>
	/// Compiled regex pattern.
	/// </returns>
	[GeneratedRegex(
		@"InvokeAsync<bool>\(\s*(?!new\s+)[a-zA-Z]+Token\s*,",
		RegexOptions.Compiled)]
	private static partial Regex RawStringTokenArgumentPattern();

	/// <summary>
	/// Verifies all MessageBus.InvokeAsync calls use command/query record types.
	/// </summary>
	/// <remarks>
	/// CQRS pattern requires strongly-typed messages. Raw arrays or primitives
	/// passed directly to InvokeAsync break the pattern and prevent proper
	/// Wolverine handler discovery.
	///
	/// Valid: InvokeAsync(new DeleteLogBatchCommand(ids), token)
	/// Invalid: InvokeAsync(ids, token)
	/// </remarks>
	[Fact]
	public void MessageBus_Should_Not_Pass_Raw_Arrays_To_InvokeAsync()
	{
		IEnumerable<string> controllerFiles =
			GetSourceFiles("*.cs")
				.Where(filePath =>
					filePath.Contains("/Controllers/"));

		List<string> violations = [];

		foreach (string controllerFile in controllerFiles)
		{
			string controllerContent =
				ReadFileContent(controllerFile);

			// Skip files that don't use InvokeAsync
			if (!controllerContent.Contains("InvokeAsync"))
			{
				continue;
			}

			MatchCollection matches =
				RawArrayArgumentPattern().Matches(controllerContent);

			foreach (Match match in matches)
			{
				int lineNumber =
					controllerContent[..match.Index].Count(character => character == '\n') + 1;

				violations.Add(
					$"{GetRelativePath(controllerFile)}:{lineNumber} - " +
					$"InvokeAsync appears to use raw array instead of command type: {match.Value.Trim()}");
			}
		}

		violations.ShouldBeEmpty(
			$"MessageBus.InvokeAsync should use command/query record types for arrays.\n" +
			$"Violations found:\n{string.Join("\n", violations)}\n\n" +
			$"Fix: Create a record type like DeleteLogBatchCommand(long[] LogIds) and use new DeleteLogBatchCommand(ids)");
	}

	/// <summary>
	/// Verifies string tokens are wrapped in command types.
	/// </summary>
	/// <remarks>
	/// Passing raw strings like refreshToken to InvokeAsync breaks CQRS pattern.
	/// Should use command types like RevokeTokenCommand(string Token).
	/// </remarks>
	[Fact]
	public void MessageBus_Should_Not_Pass_Raw_Tokens_To_InvokeAsync()
	{
		IEnumerable<string> controllerFiles =
			GetSourceFiles("*.cs")
				.Where(filePath =>
					filePath.Contains("/Controllers/"));

		List<string> violations = [];

		foreach (string controllerFile in controllerFiles)
		{
			string controllerContent =
				ReadFileContent(controllerFile);

			// Skip files that don't use InvokeAsync
			if (!controllerContent.Contains("InvokeAsync"))
			{
				continue;
			}

			MatchCollection matches =
				RawStringTokenArgumentPattern().Matches(controllerContent);

			foreach (Match match in matches)
			{
				int lineNumber =
					controllerContent[..match.Index].Count(character => character == '\n') + 1;

				violations.Add(
					$"{GetRelativePath(controllerFile)}:{lineNumber} - " +
					$"InvokeAsync appears to use raw token string: {match.Value.Trim()}");
			}
		}

		violations.ShouldBeEmpty(
			$"MessageBus.InvokeAsync should use command types for token operations.\n" +
			$"Violations found:\n{string.Join("\n", violations)}\n\n" +
			$"Fix: Create a record type like RevokeTokenCommand(string Token) and use new RevokeTokenCommand(refreshToken)");
	}
}