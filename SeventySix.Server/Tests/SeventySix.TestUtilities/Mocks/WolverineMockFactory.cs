// <copyright file="WolverineMockFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using Wolverine;

namespace SeventySix.TestUtilities.Mocks;

/// <summary>
/// Factory for creating Wolverine-related mock objects.
/// Centralizes IMessageBus mock creation to ensure consistency and reduce duplication.
/// </summary>
public static class WolverineMockFactory
{
	/// <summary>
	/// Creates a mock <see cref="IMessageBus"/> with NSubstitute.
	/// </summary>
	/// <returns>
	/// A configured NSubstitute mock for IMessageBus.
	/// </returns>
	public static IMessageBus CreateMessageBus() =>
		Substitute.For<IMessageBus>();

	/// <summary>
	/// Configures an IMessageBus mock to return a specific result for InvokeAsync.
	/// </summary>
	/// <typeparam name="TResult">
	/// The type of result to return.
	/// </typeparam>
	/// <param name="messageBus">
	/// The message bus mock to configure.
	/// </param>
	/// <param name="result">
	/// The result to return from InvokeAsync.
	/// </param>
	/// <returns>
	/// The configured message bus for method chaining.
	/// </returns>
	public static IMessageBus WithInvokeResult<TResult>(
		this IMessageBus messageBus,
		TResult result)
	{
		messageBus
			.InvokeAsync<TResult>(
				Arg.Any<object>(),
				Arg.Any<CancellationToken>())
			.Returns(result);

		return messageBus;
	}

	/// <summary>
	/// Configures an IMessageBus mock to return a specific result for a specific command/query type.
	/// </summary>
	/// <typeparam name="TCommand">
	/// The command or query type to match.
	/// </typeparam>
	/// <typeparam name="TResult">
	/// The type of result to return.
	/// </typeparam>
	/// <param name="messageBus">
	/// The message bus mock to configure.
	/// </param>
	/// <param name="result">
	/// The result to return when the specific command type is invoked.
	/// </param>
	/// <returns>
	/// The configured message bus for method chaining.
	/// </returns>
	public static IMessageBus WithInvokeResult<TCommand, TResult>(
		this IMessageBus messageBus,
		TResult result)
		where TCommand : class
	{
		messageBus
			.InvokeAsync<TResult>(
				Arg.Any<TCommand>(),
				Arg.Any<CancellationToken>())
			.Returns(result);

		return messageBus;
	}
}