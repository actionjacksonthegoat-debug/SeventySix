using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Registration;
using Shouldly;
using Xunit;

namespace SeventySix.Shared.Tests.Persistence;

public class DummyContext : DbContext;

public class TransactionManagerForContextTests
{
	[Fact]
	public void AddTransactionManagerFor_RegistersITransactionManager()
	{
		ServiceCollection services =
			new();

		services.AddScoped<DummyContext>();
		services.AddTransactionManagerFor<DummyContext>();

		ServiceProvider provider =
			services.BuildServiceProvider();

		ITransactionManager? transactionManager =
			provider.GetService<ITransactionManager>();

		transactionManager.ShouldNotBeNull();
	}
}