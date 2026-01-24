// <copyright file="ThirdPartyApiLimitSettingsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;
using SeventySix.Shared.Enums;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Settings;

/// <summary>
/// Unit tests for ThirdPartyApiLimitSettings and related types.
/// Focus: LimitInterval enum handling, GetLimit(), GetLimitInterval() methods.
/// </summary>
public class ThirdPartyApiLimitSettingsTests
{
	#region ThirdPartyApiLimitSettings Tests

	[Fact]
	public void Constructor_SetsDefaultDailyLimitTo1000()
	{
		// Arrange & Act
		ThirdPartyApiLimitSettings settings =
			new();

		// Assert
		settings.DefaultDailyLimit.ShouldBe(1000);
	}

	[Fact]
	public void Constructor_SetsDefaultMonthlyLimitTo30000()
	{
		// Arrange & Act
		ThirdPartyApiLimitSettings settings =
			new();

		// Assert
		settings.DefaultMonthlyLimit.ShouldBe(30000);
	}

	[Fact]
	public void Constructor_SetsEnabledToTrue()
	{
		// Arrange & Act
		ThirdPartyApiLimitSettings settings =
			new();

		// Assert
		settings.Enabled.ShouldBeTrue();
	}

	[Fact]
	public void SectionName_IsThirdPartyApiLimits()
	{
		// Assert
		ThirdPartyApiLimitSettings.SECTION_NAME.ShouldBe("ThirdPartyApiLimits");
	}

	[Fact]
	public void GetLimit_WithExistingApiAndDailyLimit_ReturnsDailyLimit()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new()
			{
				DefaultDailyLimit = 1000,
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"TestApi",
							new ThirdPartyApiLimit
							{
								DailyLimit = 500,
								Enabled = true
							}
						}
					}
			};

		// Act
		int limit =
			settings.GetLimit("TestApi");

		// Assert
		limit.ShouldBe(500);
	}

	[Fact]
	public void GetLimit_WithExistingApiAndMonthlyLimit_ReturnsMonthlyLimit()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new()
			{
				DefaultMonthlyLimit = 10000,
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"MonthlyLimitApi",
							new ThirdPartyApiLimit
							{
								MonthlyLimit = 5000,
								Interval = LimitInterval.Monthly,
								Enabled = true
							}
						}
					}
			};

		// Act
		int limit =
			settings.GetLimit("MonthlyLimitApi");

		// Assert
		limit.ShouldBe(5000);
	}

	[Fact]
	public void GetLimit_WithNonExistingApi_ReturnsDefaultDailyLimit()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new()
			{
				DefaultDailyLimit = 1000,
				DefaultMonthlyLimit = 10000
			};

		// Act
		int limit =
			settings.GetLimit("UnknownApi");

		// Assert
		limit.ShouldBe(1000);
	}

	[Fact]
	public void GetLimit_WithDisabledApi_ReturnsConfiguredLimit()
	{
		// Arrange - disabled flag doesn't affect GetLimit, it returns configured value
		ThirdPartyApiLimitSettings settings =
			new()
			{
				DefaultDailyLimit = 1000,
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"DisabledApi",
							new ThirdPartyApiLimit
							{
								DailyLimit = 500,
								Enabled = false
							}
						}
					}
			};

		// Act
		int limit =
			settings.GetLimit("DisabledApi");

		// Assert - returns configured value, Enabled is checked elsewhere
		limit.ShouldBe(500);
	}

	[Fact]
	public void GetLimitInterval_WithExistingApiAndMonthlyInterval_ReturnsMonthly()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new()
			{
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"MonthlyApi",
							new ThirdPartyApiLimit
							{
								Interval = LimitInterval.Monthly,
								MonthlyLimit = 10000,
								Enabled = true
							}
						}
					}
			};

		// Act
		LimitInterval interval =
			settings.GetLimitInterval("MonthlyApi");

		// Assert
		interval.ShouldBe(LimitInterval.Monthly);
	}

	[Fact]
	public void GetLimitInterval_WithExistingApiAndDailyInterval_ReturnsDaily()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new()
			{
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"DailyApi",
							new ThirdPartyApiLimit
							{
								Interval = LimitInterval.Daily,
								DailyLimit = 500,
								Enabled = true
							}
						}
					}
			};

		// Act
		LimitInterval interval =
			settings.GetLimitInterval("DailyApi");

		// Assert
		interval.ShouldBe(LimitInterval.Daily);
	}

	[Fact]
	public void GetLimitInterval_WithNonExistingApi_ReturnsDaily()
	{
		// Arrange
		ThirdPartyApiLimitSettings settings =
			new();

		// Act
		LimitInterval interval =
			settings.GetLimitInterval("UnknownApi");

		// Assert
		interval.ShouldBe(LimitInterval.Daily);
	}

	[Fact]
	public void GetLimitInterval_WithDisabledApi_ReturnsConfiguredInterval()
	{
		// Arrange - disabled flag doesn't affect GetLimitInterval
		ThirdPartyApiLimitSettings settings =
			new()
			{
				Limits =
					new Dictionary<string, ThirdPartyApiLimit>
					{
						{
							"DisabledApi",
							new ThirdPartyApiLimit
							{
								Interval = LimitInterval.Monthly,
								Enabled = false
							}
						}
					}
			};

		// Act
		LimitInterval interval =
			settings.GetLimitInterval("DisabledApi");

		// Assert - returns configured value, Enabled is checked elsewhere
		interval.ShouldBe(LimitInterval.Monthly);
	}

	#endregion

	#region ThirdPartyApiLimit Tests

	[Fact]
	public void ThirdPartyApiLimit_DefaultInterval_IsDaily()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new();

		// Assert
		limit.Interval.ShouldBe(LimitInterval.Daily);
	}

	[Fact]
	public void ThirdPartyApiLimit_DefaultDailyLimit_IsNull()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new();

		// Assert
		limit.DailyLimit.ShouldBeNull();
	}

	[Fact]
	public void ThirdPartyApiLimit_DefaultMonthlyLimit_IsNull()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new();

		// Assert
		limit.MonthlyLimit.ShouldBeNull();
	}

	[Fact]
	public void ThirdPartyApiLimit_CanSetDailyLimit()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new()
			{
				DailyLimit = 500
			};

		// Assert
		limit.DailyLimit.ShouldBe(500);
	}

	[Fact]
	public void ThirdPartyApiLimit_CanSetMonthlyLimit()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new()
			{
				MonthlyLimit = 10000
			};

		// Assert
		limit.MonthlyLimit.ShouldBe(10000);
	}

	[Fact]
	public void ThirdPartyApiLimit_CanSetInterval()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new()
			{
				Interval = LimitInterval.Monthly
			};

		// Assert
		limit.Interval.ShouldBe(LimitInterval.Monthly);
	}

	[Fact]
	public void ThirdPartyApiLimit_DefaultEnabled_IsTrue()
	{
		// Arrange & Act
		ThirdPartyApiLimit limit =
			new();

		// Assert
		limit.Enabled.ShouldBeTrue();
	}

	#endregion

	#region LimitInterval Enum Tests

	[Fact]
	public void LimitInterval_DailyValue_IsZero()
	{
		// Assert
		((int)LimitInterval.Daily).ShouldBe(0);
	}

	[Fact]
	public void LimitInterval_MonthlyValue_IsOne()
	{
		// Assert
		((int)LimitInterval.Monthly).ShouldBe(1);
	}

	#endregion
}