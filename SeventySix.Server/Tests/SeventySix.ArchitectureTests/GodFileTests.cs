// <copyright file="GodFileTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to prevent god files.
/// Files with 800+ lines violate SRP and must be split.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - Under 800 lines: OK - maintainable file size
/// - 800+ lines: MUST SPLIT - unmaintainable, violates SRP
/// Threshold applies to ALL files including tests.
/// </remarks>
public class GodFileTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Maximum allowed lines per file before requiring split.
	/// </summary>
	private const int MaxLinesPerFile = 799;

	/// <summary>
	/// Files that are explicitly allowed to exceed the line limit.
	/// Each exception must have a documented justification.
	/// </summary>
	private static readonly HashSet<string> AllowedExceptions =
		[
			"UsersController.cs", // User management controller - 846 lines (CQRS handlers not yet extracted)
		];

	[Fact]
	public void All_Files_Should_Be_Under_800_Lines()
	{
		// Arrange
		IEnumerable<string> sourceFiles = GetAllSourceFiles();
		List<string> godFileViolations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileName = Path.GetFileName(filePath);

			if (AllowedExceptions.Contains(fileName))
			{
				continue;
			}

			int lineCount = File.ReadAllLines(filePath).Length;

			if (lineCount > MaxLinesPerFile)
			{
				string relativePath = GetRelativePath(filePath);
				godFileViolations.Add(
					$"{relativePath}: {lineCount} lines (max {MaxLinesPerFile})");
			}
		}

		// Assert
		Assert.Empty(godFileViolations);
	}
}