// <copyright file="DateTimeUsageAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using static SeventySix.Analyzers.Tests.AnalyzerTestHelpers;

namespace SeventySix.Analyzers.Tests;

/// <summary>
/// Tests for SS004 - DateTime usage analyzer.
/// Enforces TimeProvider injection over direct DateTime access.
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
}