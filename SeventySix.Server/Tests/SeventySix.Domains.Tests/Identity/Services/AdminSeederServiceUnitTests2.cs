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

public class AdminSeederServiceUnitTests2
{
	[Fact]
	public async Task SeedAdminUserForTestsAsync_WhenNoAdmin_CreatesAdminWithRequiresPasswordChangeAsync()
	{
		// Arrange
		IServiceScopeFactory scopeFactory = Substitute.For<IServiceScopeFactory>();
		IServiceScope scope = Substitute.For<IServiceScope>();
		IServiceProvider serviceProvider = Substitute.For<IServiceProvider>();
		scopeFactory.CreateScope().Returns(scope);
		scope.ServiceProvider.Returns(serviceProvider);

		UserManager<ApplicationUser> userManager =
			Substitute.For<UserManager<ApplicationUser>>(
				Substitute.For<IUserStore<ApplicationUser>>(),
				null, null, null, null, null, null, null, null);

		RoleManager<ApplicationRole> roleManager =
			new RoleManager<ApplicationRole>(
				Substitute.For<IRoleStore<ApplicationRole>>(),
				Enumerable.Empty<IRoleValidator<ApplicationRole>>(),
				Substitute.For<ILookupNormalizer>(),
				new IdentityErrorDescriber(),
				Substitute.For<ILogger<RoleManager<ApplicationRole>>>());

		serviceProvider.GetService(typeof(UserManager<ApplicationUser>)).Returns(userManager);
		serviceProvider.GetService(typeof(RoleManager<ApplicationRole>)).Returns(roleManager);

		AdminSeederSettings settings = new()
		{
			Enabled = true,
			Username = "admin",
			Email = "admin@example.com",
			InitialPassword = "TempPass123!",
		};

		IOptions<AdminSeederSettings> options = Options.Create(settings);

		TimeProvider timeProvider = Substitute.For<TimeProvider>();
		ILogger<AdminSeederService> logger = Substitute.For<ILogger<AdminSeederService>>();

		userManager.FindByNameAsync(settings.Username).Returns((ApplicationUser?)null);
		userManager.GetUsersInRoleAsync(RoleConstants.Admin).Returns(new List<ApplicationUser>());
		roleManager.FindByNameAsync(RoleConstants.Admin).Returns(new ApplicationRole { Name = RoleConstants.Admin });

		userManager.CreateAsync(Arg.Any<ApplicationUser>(), Arg.Any<string>()).Returns(IdentityResult.Success);
		userManager.AddToRoleAsync(Arg.Any<ApplicationUser>(), RoleConstants.Admin).Returns(IdentityResult.Success);

		AdminSeederService service = new(
			scopeFactory,
			options,
			timeProvider,
			logger);

		// Act
		await service.SeedAdminUserForTestsAsync(CancellationToken.None);

		// Assert
		await userManager.Received(1).CreateAsync(Arg.Is<ApplicationUser>(u => u.RequiresPasswordChange == true), settings.InitialPassword);
		await userManager.Received(1).AddToRoleAsync(Arg.Any<ApplicationUser>(), RoleConstants.Admin);
	}

	[Fact]
	public async Task SeedAdminUserForTestsAsync_WhenExistingAdminWithoutFlag_UpdatesExistingAdminAsync()
	{
		// Arrange
		IServiceScopeFactory scopeFactory = Substitute.For<IServiceScopeFactory>();
		IServiceScope scope = Substitute.For<IServiceScope>();
		IServiceProvider serviceProvider = Substitute.For<IServiceProvider>();
		scopeFactory.CreateScope().Returns(scope);
		scope.ServiceProvider.Returns(serviceProvider);

		UserManager<ApplicationUser> userManager =
			Substitute.For<UserManager<ApplicationUser>>(
				Substitute.For<IUserStore<ApplicationUser>>(),
				null, null, null, null, null, null, null, null);

		RoleManager<ApplicationRole> roleManager =
			new RoleManager<ApplicationRole>(
				Substitute.For<IRoleStore<ApplicationRole>>(),
				Enumerable.Empty<IRoleValidator<ApplicationRole>>(),
				Substitute.For<ILookupNormalizer>(),
				new IdentityErrorDescriber(),
				Substitute.For<ILogger<RoleManager<ApplicationRole>>>());

		serviceProvider.GetService(typeof(UserManager<ApplicationUser>)).Returns(userManager);
		serviceProvider.GetService(typeof(RoleManager<ApplicationRole>)).Returns(roleManager);

		AdminSeederSettings settings = new()
		{
			Enabled = true,
			Username = "admin",
			Email = "admin@example.com",
			InitialPassword = "TempPass123!",
		};

		IOptions<AdminSeederSettings> options = Options.Create(settings);

		TimeProvider timeProvider = Substitute.For<TimeProvider>();
		ILogger<AdminSeederService> logger = Substitute.For<ILogger<AdminSeederService>>();

		ApplicationUser existing = new() { UserName = settings.Username, RequiresPasswordChange = false };
		userManager.FindByNameAsync(settings.Username).Returns(existing);
		userManager.UpdateAsync(Arg.Any<ApplicationUser>()).Returns(IdentityResult.Success);

		AdminSeederService service = new(
			scopeFactory,
			options,
			timeProvider,
			logger);

		// Act
		await service.SeedAdminUserForTestsAsync(CancellationToken.None);

		// Assert
		await userManager.Received(1).UpdateAsync(Arg.Is<ApplicationUser>(u => u.RequiresPasswordChange == true));
	}
}