// <copyright file="AsyncNamingTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce async method naming conventions.
/// Rule: All async methods must have Async suffix.
/// </summary>
public sealed class AsyncNamingTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Method names from external library interfaces that cannot be renamed.
	/// </summary>
	private static readonly HashSet<string> ExternalInterfaceMethods =
		[
			// Ixnas.AltchaNet.IAltchaCancellableChallengeStore interface methods
			"Store",
			"Exists"
		];

	[Fact]
	public void Async_Methods_Should_Have_Async_Suffix()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs");

		// Match: public/private/protected Task/Task<T> MethodName(
		// Exclude: interface definitions, test methods
		Regex asyncMethodPattern =
			new Regex(
			@"(public|private|protected|internal)\s+(?:async\s+)?Task(?:<[^>]+>)?\s+(\w+)\s*\(",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			string content =
				ReadFileContent(file);

			// Skip interfaces and test files
			if (content.Contains("interface I") || file.Contains("/Tests/"))
			{
				continue;
			}

			MatchCollection matches =
				asyncMethodPattern.Matches(content);

			foreach (string methodName in matches.Select(match => match.Groups[2].Value))
			{

				// Skip Main, Dispose, event handlers, test methods
				if (
					methodName == "Main"
					|| methodName == "Dispose"
					|| methodName == "DisposeAsync"
					|| methodName.StartsWith("On")
					|| methodName.StartsWith("Handle")
					|| methodName.StartsWith("Test")
					|| file.Contains("Tests.cs"))
				{
					continue;
				}

				// Skip methods from external library interfaces
				if (ExternalInterfaceMethods.Contains(methodName))
				{
					continue;
				}

				if (!methodName.EndsWith("Async"))
				{
					string relativePath =
						GetRelativePath(file);

					violations.Add(
						$"{relativePath}: {methodName} (should end with Async)");
				}
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}
}