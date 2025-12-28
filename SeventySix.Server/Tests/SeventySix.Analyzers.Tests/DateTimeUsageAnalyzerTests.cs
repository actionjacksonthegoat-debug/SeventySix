// <copyright file="DateTimeUsageAnalyzerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Threading.Tasks;
using Xunit;

namespace SeventySix.Analyzers.Tests;

public class DateTimeUsageAnalyzerTests
{
	[Fact]
	public Task Flags_DateTime_UtcNow_MemberAccess()
	{
		string source = @"using System;
namespace N
{
	public class C
	{
		public void M()
		{
			var now = DateTime.UtcNow;
		}
	}
}";

		// Expect diagnostic on the member access expression (DateTime.UtcNow)
		return AnalyzerTestHelpers.VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			AnalyzerTestHelpers.ExpectSS004(8, 14));
	}

	[Fact]
	public Task Flags_New_DateTime_ObjectCreation()
	{
		string source = @"using System;
namespace N
{
	public class C
	{
		public void M()
		{
			var d = new DateTime(2020, 1, 1);
		}
	}
}";

		return AnalyzerTestHelpers.VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			AnalyzerTestHelpers.ExpectSS004(8, 12));
	}

	[Fact]
	public Task Flags_System_DateTime_QualifiedName()
	{
		string source = @"namespace N
{
	public class C
	{
		System.DateTime dt = System.DateTime.Now;
	}
}";

		return AnalyzerTestHelpers.VerifyAnalyzerAsync<DateTimeUsageAnalyzer>(
			source,
			AnalyzerTestHelpers.ExpectSS004(5, 3),
			AnalyzerTestHelpers.ExpectSS004(5, 24));
	}

	[Fact]
	public Task DoesNotFlag_DateTimeOffset()
	{
		string source = @"using System;
namespace N
{
	public class C
	{
		public void M()
		{
			var x = DateTimeOffset.Now;
		}
	}
}";

		return AnalyzerTestHelpers.VerifyNoDiagnosticsAsync<DateTimeUsageAnalyzer>(source);
	}
}