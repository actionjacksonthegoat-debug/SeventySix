// <copyright file="ResendMfaCodeCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Shared.Contracts.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Handler for resending MFA verification codes.
/// </summary>
public static class ResendMfaCodeCommandHandler
{
	/// <summary>
	/// Handles the resend MFA code request.
	/// </summary>
	/// <param name="command">
	/// The resend command.
	/// </param>
	/// <param name="mfaService">
	/// MFA service for challenge management.
	/// </param>
	/// <param name="messageBus">
	/// Message bus for enqueueing emails.
	/// </param>
	/// <param name="mfaSettings">
	/// MFA configuration settings.
	/// </param>
	/// <param name="securityAuditService">
	/// Security audit logging service.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// MfaChallengeRefreshResult indicating success or failure.
	/// </returns>
	public static async Task<MfaChallengeRefreshResult> HandleAsync(
		ResendMfaCodeCommand command,
		IMfaService mfaService,
		IMessageBus messageBus,
		IOptions<MfaSettings> mfaSettings,
		ISecurityAuditService securityAuditService,
		CancellationToken cancellationToken)
	{
		MfaChallengeRefreshResult refreshResult =
			await mfaService.RefreshChallengeAsync(
				command.Request.ChallengeToken,
				cancellationToken);

		if (!refreshResult.Success)
		{
			return refreshResult;
		}

		await messageBus.InvokeAsync(
			new EnqueueEmailCommand(
				EmailTypeConstants.MfaVerification,
				refreshResult.Email,
				refreshResult.UserId,
				new()
				{
					["code"] =
						refreshResult.NewCode,
					["expirationMinutes"] =
						mfaSettings.Value.CodeExpirationMinutes.ToString()
				}),
			cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaCodeResent,
			userId: refreshResult.UserId,
			username: null,
			success: true,
			details: null,
			cancellationToken);

		return refreshResult;
	}
}