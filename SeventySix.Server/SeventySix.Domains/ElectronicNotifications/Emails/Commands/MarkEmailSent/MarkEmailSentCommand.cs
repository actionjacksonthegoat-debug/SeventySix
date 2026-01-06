// <copyright file="MarkEmailSentCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Command to mark an email queue entry as successfully sent.
/// </summary>
/// <param name="EmailQueueId">
/// The ID of the queue entry to mark as sent.
/// </param>
public record MarkEmailSentCommand(long EmailQueueId);