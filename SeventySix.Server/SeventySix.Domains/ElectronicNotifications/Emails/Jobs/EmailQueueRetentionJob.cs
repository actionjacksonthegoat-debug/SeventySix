// <copyright file="EmailQueueRetentionJob.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Wolverine message that triggers email queue retention cleanup.
/// Only removes <c>Sent</c> and <c>Failed</c> entries older than the configured retention period.
/// </summary>
public record EmailQueueRetentionJob;