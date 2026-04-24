// <copyright file="ProblemDetailsLeakageTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Security;

/// <summary>
/// Regression gate: verifies that ProblemDetails responses never leak exception messages,
/// stack traces, connection strings, or internal paths to API consumers.
/// Per OWASP A05:2021 (Security Misconfiguration) — internal error details must never
/// reach the response body.
/// </summary>
public sealed class ProblemDetailsLeakageTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	/// <summary>
	/// Initializes a new instance of the <see cref="ProblemDetailsLeakageTests"/> class.
	/// </summary>
	public ProblemDetailsLeakageTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
				connectionString: "InMemory");
	}

	/// <summary>
	/// Verifies that a 404 response from a non-existent endpoint does not leak
	/// any internal path, exception type, or stack trace in the Detail field.
	/// </summary>
	[Fact]
	public async Task NotFoundResponse_DoesNotLeakInternalDetailsAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync("/api/v1/nonexistent-endpoint-probing-for-leakage");

		// Assert — no ProblemDetails leakage on 404
		response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
		string body =
			await response.Content.ReadAsStringAsync();

		// Body may be empty for 404s — only inspect if JSON is present
		if (!string.IsNullOrWhiteSpace(body))
		{
			using JsonDocument doc =
				JsonDocument.Parse(body);
			bool hasDetail =
				doc.RootElement.TryGetProperty(
					"detail",
					out JsonElement detailElement);

			if (hasDetail)
			{
				string? detail =
					detailElement.GetString() ?? string.Empty;
				detail.ShouldNotContain(
					"Exception",
					Case.Insensitive);
				detail.ShouldNotContain(
					"System.",
					Case.Insensitive);
				detail.ShouldNotContain(
					"StackTrace",
					Case.Insensitive);
				detail.ShouldNotContain(
					"at ",
					Case.Sensitive);
			}
		}
	}

	/// <summary>
	/// Verifies that a 401 Unauthorized response to an unauthenticated request
	/// against a protected endpoint does not leak internal exception details.
	/// </summary>
	[Fact]
	public async Task UnauthorizedResponse_DoesNotLeakInternalDetailsAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Auth.Me);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
		string body =
			await response.Content.ReadAsStringAsync();

		if (!string.IsNullOrWhiteSpace(body))
		{
			body.ShouldNotContain(
				"Exception",
				Case.Insensitive);
			body.ShouldNotContain(
				"StackTrace",
				Case.Insensitive);
			body.ShouldNotContain(
				"InnerException",
				Case.Insensitive);
		}
	}

	/// <summary>
	/// Verifies that a FluentValidation failure response does not leak
	/// exception type names or stack traces — only curated field-level errors.
	/// </summary>
	[Fact]
	public async Task ValidationFailure_ReturnsStructuredErrors_WithoutExceptionLeakageAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		StringContent emptyBody =
			new(
				"{}",
				System.Text.Encoding.UTF8,
				"application/json");

		// Act — submit empty login body to trigger FluentValidation
		HttpResponseMessage response =
			await client.PostAsync(
				ApiEndpoints.Auth.Login,
				emptyBody);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
		string body =
			await response.Content.ReadAsStringAsync();

		body.ShouldNotContain(
			"FluentValidation",
			Case.Insensitive);
		body.ShouldNotContain(
			"Exception",
			Case.Insensitive);
		body.ShouldNotContain(
			"StackTrace",
			Case.Insensitive);
	}

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}