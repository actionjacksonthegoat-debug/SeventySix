// <copyright file="AltchaControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for AltchaController.
/// </summary>
/// <remarks>
/// Tests controller behavior and response shape.
/// Rate limiting tests are in AltchaControllerRateLimitTests.
/// </remarks>
public class AltchaControllerTests
{
	/// <summary>
	/// Tests that GET /altcha/challenge returns OK with all required challenge fields populated.
	/// </summary>
	[Fact]
	public void GetChallenge_ValidRequest_ReturnsOkWithExpectedChallengeFields()
	{
		// Arrange
		IAltchaService altchaService =
			IdentityMockFactory.CreateAltchaService();
		AltchaController controller =
			new(altchaService);

		// Act
		ActionResult<AltchaChallengeDto> result =
			controller.GetChallenge();

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();
		AltchaChallengeDto challenge =
			okResult.Value.ShouldBeOfType<AltchaChallengeDto>();

		challenge.Algorithm.ShouldNotBeNullOrWhiteSpace();
		challenge.Challenge.ShouldNotBeNullOrWhiteSpace();
		challenge.MaxNumber.ShouldBeGreaterThan(0);
		challenge.Salt.ShouldNotBeNullOrWhiteSpace();
		challenge.Signature.ShouldNotBeNullOrWhiteSpace();
	}

	/// <summary>
	/// Tests that each call to GET /altcha/challenge returns a unique challenge value.
	/// Prevents replay attacks by ensuring challenge uniqueness.
	/// </summary>
	[Fact]
	public void GetChallenge_CalledMultipleTimes_ReturnsUniqueChallenges()
	{
		// Arrange
		IAltchaService altchaService =
			IdentityMockFactory.CreateAltchaService();
		AltchaController controller =
			new(altchaService);

		// Act
		ActionResult<AltchaChallengeDto> firstResult =
			controller.GetChallenge();
		ActionResult<AltchaChallengeDto> secondResult =
			controller.GetChallenge();

		// Assert
		OkObjectResult firstOk =
			firstResult.Result.ShouldBeOfType<OkObjectResult>();
		AltchaChallengeDto firstChallenge =
			firstOk.Value.ShouldBeOfType<AltchaChallengeDto>();

		OkObjectResult secondOk =
			secondResult.Result.ShouldBeOfType<OkObjectResult>();
		AltchaChallengeDto secondChallenge =
			secondOk.Value.ShouldBeOfType<AltchaChallengeDto>();

		firstChallenge.Challenge.ShouldNotBe(secondChallenge.Challenge);
	}
}
