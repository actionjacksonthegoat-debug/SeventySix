// <copyright file="ConnectionStringBuilderTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.Api.Configuration;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Exceptions;
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
	public void BuildPostgresConnectionString_MissingHost_ThrowsRequiredConfigurationException()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(
					new Dictionary<string, string?>
					{
						["Database:Port"] = "5432",
						["Database:Name"] = "mydb",
						["Database:User"] = "myuser",
						["Database:Password"] = "mypassword",
					})
				.Build();

		// Act & Assert
		RequiredConfigurationException exception =
			Should.Throw<RequiredConfigurationException>(() =>
				ConnectionStringBuilder.BuildPostgresConnectionString(
					configuration));

		exception.SettingName.ShouldBe(ConfigurationSectionConstants.Database.Host);
	}

	[Fact]
	public void BuildPostgresConnectionString_MissingPassword_ThrowsRequiredConfigurationException()
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
					})
				.Build();

		// Act & Assert
		RequiredConfigurationException exception =
			Should.Throw<RequiredConfigurationException>(() =>
				ConnectionStringBuilder.BuildPostgresConnectionString(
					configuration));

		exception.SettingName.ShouldBe(ConfigurationSectionConstants.Database.Password);
	}

	[Fact]
	public void BuildPostgresConnectionString_WithSslMode_DefaultsTrustServerCertificateFalse()
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
						["Database:SslMode"] = "Require",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("SSL Mode=Require");
		result.ShouldContain("Trust Server Certificate=false");
	}

	[Fact]
	public void BuildPostgresConnectionString_TrustServerCertificateTrue_AppendsTrueOverride()
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
						["Database:SslMode"] = "Require",
						["Database:TrustServerCertificate"] = "true",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("SSL Mode=Require");
		result.ShouldContain("Trust Server Certificate=true");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithoutSslMode_DoesNotAppendSslParameters()
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
		result.ShouldNotContain("SSL Mode");
		result.ShouldNotContain("Trust Server Certificate");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithSslCaCertificate_AppendsSslRootCert()
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
						["Database:SslMode"] = "VerifyFull",
						["Database:SslCaCertificate"] = "/tls/ca.crt",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("SSL Mode=VerifyFull");
		result.ShouldContain("Root Certificate=/tls/ca.crt");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithClientCert_AppendsClientCertPaths()
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
						["Database:SslMode"] = "VerifyFull",
						["Database:SslClientCertificate"] = "/tls/client.crt",
						["Database:SslClientKey"] = "/tls/client.key",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("SSL Certificate=/tls/client.crt");
		result.ShouldContain("SSL Key=/tls/client.key");
	}

	[Fact]
	public void BuildPostgresConnectionString_WithAllSslOptions_AppendsAllSslParameters()
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
						["Database:SslMode"] = "VerifyFull",
						["Database:SslCaCertificate"] = "/tls/ca.crt",
						["Database:SslClientCertificate"] = "/tls/client.crt",
						["Database:SslClientKey"] = "/tls/client.key",
					})
				.Build();

		// Act
		string result =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				configuration);

		// Assert
		result.ShouldContain("SSL Mode=VerifyFull");
		result.ShouldContain("Root Certificate=/tls/ca.crt");
		result.ShouldContain("SSL Certificate=/tls/client.crt");
		result.ShouldContain("SSL Key=/tls/client.key");
		result.ShouldContain("Trust Server Certificate=false");
	}
}