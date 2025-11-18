// <copyright file="LogChartServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Moq;
using SeventySix.BusinessLogic.Services;
using SeventySix.Core.DTOs.LogCharts;
using SeventySix.Core.DTOs.Logs;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;

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
		List<Log> logs =
		[
			new Log { LogLevel = "Information", Message = "Info 1", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Info 2", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Warning", Message = "Warning 1", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Error", Message = "Error 1", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Error", Message = "Error 2", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Error", Message = "Error 3", Timestamp = DateTime.UtcNow },
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
			new Log { LogLevel = "Information", Message = "Log 1", Timestamp = now.AddHours(-1) },
			new Log { LogLevel = "Information", Message = "Log 2", Timestamp = now.AddHours(-1).AddMinutes(15) },
			new Log { LogLevel = "Information", Message = "Log 3", Timestamp = now.AddMinutes(-30) },
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
		List<Log> logs =
		[
			new Log { LogLevel = "Information", Message = "Log 1", SourceContext = "WeatherController", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Log 2", SourceContext = "WeatherController", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Log 3", SourceContext = "WeatherController", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Log 4", SourceContext = "UserService", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Log 5", SourceContext = "UserService", Timestamp = DateTime.UtcNow },
			new Log { LogLevel = "Information", Message = "Log 6", SourceContext = "ErrorQueue", Timestamp = DateTime.UtcNow },
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
			new Log
			{
				LogLevel = "Error",
				Message = "Test error 1",
				SourceContext = "Service1",
				Timestamp = now.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Test warning",
				SourceContext = "Service2",
				Timestamp = now.AddMinutes(-3),
			},
			new Log
			{
				LogLevel = "Critical",
				Message = "Test critical",
				SourceContext = "Service3",
				Timestamp = now.AddMinutes(-1),
			},
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
			new Log { LogLevel = "Error", Message = "Error 1", Timestamp = now.AddHours(-2) },
			new Log { LogLevel = "Warning", Message = "Warning 1", Timestamp = now.AddHours(-1) },
			new Log { LogLevel = "Critical", Message = "Critical 1", Timestamp = now.AddMinutes(-30) },
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
			new Log { LogLevel = "Error", Message = "Error 1", Timestamp = now.AddHours(-2) },
			new Log { LogLevel = "Error", Message = "Error 2", Timestamp = now.AddHours(-2).AddMinutes(15) },
			new Log { LogLevel = "Warning", Message = "Warning 1", Timestamp = now.AddHours(-1) },
			new Log { LogLevel = "Critical", Message = "Critical 1", Timestamp = now.AddMinutes(-30) },
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