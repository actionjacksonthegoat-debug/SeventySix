// <copyright file="BreachedPasswordServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="BreachedPasswordService"/>.
/// Tests breach checking logic using HaveIBeenPwned k-Anonymity API.
/// Follows 80/20 rule: tests critical paths and edge cases only.
/// </summary>
public sealed class BreachedPasswordServiceUnitTests
{
	private readonly IHttpClientFactory HttpClientFactory;
	private readonly IOptions<AuthSettings> AuthSettings;
	private readonly ILogger<BreachedPasswordService> Logger;

	public BreachedPasswordServiceUnitTests()
	{
		HttpClientFactory =
			Substitute.For<IHttpClientFactory>();
		Logger =
			Substitute.For<ILogger<BreachedPasswordService>>();

		// Default auth settings with breach checking enabled
		AuthSettings =
			Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = true,
						MinBreachCount = 1,
						BlockBreachedPasswords = true,
						ApiTimeoutMs = 3000,
					},
				});
	}

	/// <summary>
	/// Verifies that when breach checking is disabled, the service returns NotBreached immediately.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_Disabled_ReturnsSuccessWithoutApiCallAsync()
	{
		// Arrange
		IOptions<AuthSettings> disabledSettings =
			Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = false,
					},
				});

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				disabledSettings,
				Logger);

		// Act
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"anypassword",
				CancellationToken.None);

		// Assert
		result.CheckSucceeded.ShouldBeTrue();
		result.IsBreached.ShouldBeFalse();
		result.BreachCount.ShouldBe(0);

		// Verify no HTTP calls were made
		HttpClientFactory
			.DidNotReceive()
			.CreateClient(Arg.Any<string>());
	}

	/// <summary>
	/// Verifies that a password found in breaches returns IsBreached=true with the correct count.
	/// Uses mocked HIBP API response format.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_BreachedPassword_ReturnsIsBreachedTrueAsync()
	{
		// Arrange
		// "password" SHA-1 = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
		// Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
		string hibpResponse =
			"0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n" +
			"1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\r\n" + // This is "password"
			"011053FD0102E94D6AE2F8B83D76FAF94F6:72\r\n";

		MockHttpClient mockClient =
			new(
				HttpStatusCode.OK,
				hibpResponse);

		HttpClientFactory
			.CreateClient(BreachedPasswordService.HttpClientName)
			.Returns(mockClient.Client);

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				AuthSettings,
				Logger);

		// Act
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"password",
				CancellationToken.None);

		// Assert
		result.CheckSucceeded.ShouldBeTrue();
		result.IsBreached.ShouldBeTrue();
		result.BreachCount.ShouldBe(3861493);
	}

	/// <summary>
	/// Verifies that a safe password (not in breaches) returns IsBreached=false.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_SafePassword_ReturnsIsBreachedFalseAsync()
	{
		// Arrange - Response contains hashes but not our password's hash suffix
		string hibpResponse =
			"0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n" +
			"011053FD0102E94D6AE2F8B83D76FAF94F6:72\r\n" +
			"021FB596DB81E6D02BF51D4C861A8AF8E2:3\r\n";

		MockHttpClient mockClient =
			new(
				HttpStatusCode.OK,
				hibpResponse);

		HttpClientFactory
			.CreateClient(BreachedPasswordService.HttpClientName)
			.Returns(mockClient.Client);

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				AuthSettings,
				Logger);

		// Act - Use a unique password that won't match any hash suffix in the response
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"MyUniqueSecureP@ssw0rd!2024",
				CancellationToken.None);

		// Assert
		result.CheckSucceeded.ShouldBeTrue();
		result.IsBreached.ShouldBeFalse();
		result.BreachCount.ShouldBe(0);
	}

	/// <summary>
	/// Verifies graceful degradation when API times out.
	/// The service should fail open (allow password) when API is unavailable.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_ApiTimeout_ReturnsCheckSucceededFalseAsync()
	{
		// Arrange
		MockHttpClient mockClient =
			MockHttpClient.CreateTimeout();

		HttpClientFactory
			.CreateClient(BreachedPasswordService.HttpClientName)
			.Returns(mockClient.Client);

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				AuthSettings,
				Logger);

		// Act
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"anypassword",
				CancellationToken.None);

		// Assert - Graceful degradation: allow password when API fails
		result.CheckSucceeded.ShouldBeFalse();
		result.IsBreached.ShouldBeFalse();
		result.BreachCount.ShouldBe(0);
	}

	/// <summary>
	/// Verifies graceful degradation when API returns an error response.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_ApiError_ReturnsCheckSucceededFalseAsync()
	{
		// Arrange
		MockHttpClient mockClient =
			new(
				HttpStatusCode.ServiceUnavailable,
				"Service temporarily unavailable");

		HttpClientFactory
			.CreateClient(BreachedPasswordService.HttpClientName)
			.Returns(mockClient.Client);

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				AuthSettings,
				Logger);

		// Act
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"anypassword",
				CancellationToken.None);

		// Assert - Graceful degradation
		result.CheckSucceeded.ShouldBeFalse();
		result.IsBreached.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that MinBreachCount threshold is respected.
	/// Password with breach count below threshold should not be flagged.
	/// </summary>
	[Fact]
	public async Task CheckPasswordAsync_BelowMinBreachCount_ReturnsIsBreachedFalseAsync()
	{
		// Arrange
		IOptions<AuthSettings> highThresholdSettings =
			Options.Create(
				new AuthSettings
				{
					BreachedPassword = new BreachedPasswordSettings
					{
						Enabled = true,
						MinBreachCount = 100, // High threshold
						BlockBreachedPasswords = true,
						ApiTimeoutMs = 3000,
					},
				});

		// Response shows password breached only 50 times (below 100 threshold)
		// "test123" SHA-1 = 7288EDD0FC3FFCBE93A0CF06E3568E28521687BC
		// Prefix: 7288E, Suffix: DD0FC3FFCBE93A0CF06E3568E28521687BC
		string hibpResponse =
			"DD0FC3FFCBE93A0CF06E3568E28521687BC:50\r\n";

		MockHttpClient mockClient =
			new(
				HttpStatusCode.OK,
				hibpResponse);

		HttpClientFactory
			.CreateClient(BreachedPasswordService.HttpClientName)
			.Returns(mockClient.Client);

		BreachedPasswordService service =
			new(
				HttpClientFactory,
				highThresholdSettings,
				Logger);

		// Act
		BreachCheckResult result =
			await service.CheckPasswordAsync(
				"test123",
				CancellationToken.None);

		// Assert - Below threshold, so not considered breached
		result.CheckSucceeded.ShouldBeTrue();
		result.IsBreached.ShouldBeFalse();
		result.BreachCount.ShouldBe(0);
	}

	/// <summary>
	/// Helper class for mocking HttpClient responses.
	/// </summary>
	private sealed class MockHttpClient
	{
		public HttpClient Client { get; }
		private readonly MockHttpMessageHandler Handler;

		public MockHttpClient(
			HttpStatusCode statusCode,
			string content)
		{
			Handler =
				new MockHttpMessageHandler(
					statusCode,
					content);
			Client =
				new HttpClient(Handler);
		}

		public static MockHttpClient CreateTimeout()
		{
			MockHttpMessageHandler handler =
				new(
					shouldTimeout: true);
			return new MockHttpClient(handler);
		}

		private MockHttpClient(MockHttpMessageHandler handler)
		{
			Handler = handler;
			Client =
				new HttpClient(Handler);
		}
	}

	/// <summary>
	/// Mock HTTP message handler for testing.
	/// </summary>
	private sealed class MockHttpMessageHandler : HttpMessageHandler
	{
		private readonly HttpStatusCode StatusCode;
		private readonly string Content;
		private readonly bool ShouldTimeout;

		public MockHttpMessageHandler(
			HttpStatusCode statusCode,
			string content)
		{
			StatusCode = statusCode;
			Content = content;
			ShouldTimeout = false;
		}

		public MockHttpMessageHandler(bool shouldTimeout)
		{
			ShouldTimeout = shouldTimeout;
			StatusCode = HttpStatusCode.OK;
			Content = string.Empty;
		}

		protected override async Task<HttpResponseMessage> SendAsync(
			HttpRequestMessage request,
			CancellationToken cancellationToken)
		{
			if (ShouldTimeout)
			{
				throw new TaskCanceledException(
					"Request timed out",
					new TimeoutException());
			}

			await Task.Yield();
			return new HttpResponseMessage(StatusCode)
			{
				Content = new StringContent(Content),
			};
		}
	}
}