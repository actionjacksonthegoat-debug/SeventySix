// <copyright file="LogChartServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Moq;
using SeventySix.BusinessLogic.DTOs.LogCharts;
using SeventySix.BusinessLogic.DTOs.Logs;
using SeventySix.BusinessLogic.Entities;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Services;
using SeventySix.TestUtilities.Builders;

namespace SeventySix.BusinessLogic.Tests.Services;

/// <summary>
/// Unit tests for LogChartService.
/// </summary>
public class LogChartServiceTests
{
	private readonly Mock<ILogRepository> MockRepository;
	private readonly LogChartService Service;

	public LogChartServiceTests()
	{
		MockRepository = new Mock<ILogRepository>();
		Service = new LogChartService(MockRepository.Object);
	}

	[Fact]
	public async Task GetLogsByLevelAsync_ReturnsGroupedCountsAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			new LogBuilder().WithMessage("Info 1").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Info 2").WithTimestamp(now).Build(),
			LogBuilder.CreateWarning().WithMessage("Warning 1").WithTimestamp(now).Build(),
			LogBuilder.CreateError().WithMessage("Error 1").WithTimestamp(now).Build(),
			LogBuilder.CreateError().WithMessage("Error 2").WithTimestamp(now).Build(),
			LogBuilder.CreateError().WithMessage("Error 3").WithTimestamp(now).Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(logs);

		// Act
		LogsByLevelResponse result = await Service.GetLogsByLevelAsync(null, null, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(3, result.LogCounts.Count);
		Assert.Equal(2, result.LogCounts["Information"]);
		Assert.Equal(1, result.LogCounts["Warning"]);
		Assert.Equal(3, result.LogCounts["Error"]);
	}

	[Fact]
	public async Task GetLogsByHourAsync_ReturnsHourlyDataAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			new LogBuilder().WithMessage("Log 1").WithTimestamp(now.AddHours(-1)).Build(),
			new LogBuilder().WithMessage("Log 2").WithTimestamp(now.AddHours(-1).AddMinutes(15)).Build(),
			new LogBuilder().WithMessage("Log 3").WithTimestamp(now.AddMinutes(-30)).Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(logs);

		// Act
		LogsByHourResponse result = await Service.GetLogsByHourAsync(24, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.NotEmpty(result.HourlyData);
		Assert.All(result.HourlyData, data => Assert.True(data.Count >= 0));
	}

	[Fact]
	public async Task GetLogsBySourceAsync_ReturnsTopSourcesAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			new LogBuilder().WithMessage("Log 1").WithSourceContext("WeatherController").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Log 2").WithSourceContext("WeatherController").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Log 3").WithSourceContext("WeatherController").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Log 4").WithSourceContext("UserService").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Log 5").WithSourceContext("UserService").WithTimestamp(now).Build(),
			new LogBuilder().WithMessage("Log 6").WithSourceContext("ErrorQueue").WithTimestamp(now).Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				null,
				null,
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(logs);

		// Act
		LogsBySourceResponse result = await Service.GetLogsBySourceAsync(10, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(3, result.SourceCounts.Count);
		Assert.Equal(3, result.SourceCounts["WeatherController"]);
		Assert.Equal(2, result.SourceCounts["UserService"]);
		Assert.Equal(1, result.SourceCounts["ErrorQueue"]);
	}

	[Fact]
	public async Task GetRecentErrorsAsync_ReturnsRecentErrorsAndWarningsAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			LogBuilder.CreateError()
				.WithMessage("Test error 1")
				.WithSourceContext("Service1")
				.WithTimestamp(now.AddMinutes(-5))
				.Build(),
			LogBuilder.CreateWarning()
				.WithMessage("Test warning")
				.WithSourceContext("Service2")
				.WithTimestamp(now.AddMinutes(-3))
				.Build(),
		new LogBuilder()
			.WithLogLevel("Critical")
			.WithMessage("Test critical")
			.WithSourceContext("Service3")
			.WithTimestamp(now.AddMinutes(-1))
			.Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				null,
				null,
				null,
				null,
				0,
				It.IsAny<int>()))
			.ReturnsAsync(logs);

		// Act
		RecentErrorsResponse result = await Service.GetRecentErrorsAsync(50, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(3, result.Errors.Count);
		Assert.Equal("Critical", result.Errors[0].Level);
		Assert.Equal("Test critical", result.Errors[0].Message);
	}

	[Fact]
	public async Task GetLogsByLevelAsync_ReturnsEmptyDictionary_WhenNoLogsAsync()
	{
		// Arrange
		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(new List<Log>());

		// Act
		LogsByLevelResponse result = await Service.GetLogsByLevelAsync(null, null, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Empty(result.LogCounts);
	}

	[Theory]
	[InlineData("24h")]
	[InlineData("7d")]
	[InlineData("30d")]
	public async Task GetChartDataAsync_ReturnsDataForValidPeriodAsync(string period)
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			LogBuilder.CreateError().WithMessage("Error 1").WithTimestamp(now.AddHours(-2)).Build(),
			LogBuilder.CreateWarning().WithMessage("Warning 1").WithTimestamp(now.AddHours(-1)).Build(),
			new LogBuilder().WithLogLevel("Critical").WithMessage("Critical 1").WithTimestamp(now.AddMinutes(-30)).Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(logs);

		// Act
		LogChartDataResponse result = await Service.GetChartDataAsync(period, CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(period, result.Period);
		Assert.NotNull(result.DataPoints);
	}

	[Fact]
	public async Task GetChartDataAsync_GroupsLogsByTimeIntervalAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<Log> logs =
		[
			LogBuilder.CreateError().WithMessage("Error 1").WithTimestamp(now.AddHours(-2)).Build(),
			LogBuilder.CreateError().WithMessage("Error 2").WithTimestamp(now.AddHours(-2).AddMinutes(15)).Build(),
			LogBuilder.CreateWarning().WithMessage("Warning 1").WithTimestamp(now.AddHours(-1)).Build(),
			new LogBuilder().WithLogLevel("Critical").WithMessage("Critical 1").WithTimestamp(now.AddMinutes(-30)).Build(),
		];

		MockRepository.Setup(r => r.GetLogsAsync(
				null,
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				null,
				null,
				0,
				int.MaxValue))
			.ReturnsAsync(logs);

		// Act
		LogChartDataResponse result = await Service.GetChartDataAsync("24h", CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.NotEmpty(result.DataPoints);
		int totalErrors = result.DataPoints.Sum(dp => dp.ErrorCount);
		int totalWarnings = result.DataPoints.Sum(dp => dp.WarningCount);
		int totalFatals = result.DataPoints.Sum(dp => dp.FatalCount);
		Assert.Equal(2, totalErrors);
		Assert.Equal(1, totalWarnings);
		Assert.Equal(1, totalFatals);
	}

	[Fact]
	public async Task GetChartDataAsync_ThrowsArgumentException_ForInvalidPeriodAsync()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentException>(
			() => Service.GetChartDataAsync("invalid", CancellationToken.None));
	}
}