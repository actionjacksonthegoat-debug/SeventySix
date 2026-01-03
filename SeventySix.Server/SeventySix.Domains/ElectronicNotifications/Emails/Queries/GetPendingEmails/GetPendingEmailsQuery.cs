// <copyright file="GetPendingEmailsQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Query to get pending emails for processing.
/// </summary>
/// <param name="BatchSize">
/// Maximum number of emails to retrieve.
/// </param>
public record GetPendingEmailsQuery(int BatchSize);
