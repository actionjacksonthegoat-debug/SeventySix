// <copyright file="EmailQueueStatus.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Constants for email queue entry status values.
/// </summary>
/// <remarks>
/// Status flow:
/// Pending → Processing → Sent
///                    ↓
///               Failed (retry) → DeadLetter (max attempts reached)
/// </remarks>
public static class EmailQueueStatus
{
	/// <summary>
	/// Email is waiting to be processed.
	/// </summary>
	public const string Pending = "Pending";

	/// <summary>
	/// Email is currently being sent.
	/// </summary>
	public const string Processing = "Processing";

	/// <summary>
	/// Email was sent successfully.
	/// </summary>
	public const string Sent = "Sent";

	/// <summary>
	/// Email send failed (will be retried if attempts remain).
	/// </summary>
	public const string Failed = "Failed";

	/// <summary>
	/// Email exceeded max attempts and will not be retried.
	/// </summary>
	public const string DeadLetter = "DeadLetter";
}
