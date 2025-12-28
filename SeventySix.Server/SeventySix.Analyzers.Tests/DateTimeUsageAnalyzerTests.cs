// NOTE: This file was accidentally created in the analyzer project root. The real tests are located under Tests/SeventySix.Analyzers.Tests/DateTimeUsageAnalyzerTests.cs
// This placeholder prevents duplicate tests from being compiled here.

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
			AnalyzerTestHelpers.ExpectSS004(6, 20)
		);
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
			AnalyzerTestHelpers.ExpectSS004(6, 17)
		);
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
			AnalyzerTestHelpers.ExpectSS004(4, 2),
			AnalyzerTestHelpers.ExpectSS004(4, 25)
		);
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