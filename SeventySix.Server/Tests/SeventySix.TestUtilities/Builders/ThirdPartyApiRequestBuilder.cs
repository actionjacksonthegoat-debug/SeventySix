// <copyright file="ThirdPartyApiRequestBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.Entities;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating ThirdPartyApiRequest entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create ThirdPartyApiRequest entities with default test values.
/// Reduces boilerplate code in test setup.
///
/// Usage:
/// <code>
/// ThirdPartyApiRequest request = new ThirdPartyApiRequestBuilder()
///     .WithApiName("ExternalAPI")
///     .WithCallCount(150)
///     .Build();
/// </code>
///
/// Design Patterns:
/// - Builder Pattern: Fluent API for constructing complex objects
/// - Test Data Builder: Specialized builder for test data
/// </remarks>
public class ThirdPartyApiRequestBuilder
{
	private string ApiName = "TestApi";
	private string BaseUrl = "https://api.test.com";
	private int CallCount = 0;
	private DateTime? LastCalledAt = null;
	private DateOnly ResetDate = DateOnly.FromDateTime(DateTime.UtcNow);
	private DateTime CreatedAt = DateTime.UtcNow;
	private DateTime UpdatedAt = DateTime.UtcNow;
	private uint RowVersion = 1;

	/// <summary>
	/// Sets the API name.
	/// </summary>
	/// <param name="apiName">The API name.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithApiName(string apiName)
	{
		ApiName = apiName;
		return this;
	}

	/// <summary>
	/// Sets the base URL.
	/// </summary>
	/// <param name="baseUrl">The base URL.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithBaseUrl(string baseUrl)
	{
		BaseUrl = baseUrl;
		return this;
	}

	/// <summary>
	/// Sets the call count.
	/// </summary>
	/// <param name="callCount">The number of API calls.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithCallCount(int callCount)
	{
		CallCount = callCount;
		return this;
	}

	/// <summary>
	/// Sets the last called timestamp.
	/// </summary>
	/// <param name="lastCalledAt">The last called timestamp.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithLastCalledAt(DateTime? lastCalledAt)
	{
		LastCalledAt = lastCalledAt;
		return this;
	}

	/// <summary>
	/// Sets the reset date.
	/// </summary>
	/// <param name="resetDate">The reset date.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithResetDate(DateOnly resetDate)
	{
		ResetDate = resetDate;
		return this;
	}

	/// <summary>
	/// Sets the created timestamp.
	/// </summary>
	/// <param name="createdAt">The created timestamp.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithCreatedAt(DateTime createdAt)
	{
		CreatedAt = createdAt;
		return this;
	}

	/// <summary>
	/// Sets the updated timestamp.
	/// </summary>
	/// <param name="updatedAt">The updated timestamp.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithUpdatedAt(DateTime updatedAt)
	{
		UpdatedAt = updatedAt;
		return this;
	}

	/// <summary>
	/// Sets the row version for concurrency control.
	/// </summary>
	/// <param name="rowVersion">The row version.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithRowVersion(uint rowVersion)
	{
		RowVersion = rowVersion;
		return this;
	}

	/// <summary>
	/// Builds the ThirdPartyApiRequest entity with the configured values.
	/// </summary>
	/// <returns>A new ThirdPartyApiRequest instance.</returns>
	public ThirdPartyApiRequest Build()
	{
		return new ThirdPartyApiRequest
		{
			ApiName = ApiName,
			BaseUrl = BaseUrl,
			CallCount = CallCount,
			LastCalledAt = LastCalledAt,
			ResetDate = ResetDate,
			CreatedAt = CreatedAt,
			UpdatedAt = UpdatedAt,
			RowVersion = RowVersion,
		};
	}

	/// <summary>
	/// Creates a builder with active usage (non-zero call count).
	/// </summary>
	/// <param name="callCount">The number of API calls (default 100).</param>
	/// <returns>A new ThirdPartyApiRequestBuilder with usage.</returns>
	public static ThirdPartyApiRequestBuilder CreateWithUsage(int callCount = 100)
	{
		return new ThirdPartyApiRequestBuilder()
			.WithCallCount(callCount)
			.WithLastCalledAt(DateTime.UtcNow);
	}
}