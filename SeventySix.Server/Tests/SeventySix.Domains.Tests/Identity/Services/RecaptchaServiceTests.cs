// <copyright file="RecaptchaServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Shared;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Enums;
using SeventySix.Shared.Interfaces;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for RecaptchaService.
/// Follows 80/20 rule - tests critical paths only:
/// - Bypass when disabled
/// - Success validation
/// - Score threshold validation
/// - Action mismatch
/// - Rate limit exceeded
/// </summary>
public class RecaptchaServiceTests
{
	private readonly IRateLimitingService RateLimitingService;
	private readonly ILogger<RecaptchaService> Logger;

	private static readonly RecaptchaSettings DefaultSettings =
		new()
		{
			Enabled = true,
			SiteKey = "test-site-key",
			SecretKey = "test-secret-key",
			MinimumScore = 0.5,
			VerifyUrl = "https://www.google.com/recaptcha/api/siteverify"
		};

	private static readonly ThirdPartyApiLimitSettings DefaultLimitSettings =
		new()
		{
			Enabled = true,
			DefaultDailyLimit = 1000,
			DefaultMonthlyLimit = 10000,
			Limits =
				new Dictionary<string, ThirdPartyApiLimit>
				{
					{
						ExternalApiConstants.GoogleRecaptcha,
						new ThirdPartyApiLimit
						{
							Interval = LimitInterval.Monthly,
							MonthlyLimit = 10000,
							Enabled = true
						}
					}
				}
		};

	public RecaptchaServiceTests()
	{
		RateLimitingService =
			Substitute.For<IRateLimitingService>();
		Logger =
			Substitute.For<ILogger<RecaptchaService>>();

		// Default setup: allow rate limiting
		RateLimitingService
			.CanMakeRequestAsync(
				ExternalApiConstants.GoogleRecaptcha,
				Arg.Any<LimitInterval>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		RateLimitingService
			.TryIncrementRequestCountAsync(
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(true);
	}

	private RecaptchaService CreateSut(
		HttpClient httpClient,
		RecaptchaSettings? settings = null,
		ThirdPartyApiLimitSettings? limitSettings = null)
	{
		IOptions<RecaptchaSettings> recaptchaOptions =
			Options.Create(settings ?? DefaultSettings);

		IOptions<ThirdPartyApiLimitSettings> limitOptions =
			Options.Create(limitSettings ?? DefaultLimitSettings);

		return new RecaptchaService(
			httpClient,
			RateLimitingService,
			recaptchaOptions,
			limitOptions,
			Logger);
	}

	#region IsEnabled Tests

	[Fact]
	public void IsEnabled_WhenSettingsEnabled_ReturnsTrue()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaService sut =
			CreateSut(httpClient);

		// Act & Assert
		sut.IsEnabled.ShouldBeTrue();
	}

	[Fact]
	public void IsEnabled_WhenSettingsDisabled_ReturnsFalse()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaSettings disabledSettings =
			new()
			{
				Enabled = false,
				SiteKey = "test",
				SecretKey = "test",
				MinimumScore = 0.5
			};

		RecaptchaService sut =
			CreateSut(httpClient, disabledSettings);

		// Act & Assert
		sut.IsEnabled.ShouldBeFalse();
	}

	#endregion

	#region ValidateAsync - Bypass Tests

	[Fact]
	public async Task ValidateAsync_WhenDisabled_ReturnsBypassedAsync()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaSettings disabledSettings =
			new()
			{
				Enabled = false,
				SiteKey = "test",
				SecretKey = "test",
				MinimumScore = 0.5
			};

