// <copyright file="WeatherAlert.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Core.DTOs.OpenWeather;

/// <summary>
/// Government weather alert information.
/// </summary>
/// <remarks>
/// National weather alerts from major weather agencies.
/// </remarks>
public class WeatherAlert
{
	/// <summary>
	/// Gets or sets the sender name of the alert.
	/// </summary>
	[JsonPropertyName("sender_name")]
	public string SenderName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the alert event name.
	/// </summary>
	[JsonPropertyName("event")]
	public string Event { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the alert start time (Unix UTC).
	/// </summary>
	[JsonPropertyName("start")]
	public long StartTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the alert start time as DateTime (UTC).
	/// </summary>
	public DateTime Start => DateTimeOffset.FromUnixTimeSeconds(StartTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the alert end time (Unix UTC).
	/// </summary>
	[JsonPropertyName("end")]
	public long EndTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the alert end time as DateTime (UTC).
	/// </summary>
	public DateTime End => DateTimeOffset.FromUnixTimeSeconds(EndTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the alert description.
	/// </summary>
	[JsonPropertyName("description")]
	public string Description { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the tags associated with the alert.
	/// </summary>
	[JsonPropertyName("tags")]
	public List<string> Tags { get; set; } = [];
}
