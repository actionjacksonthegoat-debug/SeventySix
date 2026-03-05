// <copyright file="BrevoApiContracts.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.ElectronicNotifications.Emails;

internal sealed record BrevoEmailAddress(
	[property: JsonPropertyName("email")] string Email,
	[property: JsonPropertyName("name")] string? Name);

internal sealed record BrevoSendEmailRequest(
	[property: JsonPropertyName("sender")] BrevoEmailAddress Sender,
	[property: JsonPropertyName("to")] BrevoEmailAddress[] To,
	[property: JsonPropertyName("subject")] string Subject,
	[property: JsonPropertyName("htmlContent")] string HtmlContent);