// <copyright file="EnqueueEmailCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Contracts.Emails;

/// <summary>
/// Command to add an email to the queue for delivery.
/// Defined in Shared to allow cross-domain communication without coupling.
/// </summary>
/// <param name="EmailType">
/// The type of email to send (Welcome, PasswordReset, Verification, MfaCode).
/// </param>
/// <param name="RecipientEmail">
/// The recipient's email address.
/// </param>
/// <param name="RecipientUserId">
/// The recipient's user ID (optional, for audit purposes).
/// </param>
/// <param name="TemplateData">
/// Template-specific data (username, token, code, etc.).
/// </param>
/// <param name="IdempotencyKey">
/// Optional key to prevent duplicate sends.
/// </param>
public record EnqueueEmailCommand(
	string EmailType,
	string RecipientEmail,
	long? RecipientUserId,
	Dictionary<string, string> TemplateData,
	Guid? IdempotencyKey = null);