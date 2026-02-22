using SeventySix.Api.Extensions;
using Shouldly;
using static SeventySix.Api.Extensions.WebApplicationExtensions;

namespace SeventySix.Api.Tests.Extensions;

public sealed class WebApplicationExtensionsTests
{
	[Fact]
	public void ParsePostgresConnectionString_ExtractsHostAndPort()
	{
		// Arrange
		string connectionString =
			"Host=localhost;Port=5432;Database=test;Username=user;Password=pass";

		// Act
		PostgresConnectionInfo result =
			ParsePostgresConnectionString(
				connectionString);

		// Assert
		result.Host.ShouldBe("localhost");
		result.Port.ShouldBe(5432);
	}

	[Fact]
	public void ParsePostgresConnectionString_UsesDefaults_WhenMissing()
	{
		// Arrange
		string connectionString = "Database=test";

		// Act
		PostgresConnectionInfo result =
			ParsePostgresConnectionString(
				connectionString);

		// Assert
		result.Host.ShouldBe("localhost");
		result.Port.ShouldBe(5432);
	}

	[Fact]
	public void BuildMigrationErrorMessage_IncludesInnerException()
	{
		// Arrange
		Exception innerException =
			new("Inner error message");

		Exception outerException =
			new("Outer error", innerException);

		// Act
		string message =
			BuildMigrationErrorMessage(outerException);

		// Assert
		message.ShouldContain("Outer error");
		message.ShouldContain("Inner error message");
		message.ShouldContain("Common causes:");
		message.ShouldContain("Suggested fixes:");
	}
}