// <copyright file="ThirdPartyApiRequestBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.ApiTracking;

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
	private readonly TimeProvider TimeProvider;
	private string ApiName = "TestApi";
	private string BaseUrl = "https://api.test.com";
	private int CallCount = 0;
	private DateTime? LastCalledAt = null;
	private DateOnly ResetDate;
	private DateTime CreateDate;
	private DateTime? ModifyDate = null;
	private uint RowVersion = 1;

	/// <summary>
	/// Initializes a new instance of the <see cref="ThirdPartyApiRequestBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">The time provider for default timestamps.</param>
	public ThirdPartyApiRequestBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
		ResetDate =
			DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);
		CreateDate =
			timeProvider.GetUtcNow().UtcDateTime;
	}

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
	/// Sets the last called CreateDate.
	/// </summary>
	/// <param name="lastCalledAt">The last called CreateDate.</param>
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
	/// Sets the created CreateDate.
	/// </summary>
	/// <param name="createDate">The created CreateDate.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithCreatedAt(DateTime createDate)
	{
		CreateDate = createDate;
		return this;
	}

	/// <summary>
	/// Sets the updated CreateDate.
	/// </summary>
	/// <param name="modifyDate">The modified CreateDate.</param>
	/// <returns>The builder instance for method chaining.</returns>
	public ThirdPartyApiRequestBuilder WithModifiedAt(DateTime? modifyDate)
	{
		ModifyDate = modifyDate;
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
			CreateDate = CreateDate,
			ModifyDate = ModifyDate,
			RowVersion = RowVersion,
		};
	}

	/// <summary>
	/// Creates a builder with active usage (non-zero call count).
	/// </summary>
	/// <param name="timeProvider">The time provider for timestamps.</param>
	/// <param name="callCount">The number of API calls (default 100).</param>
	/// <returns>A new ThirdPartyApiRequestBuilder with usage.</returns>
	public static ThirdPartyApiRequestBuilder CreateWithUsage(
		TimeProvider timeProvider,
		int callCount = 100)
	{
		return new ThirdPartyApiRequestBuilder(timeProvider)
			.WithCallCount(callCount)
			.WithLastCalledAt(timeProvider.GetUtcNow().UtcDateTime);
	}
}
