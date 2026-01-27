// <copyright file="AltchaController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SeventySix.Api.Configuration;
using SeventySix.Identity;

namespace SeventySix.Api.Controllers;

/// <summary>
/// ALTCHA challenge API endpoints.
/// Provides Proof-of-Work captcha challenges for form protection.
/// </summary>
/// <param name="altchaService">
/// Service for ALTCHA challenge generation.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/altcha")]
public class AltchaController(
	IAltchaService altchaService) : ControllerBase
{
	/// <summary>
	/// Generates a new ALTCHA challenge for client-side solving.
	/// </summary>
	/// <returns>
	/// Challenge parameters for the ALTCHA widget.
	/// </returns>
	/// <response code="200">Challenge generated successfully.</response>
	/// <response code="429">Rate limit exceeded.</response>
	[HttpGet("challenge")]
	[EnableRateLimiting(RateLimitPolicyConstants.AltchaChallenge)]
	[ProducesResponseType(typeof(AltchaChallengeDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	public ActionResult<AltchaChallengeDto> GetChallenge()
	{
		AltchaChallengeDto challenge =
			altchaService.GenerateChallenge();

		return Ok(challenge);
	}
}