// <copyright file="RefreshTokenCleanupSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity.Settings;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Settings;

/// <summary>
/// Unit tests for RefreshTokenCleanupSettings.
/// Focus: Default values and configuration binding.
/// </summary>
public class RefreshTokenCleanupSettingsTests
{
	[Fact]
	public void Constructor_SetsDefaultIntervalHours_To24()
	{
		// Arrange & Act
		RefreshTokenCleanupSettings settings = new();

		// Assert
		settings.IntervalHours.ShouldBe(24);
	}

	[Fact]
	public void Constructor_SetsDefaultRetentionDays_To7()
	{
		// Arrange & Act
		RefreshTokenCleanupSettings settings = new();

		// Assert
		settings.RetentionDays.ShouldBe(7);
	}

	[Fact]
	public void SectionName_IsRefreshTokenCleanup()
	{
		// Assert
		RefreshTokenCleanupSettings.SectionName.ShouldBe("RefreshTokenCleanup");
	}

	[Fact]
	public void IntervalHours_CanBeSet()
	{
		// Arrange & Act
		RefreshTokenCleanupSettings settings =
			new() { IntervalHours = 12 };

		// Assert
		settings.IntervalHours.ShouldBe(12);
	}

	[Fact]
	public void RetentionDays_CanBeSet()
	{
		// Arrange & Act
		RefreshTokenCleanupSettings settings =
			new() { RetentionDays = 30 };

		// Assert
		settings.RetentionDays.ShouldBe(30);
	}
}
