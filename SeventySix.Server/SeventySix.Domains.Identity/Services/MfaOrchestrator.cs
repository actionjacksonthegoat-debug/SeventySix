// <copyright file="MfaOrchestrator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Shared.Contracts.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Default implementation of <see cref="IMfaOrchestrator"/>.
/// Consolidates the MFA-related logic extracted from <see cref="LoginCommandHandler"/>:
/// MFA requirement checking, trusted-device bypass, and challenge initiation (TOTP or email).
/// </summary>
/// <param name="mfaService">
/// MFA service for challenge creation.
/// </param>
/// <param name="mfaSettings">
/// MFA configuration settings.
/// </param>
/// <param name="totpSettings">
/// TOTP configuration settings.
/// </param>
/// <param name="trustedDeviceService">
/// Service for trusted device validation and MFA bypass.
/// </param>
/// <param name="securityAuditService">
/// Service for logging security audit events.
/// </param>
/// <param name="messageBus">
/// Message bus for enqueueing emails.
/// </param>
/// <param name="authenticationService">
/// Service to generate auth tokens on trusted-device bypass.
/// </param>
public sealed class MfaOrchestrator(
	IMfaService mfaService,
	IOptions<MfaSettings> mfaSettings,
	IOptions<TotpSettings> totpSettings,
	ITrustedDeviceService trustedDeviceService,
	ISecurityAuditService securityAuditService,
	IMessageBus messageBus,
	AuthenticationService authenticationService) : IMfaOrchestrator
{
	/// <inheritdoc />
	public bool IsMfaRequired(ApplicationUser user)
	{
		MfaSettings config =
			mfaSettings.Value;

		return config.Enabled
			&& (config.RequiredForAllUsers || user.MfaEnabled);
	}

	/// <inheritdoc />
	public async Task<AuthResult?> TryBypassViaTrustedDeviceAsync(
		LoginCommand command,
		ApplicationUser user,
		CancellationToken cancellationToken)
	{
		if (string.IsNullOrEmpty(command.TrustedDeviceToken))
		{
			return null;
		}

		bool isTrusted =
			await trustedDeviceService.ValidateTrustedDeviceAsync(
				user.Id,
				command.TrustedDeviceToken,
				command.UserAgent ?? string.Empty,
				command.ClientIp,
				cancellationToken);

		if (!isTrusted)
		{
			return null;
		}

		await securityAuditService.LogEventAsync(
			SecurityEventType.LoginSuccess,
			user,
			success: true,
			details: "MFA bypassed via trusted device",
			cancellationToken);

		return await authenticationService.GenerateAuthResultAsync(
			user,
			command.ClientIp,
			user.RequiresPasswordChange,
			command.Request.RememberMe,
			cancellationToken);
	}

	/// <inheritdoc />
	public async Task<AuthResult> InitiateChallengeAsync(
		ApplicationUser user,
		string? clientIp,
		CancellationToken cancellationToken)
	{
		bool hasTotpEnrolled =
			!string.IsNullOrEmpty(user.TotpSecret);

		if (hasTotpEnrolled && totpSettings.Value.Enabled)
		{
			return await InitiateTotpChallengeAsync(
				user,
				clientIp,
				cancellationToken);
		}

		return await InitiateEmailChallengeAsync(
			user,
			clientIp,
			cancellationToken);
	}

	private async Task<AuthResult> InitiateTotpChallengeAsync(
		ApplicationUser user,
		string? clientIp,
		CancellationToken cancellationToken)
	{
		(string totpChallengeToken, string _) =
			await mfaService.CreateChallengeAsync(
				user.Id,
				clientIp,
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
		string? clientIp,
		CancellationToken cancellationToken)
	{
		MfaSettings config =
			mfaSettings.Value;

		(string challengeToken, string code) =
			await mfaService.CreateChallengeAsync(
				user.Id,
				clientIp,
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