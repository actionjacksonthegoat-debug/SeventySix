using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Registration;
using Shouldly;
using Xunit;

namespace SeventySix.Shared.Tests.Registration;

public class ValidationRegistrationTests
{
	private record TestRequest(string Value);

	private record TestCommand(TestRequest Request);

	private class TestRequestValidator : AbstractValidator<TestRequest>
	{
		public TestRequestValidator() =>
			RuleFor(request => request.Value).NotEmpty();
	}

	[Fact]
	public void AddDomainValidatorsFromAssemblyContaining_RegistersRequestAndCommandValidator()
	{
		ServiceCollection services =
			new();

		// Add our request validator as Scoped (matching FluentValidation's default lifetime)
		services.AddScoped<IValidator<TestRequest>, TestRequestValidator>();

		// Use the current marker (this test assembly contains types but not the domain ones)
		services.AddDomainValidatorsFromAssemblyContaining<ValidationRegistrationTests>();

		ServiceProvider provider =
			services.BuildServiceProvider();

		using IServiceScope scope =
			provider.CreateScope();

		IValidator<TestCommand>? commandValidator =
			scope.ServiceProvider.GetService<
				IValidator<TestCommand>>();

		commandValidator.ShouldNotBeNull();

		ValidationResult validResult =
			commandValidator.Validate(
				new TestCommand(new TestRequest("ok")));

		validResult.IsValid.ShouldBeTrue();

		ValidationResult invalidResult =
			commandValidator.Validate(
				new TestCommand(new TestRequest(string.Empty)));

		invalidResult.IsValid.ShouldBeFalse();
	}
}