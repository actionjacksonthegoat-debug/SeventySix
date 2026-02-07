// <copyright file="RefreshTokenCleanupSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity.Settings;
using Shouldly;

namespace SeventySix.Identity.Tests.Settings;

/// <summary>
/// Unit tests for RefreshTokenCleanupSettings.
/// Focus: Configuration binding and section name.
/// </summary>
public class RefreshTokenCleanupSettingsTests
{
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