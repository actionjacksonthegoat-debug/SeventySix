// <copyright file="ConnectionStringBuilderTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Tests for <see cref="ConnectionStringBuilder"/>.
/// </summary>
/// <remarks>
/// Validates connection string building from Database:* configuration components.
/// </remarks>
public sealed class ConnectionStringBuilderTests
{
	[Fact]
	public void BuildPostgresConnectionString_WithAllComponents_BuildsConnectionString()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["Database:Host"] = "myhost",
						["Database:Port"] = "5432",
						["Database:Name"] = "mydb",
						["Database:User"] = "myuser",
						["Database:Password"] = "mypassword",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("Host=myhost");
		result.ShouldContain("Port=5432");
		result.ShouldContain("Database=mydb");
		result.ShouldContain("Username=myuser");
		result.ShouldContain("Password=mypassword");
		result.ShouldContain("Pooling=true");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithCustomPort_UsesCustomPort()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["Database:Host"] = "testhost",
						["Database:Port"] = "5433",
						["Database:Name"] = "testdb",
						["Database:User"] = "testuser",
						["Database:Password"] = "testpass",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("Host=testhost");
		result.ShouldContain("Port=5433");
		result.ShouldContain("Database=testdb");
		result.ShouldContain("Username=testuser");
		result.ShouldContain("Password=testpass");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithDefaults_UsesDefaultHostAndPort()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["Database:Password"] = "requiredpassword",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("Host=localhost");
		result.ShouldContain("Port=5432");
		result.ShouldContain("Database=seventysix");
		result.ShouldContain("Username=postgres");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithoutPassword_ThrowsInvalidOperationException()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?> { ["Database:Host"] = "myhost" })
				.Build();

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(() =>
				ConnectionStringBuilder.BuildPostgresConnectionString(
					configuration));

		exception.Message.ShouldContain("DB_PASSWORD");
	}
}