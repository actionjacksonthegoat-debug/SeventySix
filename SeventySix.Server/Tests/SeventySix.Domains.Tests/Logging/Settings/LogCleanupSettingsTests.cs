// <copyright file="LogCleanupSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Settings;

/// <summary>Unit tests for LogCleanupSettings record.</summary>
public sealed class LogCleanupSettingsTests
{
	[Fact]
	public void SectionName_HasCorrectValue()
	{
		// Assert
		LogCleanupSettings.SectionName.ShouldBe("Logging:Cleanup");
	}

	[Fact]
	public void Constructor_WithCustomValues_SetsAllProperties()
	{
		// Arrange & Act
		LogCleanupSettings settings =
			new()
			{
				Enabled = true,
				IntervalHours = 12,
				RetentionDays = 14,
				InitialDelayMinutes = 10,
				LogDirectory = "custom-logs",
				LogFilePattern = "app-*.log",
			};

		// Assert
		settings.Enabled.ShouldBeTrue();
		settings.IntervalHours.ShouldBe(12);
		settings.RetentionDays.ShouldBe(14);
		settings.InitialDelayMinutes.ShouldBe(10);
		settings.LogDirectory.ShouldBe("custom-logs");
		settings.LogFilePattern.ShouldBe("app-*.log");
	}
}