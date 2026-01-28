// <copyright file="CorsHeaderHelperTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using SeventySix.Api.Middleware;
using Shouldly;

namespace SeventySix.Api.Tests.Middleware;

public class CorsHeaderHelperTests
{
	[Fact]
	public void AddsHeaders_When_Origin_Is_Allowed()
	{
		DefaultHttpContext context = new();
		context.Request.Headers.Origin = "http://localhost:4200";

		ISet<string> allowed =
			new HashSet<string>(
				["http://localhost:4200"],
				StringComparer.OrdinalIgnoreCase);

		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, allowed);

		context.Response.Headers.ContainsKey("Access-Control-Allow-Origin")
			.ShouldBeTrue();
		context.Response.Headers.AccessControlAllowOrigin.ToString()
			.ShouldBe("http://localhost:4200");
		context.Response.Headers.AccessControlAllowCredentials.ToString()
			.ShouldBe("true");
	}

	[Fact]
	public void DoesNotAddHeaders_When_Origin_Not_Allowed()
	{
		DefaultHttpContext context = new();
		context.Request.Headers.Origin = "http://evil.com";

		ISet<string> allowed =
			new HashSet<string>(
				["http://localhost:4200"],
				StringComparer.OrdinalIgnoreCase);

		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, allowed);

		context.Response.Headers.ContainsKey("Access-Control-Allow-Origin")
			.ShouldBeFalse();
	}
}