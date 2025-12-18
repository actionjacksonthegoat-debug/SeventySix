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
/// - NEVER use DateTime.UtcNow directly in any code (production or tests)
/// - ALWAYS inject TimeProvider for testable time abstraction
/// - Tests should use TestTimeProvider or mock TimeProvider
/// </remarks>
public class TimeProviderUsageTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Files that are explicitly allowed to use DateTime.UtcNow.
	/// These should be empty - no exceptions allowed per YAGNI.
	/// </summary>
	private static readonly HashSet<string> AllowedExceptions =
		[
		// This test file itself contains DateTime.UtcNow in regex patterns and documentation
		"TimeProviderUsageTests.cs",
		// Analyzer tests contain DateTime.UtcNow in test code strings being analyzed (not actual usage)
		"AssignmentContinuationIndentCodeFixTests.cs",
	];

	[Fact]
	public void All_Code_Should_Use_TimeProvider_Not_DateTime_UtcNow()
	{
		// Arrange - check ALL code including tests using GetAllSourceFiles
		IEnumerable<string> sourceFiles = GetAllSourceFiles();

		List<string> violations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileName =
				Path.GetFileName(filePath);

			if (AllowedExceptions.Contains(fileName))
			{
				continue;
			}

			string fileContent =
				ReadFileContent(filePath);
			string relativePath =
				GetRelativePath(filePath);

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