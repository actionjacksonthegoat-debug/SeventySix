// <copyright file="RejectPermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity.Commands.RejectPermissionRequest;

/// <summary>
/// Handler for rejecting a single permission request.
/// </summary>
public static class RejectPermissionRequestCommandHandler
{
	/// <summary>
	/// Handles the rejection of a permission request.
	/// </summary>
	/// <param name="command">
	/// The reject command.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing request cache.
	/// </param>
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		RejectPermissionRequestCommand command,
		IPermissionRequestRepository repository,
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		Result txResult =
			await transactionManager.ExecuteInTransactionAsync(
				async ct =>
				{
					PermissionRequest? request =
						await repository.GetByIdAsync(
							command.RequestId,
							ct);

					if (request is null)
					{
						return Result.Failure(
							$"Permission request {command.RequestId} not found");
					}

					await repository.DeleteAsync(
						command.RequestId,
						ct);

					return Result.Success();
				},
				cancellationToken: cancellationToken);

		if (!txResult.IsSuccess)
		{
			return txResult;
		}

		// Invalidate permission requests cache (outside transaction)
		await identityCache.InvalidatePermissionRequestsAsync();

		return txResult;
	}
}