// <copyright file="OAuthFeatureRequiredAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using SeventySix.Identity;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Returns 404 Not Found when OAuth is disabled.
/// Apply at controller class level to gate all actions on <see cref="AuthSettings.OAuth"/> being enabled.
/// </summary>
public sealed class OAuthFeatureRequiredAttribute : TypeFilterAttribute
{
	/// <summary>
	/// Initializes a new instance of <see cref="OAuthFeatureRequiredAttribute"/>.
	/// </summary>
	public OAuthFeatureRequiredAttribute()
		: base(typeof(OAuthFeatureRequiredFilter)) { }
}

/// <summary>
/// Internal action filter that enforces the OAuth feature gate.
/// </summary>
/// <param name="authSettings">
/// Auth settings injected by the DI container.
/// </param>
public sealed class OAuthFeatureRequiredFilter(IOptions<AuthSettings> authSettings)
	: IActionFilter
{
	/// <inheritdoc/>
	public void OnActionExecuting(ActionExecutingContext context)
	{
		if (!authSettings.Value.OAuth.Enabled)
		{
			context.Result = new NotFoundResult();
		}
	}

	/// <inheritdoc/>
	public void OnActionExecuted(ActionExecutedContext context) { }
}