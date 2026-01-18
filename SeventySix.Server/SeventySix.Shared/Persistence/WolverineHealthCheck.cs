using SeventySix.Shared.Interfaces;
using Wolverine;

namespace SeventySix.Domains.Infrastructure;

/// <summary>
/// Generic health check that executes a Wolverine query to determine database health.
/// </summary>
/// <typeparam name="TQuery">
/// The Wolverine query type used to check health. Must be parameterless (have a public parameterless constructor or be a record).
/// </typeparam>
/// <param name="messageBus">
/// The Wolverine message bus for sending the health check query.
/// </param>
/// <param name="contextName">
/// The name of the database context being checked.
/// </param>
public sealed class WolverineHealthCheck<TQuery>(
	IMessageBus messageBus,
	string contextName) : IDatabaseHealthCheck
	where TQuery : new()
{
	/// <inheritdoc />
	public string ContextName => contextName;

	/// <inheritdoc />
	public async Task<bool> CheckHealthAsync(
		CancellationToken cancellationToken = default) =>
		await messageBus.InvokeAsync<bool>(
			new TQuery(),
			cancellationToken);
}