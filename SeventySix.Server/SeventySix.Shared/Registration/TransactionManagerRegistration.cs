using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Persistence;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Registration helpers for transaction managers.
/// </summary>
/// <remarks>
/// Provides methods to register an <see cref="ITransactionManager"/> scoped to a specific
/// <see cref="DbContext"/> type to centralize transaction-related DI configuration.
/// </remarks>
public static class TransactionManagerRegistration
{
	/// <summary>
	/// Registers a scoped <see cref="ITransactionManager"/> implementation for the specified <typeparamref name="TContext"/>.
	/// </summary>
	/// <typeparam name="TContext">
	/// The <see cref="DbContext"/> type the transaction manager operates on.
	/// </typeparam>
	/// <param name="services">
	/// The service collection to register the transaction manager into.
	/// </param>
	/// <returns>
	/// The supplied <see cref="IServiceCollection"/> for chaining.
	/// </returns>
	public static IServiceCollection AddTransactionManagerFor<TContext>(this IServiceCollection services)
		where TContext : DbContext
	{
		services.AddScoped<ITransactionManager, TransactionManagerForContext<TContext>>();
		return services;
	}
}
