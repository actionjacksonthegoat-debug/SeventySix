// <copyright file="StartupValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Api.Configuration;
using Shouldly;
using Xunit;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for <see cref="StartupValidator"/>.
/// </summary>
public sealed class StartupValidatorUnitTests
{
	private readonly ILogger Logger =
		Substitute.For<ILogger>();

	[Fact]
	public void ValidateConfiguration_Production_MissingSecrets_ThrowsInvalidOperationException()
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(new Dictionary<string, string?>())
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => StartupValidator.ValidateConfiguration(
					configuration,
					environment,
					Logger));

		exception.Message.ShouldContain("Configuration validation failed");
	}

	[Fact]
	public void ValidateConfiguration_Production_PlaceholderSecrets_ThrowsInvalidOperationException()
	{
		// Arrange
		Dictionary<string, string?> configValues =
			new()
			{
				["Jwt:SecretKey"] = "PLACEHOLDER_jwt_secret",
				["Database:Password"] = "realvalue",
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configValues)
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => StartupValidator.ValidateConfiguration(
					configuration,
					environment,
					Logger));

		exception.Message.ShouldContain("Placeholder values");
	}

	[Fact]
	public void ValidateConfiguration_Production_AllSecretsPresent_DoesNotThrow()
	{
		// Arrange
		Dictionary<string, string?> configValues =
			new()
			{
				["Jwt:SecretKey"] = "xK7mQ2pWvN8jR4tY6uH9bE3dF5gA1cZ0",
				["Database:Password"] = "realpassword",
				["Auth:OAuth:Providers:0:ClientId"] = "client-id",
				["Auth:OAuth:Providers:0:ClientSecret"] = "client-secret",
				["Email:SmtpUsername"] = "smtp-user",
				["Email:SmtpPassword"] = "smtp-pass",
				["Email:FromAddress"] = "test@example.com",
				["Altcha:HmacKeyBase64"] = "dGVzdGtleQ==",
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configValues)
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(Environments.Production);

		// Act & Assert
		Should.NotThrow(
			() => StartupValidator.ValidateConfiguration(
				configuration,
				environment,
				Logger));
	}

	[Theory]
	[InlineData("Development")]
	[InlineData("Test")]
	[InlineData("E2E")]
	public void ValidateConfiguration_NonProduction_MissingSecrets_LogsWarningAndDoesNotThrow(
		string environmentName)
	{
		// Arrange
		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(new Dictionary<string, string?>())
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(environmentName);

		// Act & Assert
		Should.NotThrow(
			() => StartupValidator.ValidateConfiguration(
				configuration,
				environment,
				Logger));

		Logger.Received().Log(
			LogLevel.Warning,
			Arg.Any<EventId>(),
			Arg.Any<object>(),
			Arg.Any<Exception?>(),
			Arg.Any<Func<object, Exception?, string>>());
	}

	[Theory]
	[InlineData("Development")]
	[InlineData("Test")]
	public void ValidateConfiguration_NonProduction_AllSecretsPresent_NoWarning(
		string environmentName)
	{
		// Arrange
		Dictionary<string, string?> configValues =
			new()
			{
				["Jwt:SecretKey"] = "xK7mQ2pWvN8jR4tY6uH9bE3dF5gA1cZ0",
				["Database:Password"] = "realpassword",
				["Auth:OAuth:Providers:0:ClientId"] = "client-id",
				["Auth:OAuth:Providers:0:ClientSecret"] = "client-secret",
				["Email:SmtpUsername"] = "smtp-user",
				["Email:SmtpPassword"] = "smtp-pass",
				["Email:FromAddress"] = "test@example.com",
				["Altcha:HmacKeyBase64"] = "dGVzdGtleQ==",
			};

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(configValues)
				.Build();

		IHostEnvironment environment =
			CreateEnvironment(environmentName);

		// Act
		StartupValidator.ValidateConfiguration(
			configuration,
			environment,
			Logger);

		// Assert - no warning logged
		Logger.DidNotReceive().Log(
			LogLevel.Warning,
			Arg.Any<EventId>(),
			Arg.Any<object>(),
			Arg.Any<Exception?>(),
			Arg.Any<Func<object, Exception?, string>>());
	}

	private static IHostEnvironment CreateEnvironment(string environmentName)
	{
		IHostEnvironment environment =
			Substitute.For<IHostEnvironment>();

		environment.EnvironmentName
			.Returns(environmentName);

		return environment;
	}
}
