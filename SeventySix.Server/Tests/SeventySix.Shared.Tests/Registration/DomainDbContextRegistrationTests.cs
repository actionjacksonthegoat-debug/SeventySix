using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using SeventySix.Shared.Registration;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Persistence;
using Shouldly;
using Xunit;

namespace SeventySix.Shared.Tests.Registration;

public class FakeDbContext(DbContextOptions<FakeDbContext> options)
	: DbContext(options);

public class DomainDbContextRegistrationTests
{
	[Fact]
	public void AddDomainDbContext_RegistersDbContextAndInterceptor()
	{
		ServiceCollection services = new();

		// Add a fake AuditInterceptor so registration can resolve it
		IUserContextAccessor mockUserContext =
			Substitute.For<IUserContextAccessor>();

		services.AddSingleton(
			new AuditInterceptor(mockUserContext, TimeProvider.System));

		services.AddDomainDbContext<FakeDbContext>(
			"Host=localhost;Database=test;Username=user;Password=pass",
			"TestSchema");

		ServiceProvider provider =
			services.BuildServiceProvider();

		// Resolve DbContextOptions and ensure options are configured
		DbContextOptions<FakeDbContext> options =
			provider.GetRequiredService<
			DbContextOptions<FakeDbContext>>();

		options.ShouldNotBeNull();

		// Resolving DbContext should succeed (scoped) - create a scope
		using IServiceScope scope =
			provider.CreateScope();

		FakeDbContext context =
			scope.ServiceProvider.GetRequiredService<FakeDbContext>();

		context.ShouldNotBeNull();
	}
}