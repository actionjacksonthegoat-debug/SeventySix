// <copyright file="ClientInfoServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="ClientInfoService"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule - tests critical paths:
/// - IP extraction from HttpContext
/// - User agent extraction and truncation
/// - Null HttpContext handling
/// </remarks>
public sealed class ClientInfoServiceUnitTests
{
	private readonly IHttpContextAccessor HttpContextAccessor;
	private readonly ClientInfoService ServiceUnderTest;

	/// <summary>
	/// Initializes a new instance of the <see cref="ClientInfoServiceUnitTests"/> class.
	/// </summary>
	public ClientInfoServiceUnitTests()
	{
		HttpContextAccessor =
			Substitute.For<IHttpContextAccessor>();

		ServiceUnderTest =
			new ClientInfoService(HttpContextAccessor);
	}

	/// <summary>
	/// Verifies that ExtractClientIp returns null when HttpContext is null.
	/// </summary>
	[Fact]
	public void ExtractClientIp_WhenHttpContextNull_ReturnsNull()
	{
		// Arrange
		HttpContextAccessor.HttpContext.Returns(default(HttpContext?));

		// Act
		string? result =
			ServiceUnderTest.ExtractClientIp();

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that ExtractClientIp returns the remote IP address.
	/// </summary>
	[Fact]
	public void ExtractClientIp_WithValidContext_ReturnsRemoteIpAddress()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Connection.RemoteIpAddress =
			IPAddress.Parse("203.0.113.42");

		HttpContextAccessor.HttpContext.Returns(httpContext);

		// Act
		string? result =
			ServiceUnderTest.ExtractClientIp();

		// Assert
		result.ShouldBe("203.0.113.42");
	}

	/// <summary>
	/// Verifies that ExtractUserAgent returns null when HttpContext is null.
	/// </summary>
	[Fact]
	public void ExtractUserAgent_WhenHttpContextNull_ReturnsNull()
	{
		// Arrange
		HttpContextAccessor.HttpContext.Returns(default(HttpContext?));

		// Act
		string? result =
			ServiceUnderTest.ExtractUserAgent();

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that ExtractUserAgent returns the user agent header value.
	/// </summary>
	[Fact]
	public void ExtractUserAgent_WithValidHeader_ReturnsUserAgent()
	{
		// Arrange
		const string ExpectedUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Test Browser";

		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Headers.UserAgent =
			ExpectedUserAgent;

		HttpContextAccessor.HttpContext.Returns(httpContext);

		// Act
		string? result =
			ServiceUnderTest.ExtractUserAgent();

		// Assert
		result.ShouldBe(ExpectedUserAgent);
	}

	/// <summary>
	/// Verifies that ExtractUserAgent truncates long user agents to 500 characters.
	/// </summary>
	[Fact]
	public void ExtractUserAgent_WithLongUserAgent_TruncatesTo500Characters()
	{
		// Arrange
		string longUserAgent =
			new('x', 600);

		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Headers.UserAgent =
			longUserAgent;

		HttpContextAccessor.HttpContext.Returns(httpContext);

		// Act
		string? result =
			ServiceUnderTest.ExtractUserAgent();

		// Assert
		result.ShouldNotBeNull();
		result.Length.ShouldBe(500);
	}

	/// <summary>
	/// Verifies that ExtractUserAgent returns null for empty user agent.
	/// </summary>
	[Fact]
	public void ExtractUserAgent_WhenEmpty_ReturnsNull()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Headers.UserAgent =
			string.Empty;

		HttpContextAccessor.HttpContext.Returns(httpContext);

		// Act
		string? result =
			ServiceUnderTest.ExtractUserAgent();

		// Assert
		result.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that ExtractUserAgent returns null for whitespace-only user agent.
	/// </summary>
	[Fact]
	public void ExtractUserAgent_WhenWhitespaceOnly_ReturnsNull()
	{
		// Arrange
		DefaultHttpContext httpContext =
			new();
		httpContext.Request.Headers.UserAgent =
			"   ";

		HttpContextAccessor.HttpContext.Returns(httpContext);

		// Act
		string? result =
			ServiceUnderTest.ExtractUserAgent();

		// Assert
		result.ShouldBeNull();
	}
}