using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests to enforce use of 64-bit identifiers (long/bigint) for PKs and FKs.
/// TDD-first: these tests should fail before code changes are made.
/// </summary>
public class IdTypeTests : SourceCodeArchitectureTest
{
	[Fact]
	public void Entities_PrimaryKey_ShouldBeLong()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			[..GetSourceFiles("*.cs")
				.Where(file =>
					(file.Contains("\\Models\\")
						|| file.Contains("\\Entities\\"))
						&& !file.Contains("Dto")
						&& !file.Contains("Request")
						&& !file.Contains("Response")
						&& !file.Contains("Result")
						&& !file.Contains("OAuth")
						&& !file.EndsWith("Settings.cs"))];
		List<string> violations = new();

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			if (content.Contains("public int Id")
				|| content.Contains("public Int32 Id"))
			{
				string relativePath =
					GetRelativePath(file);

				violations.Add(
					$"{relativePath}: Primary key declared as int rather than long");
			}
		}

		// Assert - test should fail until entities are updated to use long
		violations.ShouldBeEmpty();
	}

	[Fact]
	public void Entities_ForeignKeys_ShouldBeLong()
	{
		// Arrange
		IEnumerable<string> entityFiles =
			[..GetSourceFiles("*.cs")
				.Where(file =>
					(file.Contains("\\Models\\")
						|| file.Contains("\\Entities\\"))
					&& !file.Contains("Dto")
					&& !file.Contains("Request")
					&& !file.Contains("Response")
					&& !file.Contains("Result")
					&& !file.Contains("OAuth")
					&& !file.EndsWith("Settings.cs"))];
		List<string> violations = new();

		// Act
		foreach (string file in entityFiles)
		{
			string content =
				ReadFileContent(file);

			// Find patterns like: public int UserId { get; set; }
			MatchCollection fkMatches =
				Regex.Matches(
					content,
					"\\bpublic\\s+int\\s+\\w+Id\\b");

			foreach (Match match in fkMatches)
			{
				string relativePath =
					GetRelativePath(file);

				violations.Add(
					$"{relativePath}: Foreign key uses int - '{match.Value.Trim()}'");
			}
		}

		// Assert - test should fail until FKs are updated to long
		violations.ShouldBeEmpty();
	}
}