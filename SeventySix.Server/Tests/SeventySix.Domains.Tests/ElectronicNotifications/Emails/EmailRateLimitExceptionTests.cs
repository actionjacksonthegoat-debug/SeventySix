// <copyright file="EmailRateLimitExceptionTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.ElectronicNotifications.Emails;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails;

/// <summary>
/// Unit tests for EmailRateLimitException.
/// </summary>
public class EmailRateLimitExceptionTests
{
	[Fact]
	public void Constructor_WithTimeAndQuota_SetsProperties()
	{
		// Arrange & Act
		EmailRateLimitException exception =
			new(TimeSpan.FromHours(12), 0);

		// Assert
		exception.TimeUntilReset.ShouldBe(TimeSpan.FromHours(12));
		exception.RemainingQuota.ShouldBe(0);
		exception.Message.ShouldContain("12:00:00");
	}
}