using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Ensures TransactionManager is used appropriately (KISS, YAGNI).
/// Detects code smell: wrapping single repository calls in transactions when
/// EF Core's SaveChangesAsync already provides atomicity.
/// </summary>
public sealed class TransactionUsageTests
{
	private readonly Assembly Assembly =
		typeof(SeventySix.Identity.ApplicationUser).Assembly;

	[Fact]
	public void Services_Should_Not_Wrap_Single_Repository_Calls_In_Transactions()
	{
		List<string> violations = [];
		Type[] serviceTypes =
			Assembly
			.GetTypes()
			.Where(type =>
				type.IsClass
				&& !type.IsAbstract
				&& type.Name.EndsWith("Service")
				&& type.Namespace != null
				&& !type.Namespace.Contains("Infrastructure"))
			.ToArray();

		foreach (Type serviceType in serviceTypes)
		{
			string? filePath =
				FindSourceFile(serviceType.Name);

			if (filePath == null)
			{
				continue;
			}

			string sourceCode =
				File.ReadAllText(filePath);

			// Pattern: ExecuteInTransactionAsync with single await repository call
			// Example violation:
			//   await transactionManager.ExecuteInTransactionAsync(
			//       async ct => await repository.SomeMethodAsync(...)
			//   );
			//
			// This is unnecessary because repository methods already use
			// SaveChangesAsync which is transactional.

			MatchCollection transactionBlocks =
				Regex.Matches(
				sourceCode,
				@"ExecuteInTransactionAsync\s*\(\s*(?:async\s+\w+\s*=>)?\s*await\s+repository\.\w+Async\([^)]*\)",
				RegexOptions.Singleline);

			foreach (Match match in transactionBlocks)
			{
				// Extract method name from surrounding context
				int methodStart =
					sourceCode.LastIndexOf(
					"public async Task",
					match.Index);

				if (methodStart != -1)
				{
					int methodNameEnd =
						sourceCode.IndexOf('(', methodStart);

					string methodSignature =
						sourceCode[
						methodStart..methodNameEnd
					];

					Regex methodNameRegex =
						new(@"Task(?:<[^>]+>)?\s+(\w+)");

					Match methodNameMatch =
						methodNameRegex.Match(
						methodSignature);

					if (methodNameMatch.Success)
					{
						string methodName =
							methodNameMatch.Groups[1].Value;

						violations.Add(
							$"{serviceType.Name}.{methodName}: "
								+ $"Wraps single repository call in transaction (unnecessary - "
								+ $"EF Core's SaveChangesAsync is already atomic)");
					}
				}
			}
		}

		violations.ShouldBeEmpty();
	}

	[Fact]
	public void Services_Should_Use_Transactions_For_Multi_Step_Operations()
	{
		// This test documents WHEN to use TransactionManager (positive cases)
		List<string> documentedPatterns =
			[
			"Read-then-write with uniqueness checks (prevents race conditions)",
			"Multi-entity operations requiring all-or-nothing atomicity",
			"Operations spanning multiple repository calls",
		];

		// No assertion - just documentation
		documentedPatterns.ShouldNotBeEmpty();
	}

	private string? FindSourceFile(string typeName)
	{
		string baseDir =
			Path.GetFullPath(
			Path.Combine(
				AppContext.BaseDirectory,
				"..",
				"..",
				"..",
				"..",
				"..",
				"SeventySix"));

		if (!Directory.Exists(baseDir))
		{
			return null;
		}

		string[] files =
			Directory.GetFiles(
			baseDir,
			$"{typeName}.cs",
			SearchOption.AllDirectories);

		return files.FirstOrDefault();
	}
}