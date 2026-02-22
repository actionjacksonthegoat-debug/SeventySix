// <copyright file="MfaFeatureRequiredAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using SeventySix.Identity;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Returns 404 Not Found when MFA is disabled.
/// Apply at controller class level to gate all actions on <see cref="MfaSettings.Enabled"/>.
/// </summary>
public sealed class MfaFeatureRequiredAttribute : TypeFilterAttribute
{
	/// <summary>
	/// Initializes a new instance of <see cref="MfaFeatureRequiredAttribute"/>.
	/// </summary>
	public MfaFeatureRequiredAttribute()
		: base(typeof(MfaFeatureRequiredFilter)) { }
}

/// <summary>
/// Internal action filter that enforces the MFA feature gate.
/// </summary>
/// <param name="mfaSettings">
/// MFA settings injected by the DI container.
/// </param>
public sealed class MfaFeatureRequiredFilter(IOptions<MfaSettings> mfaSettings)
	: IActionFilter
{
	/// <inheritdoc/>
	public void OnActionExecuting(ActionExecutingContext context)
	{
		if (!mfaSettings.Value.Enabled)
		{
			context.Result = new NotFoundResult();
		}
	}

	/// <inheritdoc/>
	public void OnActionExecuted(ActionExecutedContext context) { }
}