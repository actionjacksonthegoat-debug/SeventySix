using NSubstitute;
using SeventySix.Shared.Persistence;
using Shouldly;
using Wolverine;

namespace SeventySix.Shared.Tests.Persistence;

public sealed class DummyQuery;

public sealed class WolverineHealthCheckTests
{
	[Fact]
	public async Task CheckHealthAsync_InvokesMessageBusAndReturnsResultAsync()
	{
		IMessageBus messageBus = Substitute.For<IMessageBus>();

		messageBus
			.InvokeAsync<bool>(
				Arg.Any<DummyQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		WolverineHealthCheck<DummyQuery> healthCheck =
			new(messageBus, "Dummy");

		healthCheck.ContextName.ShouldBe("Dummy");

		bool result =
			await healthCheck.CheckHealthAsync();

		result.ShouldBeTrue();
	}
}