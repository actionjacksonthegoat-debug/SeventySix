// <copyright file="RequiresPasswordChangeFilterTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using SeventySix.Api.Attributes;
using SeventySix.Api.Filters;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Api.Tests.Filters;

public sealed class RequiresPasswordChangeFilterTests
{
	private readonly RequiresPasswordChangeFilter FilterUnderTest = new();

	[Fact]
	public async Task OnActionExecutionAsync_AnonymousRequest_ContinuesPipelineAsync()
	{
		ActionExecutingContext context =
			CreateActionExecutingContext(
				CreateAnonymousUser(),
				new AuthorizeAttribute());

		bool pipelineContinued = false;

		await FilterUnderTest.OnActionExecutionAsync(
			context,
			() =>
			{
				pipelineContinued = true;
				return Task.FromResult<ActionExecutedContext>(null!);
			});

		pipelineContinued.ShouldBeTrue();
		context.Result.ShouldBeNull();
	}

	[Fact]
	public async Task OnActionExecutionAsync_AuthenticatedWithoutFlag_ContinuesPipelineAsync()
	{
		ActionExecutingContext context =
			CreateActionExecutingContext(
				CreateAuthenticatedUser(requiresPasswordChange: false),
				new AuthorizeAttribute());

		bool pipelineContinued = false;

		await FilterUnderTest.OnActionExecutionAsync(
			context,
			() =>
			{
				pipelineContinued = true;
				return Task.FromResult<ActionExecutedContext>(null!);
			});

		pipelineContinued.ShouldBeTrue();
		context.Result.ShouldBeNull();
	}

	[Fact]
	public async Task OnActionExecutionAsync_AuthenticatedWithFlag_Returns403Async()
	{
		ActionExecutingContext context =
			CreateActionExecutingContext(
				CreateAuthenticatedUser(requiresPasswordChange: true),
				new AuthorizeAttribute());

		bool pipelineContinued = false;

		await FilterUnderTest.OnActionExecutionAsync(
			context,
			() =>
			{
				pipelineContinued = true;
				return Task.FromResult<ActionExecutedContext>(null!);
			});

		pipelineContinued.ShouldBeFalse();
		context.Result.ShouldNotBeNull();

		ObjectResult objectResult =
			context.Result.ShouldBeOfType<ObjectResult>();
		objectResult.StatusCode.ShouldBe(StatusCodes.Status403Forbidden);
	}

	[Fact]
	public async Task OnActionExecutionAsync_ExemptedAction_ContinuesDespiteFlagAsync()
	{
		ActionExecutingContext context =
			CreateActionExecutingContext(
				CreateAuthenticatedUser(requiresPasswordChange: true),
				new AuthorizeAttribute(),
				new AllowWithPendingPasswordChangeAttribute());

		bool pipelineContinued = false;

		await FilterUnderTest.OnActionExecutionAsync(
			context,
			() =>
			{
				pipelineContinued = true;
				return Task.FromResult<ActionExecutedContext>(null!);
			});

		pipelineContinued.ShouldBeTrue();
		context.Result.ShouldBeNull();
	}

	[Fact]
	public async Task OnActionExecutionAsync_PublicEndpoint_ContinuesDespiteFlagAsync()
	{
		ActionExecutingContext context =
			CreateActionExecutingContext(
				CreateAuthenticatedUser(requiresPasswordChange: true));

		bool pipelineContinued = false;

		await FilterUnderTest.OnActionExecutionAsync(
			context,
			() =>
			{
				pipelineContinued = true;
				return Task.FromResult<ActionExecutedContext>(null!);
			});

		pipelineContinued.ShouldBeTrue();
		context.Result.ShouldBeNull();
	}

	private static ClaimsPrincipal CreateAnonymousUser()
	{
		return new ClaimsPrincipal(new ClaimsIdentity());
	}

	private static ClaimsPrincipal CreateAuthenticatedUser(bool requiresPasswordChange)
	{
		List<Claim> claims =
			[
				new Claim(ClaimTypes.NameIdentifier, "123"),
				new Claim(ClaimTypes.Name, "testuser"),
			];

		if (requiresPasswordChange)
		{
			claims.Add(
				new Claim(
					CustomClaimTypes.RequiresPasswordChange,
					"true"));
		}

		ClaimsIdentity identity =
			new(claims, "Bearer");

		return new ClaimsPrincipal(identity);
	}

	private static ActionExecutingContext CreateActionExecutingContext(
		ClaimsPrincipal userPrincipal,
		params object[] endpointMetadata)
	{
		DefaultHttpContext httpContext =
			new()
			{
				User = userPrincipal,
			};

		ActionDescriptor actionDescriptor =
			new()
			{
				EndpointMetadata = [.. endpointMetadata],
			};

		ActionContext actionContext =
			new(
				httpContext,
				new RouteData(),
				actionDescriptor);

		return new ActionExecutingContext(
			actionContext,
			new List<IFilterMetadata>(),
			new Dictionary<string, object?>(),
			controller: new object());
	}
}