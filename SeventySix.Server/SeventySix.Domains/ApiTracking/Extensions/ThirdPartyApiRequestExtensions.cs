// <copyright file="ThirdPartyApiRequestExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Extension methods for <see cref="ThirdPartyApiRequest"/> entity.
/// </summary>
public static class ThirdPartyApiRequestExtensions
{
	/// <summary>
	/// Maps a <see cref="ThirdPartyApiRequest"/> entity to its DTO representation.
	/// </summary>
	/// <param name="apiRequest">
	/// The entity to map.
	/// </param>
	/// <returns>
	/// A new <see cref="ThirdPartyApiRequestDto"/> populated with entity values.
	/// </returns>
	public static ThirdPartyApiRequestDto ToDto(
		this ThirdPartyApiRequest apiRequest)
	{
		return new ThirdPartyApiRequestDto
		{
			Id = apiRequest.Id,
			ApiName = apiRequest.ApiName,
			BaseUrl = apiRequest.BaseUrl,
			CallCount = apiRequest.CallCount,
			LastCalledAt = apiRequest.LastCalledAt,
			ResetDate = apiRequest.ResetDate,
		};
	}
}