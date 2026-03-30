// <copyright file="SerilogExtensionsUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using Serilog.Events;
using SeventySix.Api.Extensions;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Api.Tests.Logging;

/// <summary>
/// Unit tests for <see cref="SerilogExtensions.GetRequestLogLevel"/>.
/// </summary>
public sealed class SerilogExtensionsUnitTests
{
	[Fact]
	public void GetRequestLogLevel_AuthRefresh401_ReturnsDebug()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Auth.Refresh;
		httpContext.Response.StatusCode =
			StatusCodes.Status401Unauthorized;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Debug);
	}

	[Fact]
	public void GetRequestLogLevel_AuthLogin401_ReturnsWarning()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Auth.Login;
		httpContext.Response.StatusCode =
			StatusCodes.Status401Unauthorized;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Warning);
	}

	[Fact]
	public void GetRequestLogLevel_Users401_ReturnsWarning()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Users.Base;
		httpContext.Response.StatusCode =
			StatusCodes.Status401Unauthorized;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Warning);
	}

	[Fact]
	public void GetRequestLogLevel_Users200_ReturnsInformation()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Users.Base;
		httpContext.Response.StatusCode =
			StatusCodes.Status200OK;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Information);
	}

	[Fact]
	public void GetRequestLogLevel_ServerError500_ReturnsError()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Users.Base;
		httpContext.Response.StatusCode =
			StatusCodes.Status500InternalServerError;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Error);
	}

	[Fact]
	public void GetRequestLogLevel_WithException_ReturnsError()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Users.Base;
		httpContext.Response.StatusCode =
			StatusCodes.Status200OK;
		InvalidOperationException exception =
			new("test exception");

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				exception);

		// Assert
		result.ShouldBe(LogEventLevel.Error);
	}

	[Fact]
	public void GetRequestLogLevel_AuthRefreshCaseInsensitive_ReturnsDebug()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Path =
			ApiEndpoints.Auth.Refresh.ToUpperInvariant();
		httpContext.Response.StatusCode =
			StatusCodes.Status401Unauthorized;

		// Act
		LogEventLevel result =
			SerilogExtensions.GetRequestLogLevel(
				httpContext,
				0,
				null);

		// Assert
		result.ShouldBe(LogEventLevel.Debug);
	}
}