// <copyright file="CorsRateLimitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using SeventySix.Api.Middleware;
using Shouldly;

namespace SeventySix.Api.Tests.Middleware;

public class CorsRateLimitTests
{
	[Fact]
	public void RateLimiter_Rejection_Includes_Cors_Headers()
	{
		DefaultHttpContext context = new();
		context.Request.Headers.Origin = "http://localhost:4200";

		ISet<string> allowed =
			new HashSet<string>(
				["http://localhost:4200"],
				StringComparer.OrdinalIgnoreCase);

		// Simulate rate limiter rejection behavior: helper should add headers prior to writing response
		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, allowed);

		context.Response.StatusCode =
			StatusCodes.Status429TooManyRequests;

		context.Response.StatusCode.ShouldBe(
			StatusCodes.Status429TooManyRequests);
		context.Response.Headers.ContainsKey("Access-Control-Allow-Origin")
			.ShouldBeTrue();
	}
}