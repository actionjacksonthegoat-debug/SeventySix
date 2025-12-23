// <copyright file="ThirdPartyApiRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.ApiTracking;

/// <summary>
/// Domain entity representing a third-party API request tracking record.
/// </summary>
/// <remarks>
/// Tracks API calls made to external services for rate limiting and auditing purposes.
/// Each record represents API usage for a specific API on a specific date.
///
/// Design Patterns:
/// - Domain Model: Rich entity with business logic
/// - Value Object: ResetDate represents a specific day
///
/// SOLID Principles:
/// - SRP: Only responsible for API request tracking state and behavior
/// - OCP: Extensible through inheritance if needed
/// - No framework dependencies (pure POCO)
/// </remarks>
public class ThirdPartyApiRequest : IModifiableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Gets or sets the name of the external API.
	/// </summary>
	/// <example>BrevoEmail</example>
	public required string ApiName { get; set; }

	/// <summary>
	/// Gets or sets the base URL of the third-party API.
	/// </summary>
	/// <example>https://api.example.com</example>
	public required string BaseUrl { get; set; }

	/// <summary>
	/// Gets or sets the number of API calls made on the ResetDate.
	/// </summary>
	public int CallCount { get; set; }

	/// <summary>
	/// Gets or sets the timestamp of the most recent API call.
	/// </summary>
	public DateTime? LastCalledAt { get; set; }

	/// <summary>
	/// Gets or sets the date for which this counter is tracking (allows daily reset logic).
	/// </summary>
	public DateOnly ResetDate { get; set; }

	/// <summary>
	/// Gets or sets the date and time when the request was created.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets the date and time when the request was last modified.
	/// </summary>
	public DateTime? ModifyDate { get; set; }

	/// <summary>
	/// Gets or sets the row version for optimistic concurrency control.
	/// </summary>
	/// <remarks>
	/// PostgreSQL uses `xmin` system column for row versioning.
	/// EF Core will automatically check this value during updates to detect concurrent modifications.
	/// If another transaction modified the row, DbUpdateConcurrencyException will be thrown.
	/// </remarks>
	public uint RowVersion { get; set; }

	/// <summary>
	/// Increments the call counter and updates the last called timestamp.
	/// </summary>
	/// <param name="currentTime">
	/// Current UTC time to record as LastCalledAt.
	/// </param>
	/// <remarks>
	/// Domain method that encapsulates the business logic for recording an API call.
	/// Ensures CallCount and LastCalledAt are always updated together (consistency).
	/// RowVersion is automatically updated by PostgreSQL's xmin system column.
	/// </remarks>
	public void IncrementCallCount(DateTime currentTime)
	{
		CallCount++;
		LastCalledAt = currentTime;
	}

	/// <summary>
	/// Resets the call counter for a new tracking period.
	/// </summary>
	/// <remarks>
	/// Domain method for resetting daily counters.
	/// Maintains LastCalledAt for historical reference.
	/// RowVersion is automatically updated by PostgreSQL's xmin system column.
	/// </remarks>
	public void ResetCallCount()
	{
		CallCount = 0;
	}
}