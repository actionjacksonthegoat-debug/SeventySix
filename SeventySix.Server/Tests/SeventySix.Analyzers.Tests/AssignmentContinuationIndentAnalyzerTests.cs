// <copyright file="AssignmentContinuationIndentAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS003 - Assignment continuation indent analyzer.
/// Enforces proper indentation on continuation lines after '='.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public sealed class AssignmentContinuationIndentAnalyzerTests
{
	[Fact]
	public async Task ContinuationLine_WrongIndent_ReportsDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value =
			"test";
				}
			}
			""";

		await VerifyAnalyzerAsync<AssignmentContinuationIndentAnalyzer>(
			testCode,
			ExpectSS003(line: 6, column: 1));
	}

	[Fact]
	public async Task ContinuationLine_CorrectIndent_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value =
						"test";
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	[Fact]
	public async Task ObjectInitializer_PropertyWrongIndent_ReportsDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					var options =
						new TestOptions
						{
							Name =
			"test",
						};
				}
			}

			class TestOptions
			{
				public string Name { get; set; }
			}
			""";

		// Only the string literal should be flagged, NOT the 'new' keyword
		await VerifyAnalyzerAsync<AssignmentContinuationIndentAnalyzer>(
			testCode,
			ExpectSS003(line: 9, column: 1));
	}

	[Fact]
	public async Task ObjectInitializer_PropertyCorrectIndent_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					var options =
						new TestOptions
						{
							Name =
								"test",
						};
				}
			}

			class TestOptions
			{
				public string Name { get; set; }
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	[Fact]
	public async Task SameLineAssignment_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value = "test";
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	/// <summary>
	/// CRITICAL: Object creation with initializer should NOT be flagged.
	/// The 'new' keyword is correctly indented - only the properties inside matter.
	/// </summary>
	[Fact]
	public async Task ObjectCreation_WithInitializer_NewKeywordNotFlaggedAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var list =
						new List<string>()
						{
							"item",
						};
				}
			}
			""";

		// The 'new' keyword and its initializer brace should NOT be flagged
		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	/// <summary>
	/// CRITICAL: ImplicitObjectCreation (new()) with initializer should NOT be flagged.
	/// </summary>
	[Fact]
	public async Task ImplicitObjectCreation_WithInitializer_NotFlaggedAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> dictionary =
						new()
						{
							{ "key", 1 },
						};
				}
			}
			""";

		// The 'new()' and its initializer should NOT be flagged
		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	[Fact]
	public async Task ExtensionsInitializer_WrongIndent_ReportsDiagnosticAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var problem =
						new ProblemDetails
						{
							Extensions =
						{ ["key"] = "value" },
						};
				}
			}

			class ProblemDetails
			{
				public Dictionary<string, object> Extensions { get; } = new();
			}
			""";

		// Only the Extensions initializer should be flagged (line 11)
		// NOT the 'new ProblemDetails' (line 8)
		await VerifyAnalyzerAsync<AssignmentContinuationIndentAnalyzer>(
			testCode,
			ExpectSS003(line: 11, column: 4));
	}

	/// <summary>
	/// REGRESSION TEST: Properties = JsonSerializer.Serialize(new {...})
	/// This pattern is CORRECTLY formatted and should NOT trigger SS003.
	/// The 'new' keyword is properly indented one level deeper than 'Properties'.
	/// </summary>
	[Fact]
	public async Task PropertyAssignment_NestedAnonymousObject_CorrectIndent_NoDiagnosticAsync()
	{
		// This exact pattern exists in CreateClientLogBatchCommandHandler.cs
		// It should NOT be flagged - the 'new' is correctly indented
		const string testCode = """
			using System.Text.Json;

			class TestClass
			{
				void TestMethod()
				{
					var log =
						new Log
						{
							Properties =
								JsonSerializer.Serialize(
									new
										{
											UserAgent = "test",
											ClientTimestamp = "2024-01-01",
										}),
						};
				}
			}

			class Log
			{
				public string Properties { get; set; }
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	/// <summary>
	/// REGRESSION TEST: Multi-line method call after property assignment.
	/// This pattern should NOT trigger SS003 when properly indented.
	/// </summary>
	[Fact]
	public async Task PropertyAssignment_MultiLineMethodCall_CorrectIndent_NoDiagnosticAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					var options =
						new TestOptions
						{
							Name =
								SomeMethod(
									"arg1",
									"arg2"),
						};
				}

				string SomeMethod(string a, string b) => a + b;
			}

			class TestOptions
			{
				public string Name { get; set; }
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}

	/// <summary>
	/// Extensions = { ... } pattern with CORRECT indent (one tab deeper than Extensions).
	/// This is the target state we want to preserve.
	/// </summary>
	[Fact]
	public async Task ExtensionsInitializer_CorrectIndent_NoDiagnosticAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var problem =
						new ProblemDetails
						{
							Extensions =
								{ ["key"] = "value" },
						};
				}
			}

			class ProblemDetails
			{
				public Dictionary<string, object> Extensions { get; } = new();
			}
			""";

		await VerifyNoDiagnosticsAsync<AssignmentContinuationIndentAnalyzer>(
			testCode);
	}
}