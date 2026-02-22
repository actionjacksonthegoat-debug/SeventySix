// <copyright file="RequiresPasswordChangeFilter.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SeventySix.Api.Attributes;
using SeventySix.Identity;

namespace SeventySix.Api.Filters;

/// <summary>
/// Global action filter that returns 403 Forbidden when the authenticated user
/// has a pending required password change and the action is not exempted
/// via <see cref="AllowWithPendingPasswordChangeAttribute"/>.
/// </summary>
/// <remarks>
/// The filter reads the <c>requires_password_change</c> claim from the JWT,
/// which is set during token generation. Only endpoints decorated with
/// <see cref="AuthorizeAttribute"/> are subject to this check; public endpoints
/// are never blocked.
/// </remarks>
public sealed class RequiresPasswordChangeFilter : IAsyncActionFilter
{
	/// <summary>
	/// Inspects the current user's password change requirement before action execution.
	/// </summary>
	///
	/// <param name="context">
	/// The action executing context.
	/// </param>
	///
	/// <param name="next">
	/// The delegate to invoke the next filter or action.
	/// </param>
	public async Task OnActionExecutionAsync(
		ActionExecutingContext context,
		ActionExecutionDelegate next)
	{
		bool isAuthenticated =
			context.HttpContext.User.Identity?.IsAuthenticated ?? false;

		if (!isAuthenticated)
		{
			await next();
			return;
		}

		bool requiresAuthorization =
			context.ActionDescriptor.EndpointMetadata
				.OfType<AuthorizeAttribute>()
				.Any();

		bool allowsAnonymous =
			context.ActionDescriptor.EndpointMetadata
				.OfType<AllowAnonymousAttribute>()
				.Any();

		if (!requiresAuthorization || allowsAnonymous)
		{
			await next();
			return;
		}

		bool hasExemption =
			context.ActionDescriptor.EndpointMetadata
				.OfType<AllowWithPendingPasswordChangeAttribute>()
				.Any();

		if (hasExemption)
		{
			await next();
			return;
		}

		string? requiresPasswordChangeClaim =
			context.HttpContext.User
				.FindFirst(CustomClaimTypes.RequiresPasswordChange)
				?.Value;

		if (requiresPasswordChangeClaim == "true")
		{
			context.Result =
				new ObjectResult(new { error = AuthErrorCodes.PasswordChangeRequired })
				{
					StatusCode = StatusCodes.Status403Forbidden,
				};
			return;
		}

		await next();
	}
}