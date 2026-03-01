// <copyright file="ConfigController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Identity;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Configuration API endpoints for client-side feature detection.
/// </summary>
/// <param name="mfaSettings">
/// MFA feature settings.
/// </param>
/// <param name="totpSettings">
/// TOTP feature settings.
/// </param>
/// <param name="authSettings">
/// Authentication settings containing OAuth configuration.
/// </param>
/// <param name="jwtSettings">
/// JWT settings used to publish token timing information to the client.
/// </param>
/// <param name="altchaService">
/// ALTCHA service providing enabled state and challenge endpoint.
/// </param>
/// <param name="siteSettings">
/// Site-level settings containing the public contact email for legal pages.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/config")]
public sealed class ConfigController(
	IOptions<MfaSettings> mfaSettings,
	IOptions<TotpSettings> totpSettings,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings,
	IAltchaService altchaService,
	IOptions<SiteSettings> siteSettings) : ControllerBase
{
	/// <summary>
	/// Returns feature flag values for client-side conditional rendering.
	/// </summary>
	/// <returns>
	/// Current feature flag state.
	/// </returns>
	/// <response code="200">Feature flags returned.</response>
	[HttpGet("features")]
	[AllowAnonymous]
	[OutputCache(PolicyName = CachePolicyConstants.Features)]
	[ProducesResponseType(typeof(FeatureFlagsResponse), StatusCodes.Status200OK)]
	public ActionResult<FeatureFlagsResponse> GetFeatureFlags()
	{
		bool oAuthEnabled =
			authSettings.Value.OAuth.Enabled;

		IReadOnlyList<string> oAuthProviders =
			oAuthEnabled
				? authSettings.Value.OAuth.Providers
					.Select(provider => provider.Provider)
					.ToList()
				: [];

		return Ok(
			new FeatureFlagsResponse(
				MfaEnabled: mfaSettings.Value.Enabled,
				TotpEnabled: totpSettings.Value.Enabled,
				OAuthEnabled: oAuthEnabled,
				OAuthProviders: oAuthProviders,
				AltchaEnabled: altchaService.IsEnabled,
				TokenRefreshBufferSeconds: jwtSettings.Value.TokenRefreshBufferSeconds,
				SiteEmail: siteSettings.Value.Email));
	}
}