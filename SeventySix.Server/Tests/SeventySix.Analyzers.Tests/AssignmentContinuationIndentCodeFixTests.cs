// <copyright file="AssignmentContinuationIndentCodeFixTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS003 CodeFix provider.
/// Verifies that the fix provider correctly transforms code without causing regressions.
/// </summary>
public class AssignmentContinuationIndentCodeFixTests
{
	/// <summary>
	/// Basic variable assignment continuation should be fixed correctly.
	/// </summary>
	[Fact]
	public async Task VariableAssignment_WrongIndent_FixesToCorrectIndentAsync()
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

		const string fixedCode = """
			class TestClass
			{
				void TestMethod()
				{
					string value =
						"test";
				}
			}
			""";

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS003(line: 6, column: 1));
	}

	/// <summary>
	/// Property assignment in object initializer should be fixed correctly.
	/// </summary>
	[Fact]
	public async Task PropertyAssignment_WrongIndent_FixesToCorrectIndentAsync()
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

		const string fixedCode = """
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

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS003(line: 9, column: 1));
	}

	/// <summary>
	/// Extensions = { ... } pattern should be fixed to have correct indent.
	/// The open brace should be indented one level deeper than 'Extensions'.
	/// </summary>
	[Fact]
	public async Task ExtensionsInitializer_WrongIndent_FixesToCorrectIndentAsync()
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

		// Fixed code: { should be at Extensions indent + 1 tab
		const string fixedCode = """
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

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider>(
			testCode,
			fixedCode,
			ExpectSS003(line: 11, column: 4));
	}

	/// <summary>
	/// CRITICAL REGRESSION TEST: Properties = JsonSerializer.Serialize(new {...})
	/// This pattern should NOT be modified by the code fix provider because
	/// it's already correctly formatted.
	/// </summary>
	[Fact]
	public async Task PropertyWithNestedNew_CorrectlyFormatted_NoChangeAsync()
	{
		// This code is already correct - no diagnostic should be raised
		// and thus no fix should be applied
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
										}),
						};
				}
			}

			class Log
			{
				public string Properties { get; set; }
			}
			""";

		// No expected diagnostics - code is correct
		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode); // Fixed code should be same as input
	}

	/// <summary>
	/// Tests for implicit object creation (new()) with collection initializer
	/// where the brace is on a separate line with wrong indent.
	/// This is the exact pattern causing issues in test files.
	/// </summary>
	[Theory]
	[InlineData(
		"Dictionary_WrongBraceIndent",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> callsByApi =
						new()
			{
							{ "ExternalAPI", 150 },
						};
				}
			}
			""",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> callsByApi =
						new()
						{
							{ "ExternalAPI", 150 },
						};
				}
			}
			""",
		true,
		9,
		1
	)]
	[InlineData(
		"Dictionary_CorrectIndent_NoChange",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> callsByApi =
						new()
						{
							{ "ExternalAPI", 150 },
						};
				}
			}
			""",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> callsByApi =
						new()
						{
							{ "ExternalAPI", 150 },
						};
				}
			}
			""",
		false,
		0,
		0
	)]
	[InlineData(
		"BraceOnSameLine_NoChange",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> dict =
						new() { { "key", 1 } };
				}
			}
			""",
		"""
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					Dictionary<string, int> dict =
						new() { { "key", 1 } };
				}
			}
			""",
		false,
		0,
		0
	)]
	public async Task ImplicitObjectCreation_InitializerBrace_HandledCorrectlyAsync(
		string testName,
		string inputCode,
		string expectedCode,
		bool shouldFix,
		int expectedLine,
		int expectedColumn)
	{
		_ = testName;

		if (shouldFix)
		{
			await VerifyCodeFixAsync<
				AssignmentContinuationIndentAnalyzer,
				AssignmentContinuationIndentCodeFixProvider
			>(
				inputCode,
				expectedCode,
				ExpectSS003(line: expectedLine, column: expectedColumn));
		}
		else
		{
			await VerifyCodeFixAsync<
				AssignmentContinuationIndentAnalyzer,
				AssignmentContinuationIndentCodeFixProvider
			>(inputCode, expectedCode);
		}
	}

	/// <summary>
	/// REGRESSION TEST: Binary operators should not be affected.
	/// </summary>
	[Fact]
	public async Task BinaryOperator_InObjectInitializer_NotAffectedAsync()
	{
		const string testCode = """
			class TestClass
			{
				void TestMethod()
				{
					var options =
						new ForwardedHeadersOptions
						{
							ForwardedHeaders =
								ForwardedHeaders.XForwardedFor
							| ForwardedHeaders.XForwardedProto,
						};
				}
			}

			class ForwardedHeadersOptions
			{
				public ForwardedHeaders ForwardedHeaders { get; set; }
			}

			enum ForwardedHeaders
			{
				XForwardedFor = 1,
				XForwardedProto = 2,
			}
			""";

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode);
	}

	/// <summary>
	/// REGRESSION TEST: Anonymous objects in method args should not be affected.
	/// </summary>
	[Fact]
	public async Task AnonymousObject_InMethodArg_NotAffectedAsync()
	{
		const string testCode = """
			using System.Text.Json;

			class TestClass
			{
				void TestMethod()
				{
					string properties =
						JsonSerializer.Serialize(
							new
							{
								UserAgent = "test",
								Browser = "Chrome",
							});
				}
			}
			""";

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode);
	}

	/// <summary>
	/// REGRESSION TEST: Nested dictionary initializer with multi-line key-value entries
	/// should NOT be flagged. When dotnet format incorrectly de-indents the outer brace,
	/// our analyzer should skip the nested initializer expressions.
	/// Pattern from ThirdPartyApiRequestsControllerTests.cs
	/// </summary>
	[Fact]
	public async Task NestedDictionary_OuterBraceWrong_InnerNotFlaggedAsync()
	{
		const string testCode = """
			using System;
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							CallsByApi =
								new Dictionary<string, int>
			{
									{ "ExternalAPI", 150 },
									{ "GoogleMaps", 75 },
								},
							LastCalledByApi =
								new Dictionary<string, DateTime?>
			{
									{
										"ExternalAPI",
										DateTime.UtcNow.AddMinutes(-5)
									},
									{
										"GoogleMaps",
										DateTime.UtcNow.AddMinutes(-10)
									},
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, int> CallsByApi { get; set; }
				public Dictionary<string, DateTime?> LastCalledByApi { get; set; }
			}
			""";

		const string fixedCode = """
			using System;
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							CallsByApi =
								new Dictionary<string, int>
								{
									{ "ExternalAPI", 150 },
									{ "GoogleMaps", 75 },
								},
							LastCalledByApi =
								new Dictionary<string, DateTime?>
								{
									{
										"ExternalAPI",
										DateTime.UtcNow.AddMinutes(-5)
									},
									{
										"GoogleMaps",
										DateTime.UtcNow.AddMinutes(-10)
									},
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, int> CallsByApi { get; set; }
				public Dictionary<string, DateTime?> LastCalledByApi { get; set; }
			}
			""";

		// Fix the outer braces and closing braces, but NOT the inner { key, value } blocks
		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(
			testCode,
			fixedCode,
			ExpectSS003(line: 13, column: 1),
			ExpectSS003(line: 19, column: 1));
	}

	/// <summary>
	/// REGRESSION TEST: Simple dictionary entries (single line) inside object initializer
	/// should NOT be changed when already at correct indent.
	/// </summary>
	[Fact]
	public async Task Dictionary_InObjectInitializer_CorrectIndent_NotChangedAsync()
	{
		const string testCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var response =
						new Response
						{
							Data =
								new Dictionary<string, int>
								{
									{ "Key1", 100 },
									{ "Key2", 200 },
								},
						};
				}
			}

			class Response
			{
				public Dictionary<string, int> Data { get; set; }
			}
			""";

		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode);
	}

	/// <summary>
	/// REGRESSION TEST: Simple single-line dictionary entries should maintain correct indent.
	/// Pattern from ThirdPartyApiRequestsControllerTests.cs where dotnet format de-indents them.
	/// </summary>
	[Fact]
	public async Task SimpleDictionaryEntries_CorrectIndent_MaintainedAsync()
	{
		// This is the CORRECT format committed to git
		const string testCode = """
			using System;
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							CallsByApi =
								new Dictionary<string, int>
								{
									{ "ExternalAPI", 150 },
									{ "GoogleMaps", 75 },
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, int> CallsByApi { get; set; }
			}
			""";

		// Should NOT change - already correct
		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode);
	}

	/// <summary>
	/// REGRESSION TEST: Multi-line dictionary entries should maintain correct indent.
	/// Pattern from ThirdPartyApiRequestsControllerTests.cs where dotnet format de-indents them.
	/// </summary>
	[Fact]
	public async Task MultiLineDictionaryEntries_CorrectIndent_MaintainedAsync()
	{
		// This is the CORRECT format committed to git
		const string testCode = """
			using System;
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							LastCalledByApi =
								new Dictionary<string, DateTime?>
								{
									{
										"ExternalAPI",
										DateTime.UtcNow.AddMinutes(-5)
									},
									{
										"GoogleMaps",
										DateTime.UtcNow.AddMinutes(-10)
									},
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, DateTime?> LastCalledByApi { get; set; }
			}
			""";

		// Should NOT change - already correct
		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(testCode, testCode);
	}

	/// <summary>
	/// CRITICAL TEST: Shows what dotnet format (IDE0055) does to our correctly-formatted code.
	/// After our analyzers run, IDE0055 de-indents the dictionary entries.
	/// This test proves the pattern that's breaking in the real codebase.
	/// TODO: Analyzer doesn't yet detect collection expression entries - requires production code changes.
	/// </summary>
	[Fact(Skip = "Analyzer doesn't yet detect collection expression entries (needs production code changes)")]
	public async Task SimpleDictionaryEntries_AfterIDE0055DeIndents_ShouldBeDetectedAsync()
	{
		// This is what IDE0055 produces (WRONG)
		const string wrongCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							CallsByApi =
								new Dictionary<string, int>
								{
			{ "ExternalAPI", 150 },
			{ "GoogleMaps", 75 },
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, int> CallsByApi { get; set; }
			}
			""";

		// This is what it should be (CORRECT)
		const string correctCode = """
			using System.Collections.Generic;

			class TestClass
			{
				void TestMethod()
				{
					var stats =
						new StatsResponse
						{
							CallsByApi =
								new Dictionary<string, int>
								{
									{ "ExternalAPI", 150 },
									{ "GoogleMaps", 75 },
								},
						};
				}
			}

			class StatsResponse
			{
				public Dictionary<string, int> CallsByApi { get; set; }
			}
			""";

		// Should detect and fix the de-indented entries
		await VerifyCodeFixAsync<
			AssignmentContinuationIndentAnalyzer,
			AssignmentContinuationIndentCodeFixProvider
		>(
			wrongCode,
			correctCode,
			ExpectSS003(line: 13, column: 1),
			ExpectSS003(line: 14, column: 1));
	}
}