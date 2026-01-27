// <copyright file="MarkEmailFailedCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Command to mark an email queue entry as failed.
/// </summary>
/// <param name="EmailQueueId">
/// The ID of the queue entry to mark as failed.
/// </param>
/// <param name="ErrorMessage">
/// The error message from the failed send attempt.
/// </param>
public record MarkEmailFailedCommand(
	long EmailQueueId,
	string ErrorMessage);