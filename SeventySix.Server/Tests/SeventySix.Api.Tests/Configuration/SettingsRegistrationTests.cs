// <copyright file="SettingsRegistrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Tests that verify settings classes have exactly one DI registration source.
/// Guards against the duplicate-registration defect where the same settings class
/// is registered in multiple places (e.g., Program.cs and ApplicationServicesRegistration).
/// </summary>
public sealed class SettingsRegistrationTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	/// <summary>
	/// Initializes a new instance of the <see cref="SettingsRegistrationTests"/> class.
	/// </summary>
	public SettingsRegistrationTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
				connectionString: "InMemory");
	}

	/// <summary>
	/// Verifies that <see cref="RequestLimitsSettings"/> is bound from configuration
	/// exactly once. Two calls to <c>AddDomainSettings&lt;RequestLimitsSettings, …&gt;</c>
	/// would register two <see cref="IConfigureOptions{TOptions}"/> entries, causing
	/// ValidateOnStart to run twice and creating ambiguity about which registration wins.
	/// </summary>
	[Fact]
	public void RequestLimitsSettings_HasExactlyOneConfigureOptionsRegistration()
	{
		// Arrange + Act
		IEnumerable<IConfigureOptions<RequestLimitsSettings>> configurators =
			Factory.Services.GetServices<IConfigureOptions<RequestLimitsSettings>>();

		// Assert — exactly one binding source; duplicate registration is a defect
		configurators.Count().ShouldBe(1);
	}

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}