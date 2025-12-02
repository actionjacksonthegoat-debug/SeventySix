// <copyright file="PermissionRequestExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Extension methods for <see cref="PermissionRequest"/>.</summary>
public static class PermissionRequestExtensions
{
	/// <summary>Maps entity to DTO.</summary>
	/// <param name="request">The permission request entity.</param>
	/// <param name="username">The username of the requester.</param>
	/// <returns>The mapped DTO.</returns>
	public static PermissionRequestDto ToDto(
		this PermissionRequest request,
		string username)
	{
		return new PermissionRequestDto(
			request.Id,
			request.UserId,
			username,
			request.RequestedRole,
			request.RequestMessage,
			request.CreatedBy,
			request.CreateDate);
	}
}