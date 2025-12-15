// <copyright file="LogCleanupSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Logging;
using Shouldly;

namespace SeventySix.Domains.Tests.Logging.Settings;

/// <summary>Unit tests for LogCleanupSettings record.</summary>
public class LogCleanupSettingsTests
{
	[Fact]
	public void Constructor_WithDefaults_HasCorrectValues()
	{
		// Arrange & Act
		LogCleanupSettings settings =
			new();

		// Assert
		settings.Enabled.ShouldBeTrue();
		settings.IntervalHours.ShouldBe(24);
		settings.RetentionDays.ShouldBe(7);
		settings.InitialDelayMinutes.ShouldBe(5);
		settings.LogDirectory.ShouldBe("logs");
		settings.LogFilePattern.ShouldBe("seventysix-*.txt");
	}

	[Fact]
	public void SectionName_HasCorrectValue()
	{
		// Assert
		LogCleanupSettings.SectionName.ShouldBe("Logging:Cleanup");
	}

	[Fact]
	public void Constructor_WithCustomValues_OverridesDefaults()
	{
		// Arrange & Act
		LogCleanupSettings settings =
			new()
			{
				Enabled = false,
				IntervalHours = 12,
				RetentionDays = 14,
				InitialDelayMinutes = 10,
				LogDirectory = "custom-logs",
				LogFilePattern = "app-*.log"
			};

		// Assert
		settings.Enabled.ShouldBeFalse();
		settings.IntervalHours.ShouldBe(12);
		settings.RetentionDays.ShouldBe(14);
		settings.InitialDelayMinutes.ShouldBe(10);
		settings.LogDirectory.ShouldBe("custom-logs");
		settings.LogFilePattern.ShouldBe("app-*.log");
	}
}