		RecaptchaService sut =
			CreateSut(httpClient, disabledSettings);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"any-token",
				"login");

		// Assert
		result.Success.ShouldBeTrue();
		result.WasBypassed.ShouldBeTrue();
		result.Score.ShouldBe(0);
	}

	[Fact]
	public async Task ValidateAsync_WhenDisabled_DoesNotCallGoogleApiAsync()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaSettings disabledSettings =
			new()
			{
				Enabled = false,
				SiteKey = "test",
				SecretKey = "test",
				MinimumScore = 0.5
			};

		RecaptchaService sut =
			CreateSut(httpClient, disabledSettings);

		// Act
		await sut.ValidateAsync(
			"any-token",
			"login");

		// Assert - rate limiting never called means Google API never called
		await RateLimitingService
			.DidNotReceive()
			.CanMakeRequestAsync(
				Arg.Any<string>(),
				Arg.Any<LimitInterval>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region ValidateAsync - Token Validation Tests

	[Fact]
	public async Task ValidateAsync_WithEmptyToken_ReturnsFailureAsync()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				string.Empty,
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("missing-input-response");
	}

	[Fact]
	public async Task ValidateAsync_WithNullToken_ReturnsFailureAsync()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				null!,
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("missing-input-response");
	}

	#endregion

	#region ValidateAsync - Rate Limit Tests

	[Fact]
	public async Task ValidateAsync_WhenRateLimitExceeded_ReturnsFailureAsync()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaService sut =
			CreateSut(httpClient);

		RateLimitingService
			.CanMakeRequestAsync(
				ExternalApiConstants.GoogleRecaptcha,
				Arg.Any<LimitInterval>(),
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("rate-limit-exceeded");
	}

	[Fact]
	public async Task ValidateAsync_UsesMonthlyIntervalForRateLimit_Async()
	{
		// Arrange
		using HttpClient httpClient = new();
		RecaptchaService sut =
			CreateSut(httpClient);

		// This will fail due to missing http mock, but we want to check the call
		try
		{
			await sut.ValidateAsync(
				"valid-token",
				"login");
		}
		catch (InvalidOperationException)
		{
			// Expected - no BaseAddress set
		}

		// Assert - verify correct interval was used
		await RateLimitingService
			.Received()
			.CanMakeRequestAsync(
				ExternalApiConstants.GoogleRecaptcha,
				LimitInterval.Monthly,
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region ValidateAsync - Success Tests

	[Fact]
	public async Task ValidateAsync_WithValidResponse_ReturnsSuccessAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.9,
				Action = "login"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeTrue();
		result.WasBypassed.ShouldBeFalse();
		result.Score.ShouldBe(0.9);
		result.Action.ShouldBe("login");
	}

	[Fact]
	public async Task ValidateAsync_IncrementsRateLimit_OnSuccessfulCallAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.9,
				Action = "login"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		await sut.ValidateAsync(
			"valid-token",
			"login");

		// Assert
		await RateLimitingService
			.Received(1)
			.TryIncrementRequestCountAsync(
				ExternalApiConstants.GoogleRecaptcha,
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region ValidateAsync - Score Threshold Tests

	[Fact]
	public async Task ValidateAsync_WithScoreBelowThreshold_ReturnsFailureAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.3, // Below 0.5 threshold
				Action = "login"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("score-below-threshold");
	}

	[Fact]
	public async Task ValidateAsync_WithScoreAtThreshold_ReturnsSuccessAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.5, // Exactly at threshold
				Action = "login"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeTrue();
	}

	#endregion

	#region ValidateAsync - Action Mismatch Tests

	[Fact]
	public async Task ValidateAsync_WithActionMismatch_ReturnsFailureAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.9, // Different from expected
				Action = "register"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("action-mismatch");
	}

	[Fact]
	public async Task ValidateAsync_WithActionCaseInsensitive_ReturnsSuccessAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = true,
				Score = 0.9, // Different case
				Action = "LOGIN"
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"valid-token",
				"login");

		// Assert
		result.Success.ShouldBeTrue();
	}

	#endregion

	#region ValidateAsync - Google API Error Tests

	[Fact]
	public async Task ValidateAsync_WhenGoogleReturnsFalse_ReturnsFailureAsync()
	{
		// Arrange
		RecaptchaVerifyResponse response =
			new()
			{
				Success = false,
				ErrorCodes =
					["invalid-input-secret", "invalid-input-response"]
			};

		using MockHttpMessageHandler mockHandler =
			new(response);
		using HttpClient httpClient =
			new(mockHandler)
			{
				BaseAddress =
					new Uri("https://www.google.com")
			};

		RecaptchaService sut =
			CreateSut(httpClient);

		// Act
		RecaptchaValidationResult result =
			await sut.ValidateAsync(
				"invalid-token",
				"login");

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCodes.ShouldContain("invalid-input-secret");
		result.ErrorCodes.ShouldContain("invalid-input-response");
	}

	#endregion

	/// <summary>
	/// Mock HTTP handler for testing HTTP client calls.
	/// </summary>
	private sealed class MockHttpMessageHandler : HttpMessageHandler
	{
		private readonly RecaptchaVerifyResponse Response;

		public MockHttpMessageHandler(RecaptchaVerifyResponse response)
		{
			Response = response;
		}

		protected override Task<HttpResponseMessage> SendAsync(
			HttpRequestMessage request,
			CancellationToken cancellationToken)
		{
			JsonSerializerOptions options =
				new()
				{
					PropertyNamingPolicy =
						JsonNamingPolicy.CamelCase
				};

			string json =
				JsonSerializer.Serialize(
					Response,
					options);

			return Task.FromResult(
				new HttpResponseMessage(HttpStatusCode.OK)
				{
					Content =
						new StringContent(
							json,
							System.Text.Encoding.UTF8,
							"application/json")
				});
		}
	}
}