// <copyright file="DateTimeUsageAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS004 - DateTime usage analyzer.
/// Enforces DateTimeOffset + TimeProvider injection over direct DateTime access.
/// Follows 80/20 rule: critical paths only.
/// </summary>
public class DateTimeUsageAnalyzerTests
{
	[Fact]
	public async Task DateTime_UtcNow_MemberAccess_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public void TestMethod()
					{
						var now = DateTime.UtcNow;
					}
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(8, 14));
	}

	[Fact]
	public async Task DateTime_ObjectCreation_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public void TestMethod()
					{
						var dateValue = new DateTime(2020, 1, 1);
					}
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(8, 20));
	}

	[Fact]
	public async Task SystemDateTime_QualifiedName_ReportsDiagnosticAsync()
	{
		const string source = """
			namespace TestNamespace
			{
				public class TestClass
				{
					System.DateTime dateField = System.DateTime.Now;
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(5, 3),
			ExpectSS004(5, 31));
	}

	[Fact]
	public async Task DateTimeOffset_Usage_NoDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public void TestMethod()
					{
						var offsetValue = DateTimeOffset.Now;
					}
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<DateTimeUsageAnalyzer>(source);
	}

	[Fact]
	public async Task DateTime_PropertyDeclaration_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public DateTime CreateDate { get; set; }
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(6, 10));
	}

	[Fact]
	public async Task DateTime_MethodParameter_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public void Process(DateTime timestamp) { }
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(6, 23));
	}

	[Fact]
	public async Task DateTime_ReturnType_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public DateTime GetDate() => default;
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(6, 10));
	}

	[Fact]
	public async Task DateTime_LocalVariable_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public void TestMethod()
					{
						DateTime now = default;
					}
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(8, 4));
	}

	[Fact]
	public async Task DateTime_GenericTypeArg_ReportsDiagnosticAsync()
	{
		const string source = """
			using System;
			using System.Collections.Generic;
			namespace TestNamespace
			{
				public class TestClass
				{
					public List<DateTime> Dates { get; set; }
				}
			}
			""";

		await VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			ExpectSS004(7, 15));
	}

	[Fact]
	public async Task DateTimeOffset_PropertyDeclaration_NoDiagnosticAsync()
	{
		const string source = """
			using System;
			namespace TestNamespace
			{
				public class TestClass
				{
					public DateTimeOffset CreateDate { get; set; }
				}
			}
			""";

		await VerifyNoDiagnosticsAsync<DateTimeUsageAnalyzer>(source);
	}
}