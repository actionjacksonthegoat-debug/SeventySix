using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Interfaces;
using Wolverine;

namespace SeventySix.Registration;

public static class WolverineHealthCheckRegistration
{
	/// <summary>
	/// Registers a Wolverine-based database health check that invokes <typeparamref name="TQuery"/>.
	/// </summary>
	/// <typeparam name="TQuery">The request/query type sent to Wolverine to perform the health probe.
	/// Must have a public parameterless constructor (<c>new()</c>).
	/// </typeparam>
	/// <param name="services">
	/// The <see cref="IServiceCollection"/> to register the health check into.
	/// </param>
	/// <param name="contextName">
	/// Logical name of the context (for example, "Identity") used in health-check messages.
	/// </param>
	/// <returns>
	/// The same <see cref="IServiceCollection"/> for chaining.
	/// </returns>
	public static IServiceCollection AddWolverineHealthCheck<TQuery>(
		this IServiceCollection services,
		string contextName)
		where TQuery : new()
	{
		services.AddScoped<IDatabaseHealthCheck>(
			serviceProvider =>
			{
				IMessageBus bus =
					serviceProvider.GetRequiredService<IMessageBus>();

				return new Domains.Infrastructure.WolverineHealthCheck<TQuery>(
					bus,
					contextName);
			});

		return services;
	}
}