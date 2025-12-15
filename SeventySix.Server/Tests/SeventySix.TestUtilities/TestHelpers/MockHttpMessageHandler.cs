// <copyright file="MockHttpMessageHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Test helper for mocking HttpMessageHandler without Moq.Protected().
/// </summary>
public class MockHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler) : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		return handler(request, cancellationToken);
	}
}
