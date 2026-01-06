using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for <see cref="AdminSeederService"/>.
/// </summary>
public class AdminSeederServiceUnitTests
{
	[Fact]
	/// <summary>
	/// Seeds admin user when none exists and verifies the created account requires password change.
	/// </summary>
	public async Task SeedAdminUserForTestsAsync_WhenNoAdmin_CreatesAdminWithRequiresPasswordChangeAsync()
	{
		(
			IServiceScopeFactory? scopeFactory,
			IServiceProvider? serviceProvider,
			UserManager<ApplicationUser>? userManager,
			RoleManager<ApplicationRole>? roleManager
		) = CreateScopeWithManagers();

		AdminSeederSettings settings = CreateDefaultSettings();
		IOptions<AdminSeederSettings> options =
			Options.Create(settings);
		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		ILogger<AdminSeederService> logger =
			Substitute.For<
			ILogger<AdminSeederService>
		>();

		serviceProvider
			.GetService(typeof(UserManager<ApplicationUser>))
			.Returns(userManager);
		serviceProvider
			.GetService(typeof(RoleManager<ApplicationRole>))
			.Returns(roleManager);

		userManager
			.FindByNameAsync(settings.Username)
			.Returns((ApplicationUser?)null);
		userManager
			.GetUsersInRoleAsync(RoleConstants.Admin)
			.Returns(new List<ApplicationUser>());
		roleManager
			.FindByNameAsync(RoleConstants.Admin)
			.Returns(new ApplicationRole { Name = RoleConstants.Admin });

		userManager
			.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>())
			.Returns(IdentityResult.Success);
		userManager
			.AddToRoleAsync(Arg.Any<ApplicationUser>(), RoleConstants.Admin)
			.Returns(IdentityResult.Success);

		AdminSeederService service =
			new(
			scopeFactory,
			options,
			timeProvider,
			logger);

		// Act
		await service.SeedAdminUserAsync(CancellationToken.None);

		// Assert
		await userManager
			.Received(1)
			.CreateAsync(
				Arg.Is<ApplicationUser>(user =>
					user.RequiresPasswordChange == true),
				settings.InitialPassword);
		await userManager
			.Received(1)
			.AddToRoleAsync(Arg.Any<ApplicationUser>(), RoleConstants.Admin);
	}

	[Fact]
	/// <summary>
	/// When an admin account exists without the requires-password-change flag, the seeder should not modify it.
	/// </summary>
	public async Task SeedAdminUserForTestsAsync_WhenExistingAdminWithoutFlag_UpdatesExistingAdminAsync()
	{
		// Arrange
		(
			IServiceScopeFactory? scopeFactory,
			IServiceProvider? serviceProvider,
			UserManager<ApplicationUser>? userManager,
			RoleManager<ApplicationRole>? roleManager
		) = CreateScopeWithManagers();

		AdminSeederSettings settings = CreateDefaultSettings();
		IOptions<AdminSeederSettings> options =
			Options.Create(settings);
		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();
		ILogger<AdminSeederService> logger =
			Substitute.For<
			ILogger<AdminSeederService>
		>();

		serviceProvider
			.GetService(typeof(UserManager<ApplicationUser>))
			.Returns(userManager);
		serviceProvider
			.GetService(typeof(RoleManager<ApplicationRole>))
			.Returns(roleManager);

		ApplicationUser existing =
			new()
			{
				UserName = settings.Username,
				RequiresPasswordChange = false,
			};
		userManager.FindByNameAsync(settings.Username).Returns(existing);
		userManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		AdminSeederService service =
			new(
			scopeFactory,
			options,
			timeProvider,
			logger);

		// Act
		await service.SeedAdminUserAsync(CancellationToken.None);

		// Assert
		// Seeder should not update an existing admin's RequiresPasswordChange flag
		await userManager
			.DidNotReceive()
			.UpdateAsync(Arg.Any<ApplicationUser>());
	}

	/// <summary>
	/// Create a scope factory and mocked user/role managers used across tests.
	/// </summary>
	private static (
		IServiceScopeFactory scopeFactory,
		IServiceProvider serviceProvider,
		UserManager<ApplicationUser> userManager,
		RoleManager<ApplicationRole> roleManager
	) CreateScopeWithManagers()
	{
		IServiceScopeFactory scopeFactory =
			Substitute.For<IServiceScopeFactory>();
		IServiceScope scope =
			Substitute.For<IServiceScope>();

		// Use a real ServiceProvider so GetRequiredService<T>() behaves as in production.
		UserManager<ApplicationUser> userManager =
			Substitute.For<
			UserManager<ApplicationUser>
		>(
			Substitute.For<IUserStore<ApplicationUser>>(),
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null);

		RoleManager<ApplicationRole> roleManager =
			new RoleManager<ApplicationRole>(
				Substitute.For<IRoleStore<ApplicationRole>>(),
				Enumerable.Empty<IRoleValidator<ApplicationRole>>(),
				Substitute.For<ILookupNormalizer>(),
				new IdentityErrorDescriber(),
				Substitute.For<ILogger<RoleManager<ApplicationRole>>>());

		ServiceCollection services =
			new Microsoft.Extensions.DependencyInjection.ServiceCollection();
		services.AddSingleton(userManager);
		services.AddSingleton(roleManager);
		IServiceProvider serviceProvider =
			services.BuildServiceProvider();

		scopeFactory.CreateScope().Returns(scope);
		scope.ServiceProvider.Returns(serviceProvider);

		return (scopeFactory, serviceProvider, userManager, roleManager);
	}

	private static AdminSeederSettings CreateDefaultSettings()
	{
		return new AdminSeederSettings
		{
			Enabled = true,
			Username = "admin",
			Email = "admin@example.com",
			InitialPassword = "TempPass123!",
		};
	}
}