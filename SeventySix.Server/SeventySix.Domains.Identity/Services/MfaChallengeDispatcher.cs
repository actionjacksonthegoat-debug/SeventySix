// <copyright file="MfaChallengeDispatcher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Shared.Contracts.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Default implementation of <see cref="IMfaChallengeDispatcher"/>.
/// Selects the appropriate MFA challenge method (TOTP or email) and issues the challenge token.
/// </summary>
/// <remarks>
/// This class has a single responsibility: dispatching MFA challenges. Login-flow policy
/// (whether MFA is required, trusted-device bypass) is handled by
/// <see cref="LoginCommandHandler"/> as inline private helpers.
/// </remarks>
/// <param name="mfaService">
/// MFA service for challenge creation.
/// </param>
/// <param name="mfaSettings">
/// MFA configuration settings.
/// </param>
/// <param name="totpSettings">
/// TOTP configuration settings.
/// </param>
/// <param name="messageBus">
/// Message bus for enqueueing MFA email notifications.
/// </param>
/// <param name="securityAuditService">
/// Service for logging security audit events.
/// </param>
internal sealed class MfaChallengeDispatcher(
	IMfaService mfaService,
	IOptions<MfaSettings> mfaSettings,
	IOptions<TotpSettings> totpSettings,
	IMessageBus messageBus,
	ISecurityAuditService securityAuditService) : IMfaChallengeDispatcher
{
	/// <inheritdoc />
	public async Task<AuthResult> InitiateChallengeAsync(
		ApplicationUser user,
		CancellationToken cancellationToken)
	{
		bool hasTotpEnrolled =
			!string.IsNullOrEmpty(user.TotpSecret);

		if (hasTotpEnrolled && totpSettings.Value.Enabled)
		{
			return await InitiateTotpChallengeAsync(
				user,
				cancellationToken);
		}

		return await InitiateEmailChallengeAsync(
			user,
			cancellationToken);
	}

	private async Task<AuthResult> InitiateTotpChallengeAsync(
		ApplicationUser user,
		CancellationToken cancellationToken)
	{
		(string totpChallengeToken, string _) =
			await mfaService.CreateChallengeAsync(
				user.Id,
				cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaChallengeInitiated,
			user,
			success: true,
			details: "TOTP",
			cancellationToken);

		List<MfaMethod> availableMethods =
			[MfaMethod.Totp, MfaMethod.Email, MfaMethod.BackupCode];

		return AuthResult.MfaRequired(
			challengeToken: totpChallengeToken,
			email: user.Email!,
			mfaMethod: MfaMethod.Totp,
			availableMethods: availableMethods);
	}

	private async Task<AuthResult> InitiateEmailChallengeAsync(
		ApplicationUser user,
		CancellationToken cancellationToken)
	{
		MfaSettings config =
			mfaSettings.Value;

		(string challengeToken, string code) =
			await mfaService.CreateChallengeAsync(
				user.Id,
				cancellationToken);

		await messageBus.InvokeAsync(
			new EnqueueEmailCommand(
				EmailTypeConstants.MfaVerification,
				user.Email!,
				user.Id,
				new()
				{
					["code"] =
						code,
					["expirationMinutes"] =
						config.CodeExpirationMinutes.ToString(),
				}),
			cancellationToken);

		await securityAuditService.LogEventAsync(
			SecurityEventType.MfaChallengeInitiated,
			user,
			success: true,
			details: "Email",
			cancellationToken);

		List<MfaMethod> availableMethods =
			[MfaMethod.Email];

		return AuthResult.MfaRequired(
			challengeToken,
			user.Email!,
			mfaMethod: MfaMethod.Email,
			availableMethods: availableMethods);
	}
}