// <copyright file="LoggingCacheKeysUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Logging.Helpers;

/// <summary>
/// Unit tests for <see cref="SeventySix.Logging.LoggingCacheKeys"/>.
/// </summary>
public sealed class LoggingCacheKeysUnitTests
{
	/// <summary>
	/// Verifies CountByLevel generates correct key format.
	/// </summary>
	[Fact]
	public void CountByLevel_ValidLevel_ReturnsExpectedFormat()
	{
		// Arrange
		string logLevel = "Error";

		// Act
		string cacheKey =
			SeventySix.Logging.LoggingCacheKeys.CountByLevel(logLevel);

		// Assert
		cacheKey.ShouldBe("logging:count:error");
	}

	/// <summary>
	/// Verifies CountByLevel sanitizes special characters.
	/// </summary>
	[Fact]
	public void CountByLevel_SpecialCharacters_SanitizesKey()
	{
		// Arrange
		string logLevel = "Error:Level With Spaces";

		// Act
		string cacheKey =
			SeventySix.Logging.LoggingCacheKeys.CountByLevel(logLevel);

		// Assert
		cacheKey.ShouldBe("logging:count:error_level_with_spaces");
	}

	/// <summary>
	/// Verifies Statistics generates correct key format.
	/// </summary>
	[Fact]
	public void Statistics_ReturnsExpectedFormat()
	{
		// Act
		string cacheKey =
			SeventySix.Logging.LoggingCacheKeys.Statistics();

		// Assert
		cacheKey.ShouldBe("logging:statistics");
	}
}