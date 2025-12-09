// <copyright file="TimeProviderUsageTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce TimeProvider usage.
/// Direct DateTime.UtcNow usage prevents testability and must be replaced.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - NEVER use DateTime.UtcNow directly in production code
/// - ALWAYS inject TimeProvider for testable time abstraction
/// - Tests can use DateTime.UtcNow for test data
/// </remarks>
public class TimeProviderUsageTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Files that are explicitly allowed to use DateTime.UtcNow.
	/// These should be empty - no exceptions allowed per YAGNI.
	/// </summary>
	private static readonly HashSet<string> AllowedExceptions =
		[
			// No exceptions - all production code must use TimeProvider
		];

	[Fact]
	public void Production_Code_Should_Use_TimeProvider_Not_DateTime_UtcNow()
	{
		// Arrange
		IEnumerable<string> sourceFiles =
			GetSourceFiles("*.cs")
				.Where(filePath => !filePath.Contains("\\Tests\\"));

		List<string> violations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileName = Path.GetFileName(filePath);

			if (AllowedExceptions.Contains(fileName))
			{
				continue;
			}

			string fileContent = ReadFileContent(filePath);
			string relativePath = GetRelativePath(filePath);

			// Find DateTime.UtcNow usages
			MatchCollection matches =
				Regex.Matches(
					fileContent,
					@"DateTime\.UtcNow",
					RegexOptions.Multiline);

			if (matches.Count > 0)
			{
				violations.Add(
					$"{relativePath}: {matches.Count} DateTime.UtcNow usage(s) - inject TimeProvider instead");
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}