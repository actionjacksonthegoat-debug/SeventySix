// <copyright file="CorsHeaderHelperTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using SeventySix.Api.Middleware;

namespace SeventySix.Api.Tests.Middleware;

public class CorsHeaderHelperTests
{
	[Fact]
	public void AddsHeaders_When_Origin_Is_Allowed()
	{
		DefaultHttpContext context = new();
		context.Request.Headers["Origin"] = "http://localhost:4200";

		ISet<string> allowed = new HashSet<string>(new[] { "http://localhost:4200" }, StringComparer.OrdinalIgnoreCase);

		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, allowed);

		Assert.True(context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"));
		Assert.Equal("http://localhost:4200", context.Response.Headers["Access-Control-Allow-Origin"].ToString());
		Assert.Equal("true", context.Response.Headers["Access-Control-Allow-Credentials"].ToString());
	}

	[Fact]
	public void DoesNotAddHeaders_When_Origin_Not_Allowed()
	{
		DefaultHttpContext context = new();
		context.Request.Headers["Origin"] = "http://evil.com";

		ISet<string> allowed = new HashSet<string>(new[] { "http://localhost:4200" }, StringComparer.OrdinalIgnoreCase);

		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, allowed);

		Assert.False(context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"));
	}
}