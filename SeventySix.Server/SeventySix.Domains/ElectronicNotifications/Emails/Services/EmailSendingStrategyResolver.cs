// <copyright file="EmailSendingStrategyResolver.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails.Services;

/// <summary>
/// Resolves the appropriate <see cref="IEmailSendingStrategy"/> for a given email type.
/// Uses a dictionary lookup for O(1) resolution.
/// </summary>
/// <param name="strategies">
/// All registered email sending strategies injected via DI.
/// </param>
public sealed class EmailSendingStrategyResolver(
	IEnumerable<IEmailSendingStrategy> strategies)
{
	private readonly IReadOnlyDictionary<string, IEmailSendingStrategy> Strategies =
		strategies.ToDictionary(
			strategy => strategy.SupportedType,
			strategy => strategy);

	/// <summary>
	/// Resolves the strategy for the specified email type.
	/// </summary>
	/// <param name="emailType">
	/// The email type constant to look up.
	/// </param>
	/// <returns>
	/// The matching strategy, or <see langword="null"/> if no strategy is registered for the type.
	/// </returns>
	public IEmailSendingStrategy? Resolve(string emailType)
	{
		return Strategies.GetValueOrDefault(emailType);
	}
}