// <copyright file="TotpFeatureRequiredAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using SeventySix.Identity;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Returns 404 Not Found when TOTP is disabled.
/// Apply at action level to gate individual actions on <see cref="TotpSettings.Enabled"/>.
/// </summary>
public sealed class TotpFeatureRequiredAttribute : TypeFilterAttribute
{
	/// <summary>
	/// Initializes a new instance of <see cref="TotpFeatureRequiredAttribute"/>.
	/// </summary>
	public TotpFeatureRequiredAttribute()
		: base(typeof(TotpFeatureRequiredFilter)) { }
}

/// <summary>
/// Internal action filter that enforces the TOTP feature gate.
/// </summary>
/// <param name="totpSettings">
/// TOTP settings injected by the DI container.
/// </param>
public sealed class TotpFeatureRequiredFilter(IOptions<TotpSettings> totpSettings)
	: IActionFilter
{
	/// <inheritdoc/>
	public void OnActionExecuting(ActionExecutingContext context)
	{
		if (!totpSettings.Value.Enabled)
		{
			context.Result = new NotFoundResult();
		}
	}

	/// <inheritdoc/>
	public void OnActionExecuted(ActionExecutedContext context) { }
}