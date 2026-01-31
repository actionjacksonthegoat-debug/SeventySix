// <copyright file="RegistrationServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for RegistrationService.
/// </summary>
/// <remarks>
/// Security-critical tests following 80/20 rule:
/// - User creation with password hashing
/// - Role assignment during registration
/// - Audit field population
/// - Error handling for failed registration
/// </remarks>
public class RegistrationServiceTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService AuthenticationService;
	private readonly ILogger<RegistrationService> Logger;

	private const string TestUsername = "newuser";
	private const string TestEmail = "newuser@example.com";
	private const string TestPassword = "SecureP@ssw0rd!";
	private const string TestCreatedBy = "admin";

	/// <summary>
	/// Initializes a new instance of the <see cref="RegistrationServiceTests"/> class.
	/// </summary>
	public RegistrationServiceTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AuthenticationService =
			Substitute.For<AuthenticationService>(
				Substitute.For<IAuthRepository>(),
				Substitute.For<ITokenService>(),
				Microsoft.Extensions.Options.Options.Create(
					new JwtSettings
					{
						AccessTokenExpirationMinutes = 15,
						RefreshTokenExpirationDays = 7,
					}),
				TimeProvider,
				Substitute.For<UserManager<ApplicationUser>>(
					Substitute.For<IUserStore<ApplicationUser>>(),
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					null));
		Logger =
			Substitute.For<ILogger<RegistrationService>>();
	}

	#region CreateUserWithCredentialAsync Tests

	/// <summary>
	/// Verifies successful user creation with password.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_ValidInput_ReturnsCreatedUserAsync()
	{
		// Arrange
		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				TestPassword)
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		RegistrationService service =
			CreateService();

		// Act
		ApplicationUser result =
			await service.CreateUserWithCredentialAsync(
				TestUsername,
				TestEmail,
				"Test User",
				TestPassword,
				TestCreatedBy,
				RoleConstants.User);

		// Assert
		result.ShouldNotBeNull();
		result.UserName.ShouldBe(TestUsername);
		result.Email.ShouldBe(TestEmail);
	}

	/// <summary>
	/// Verifies user creation sets audit fields correctly.
	/// Security: Audit trail is essential for tracking user creation.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_ValidInput_SetsAuditFieldsAsync()
	{
		// Arrange
		ApplicationUser? capturedUser = null;

		UserManager
			.CreateAsync(
				Arg.Do<ApplicationUser>(user => capturedUser = user),
				TestPassword)
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		RegistrationService service =
			CreateService();

		// Act
		await service.CreateUserWithCredentialAsync(
			TestUsername,
			TestEmail,
			null,
			TestPassword,
			TestCreatedBy,
			RoleConstants.User);

		// Assert
		capturedUser.ShouldNotBeNull();
		capturedUser.CreatedBy.ShouldBe(TestCreatedBy);
		capturedUser.CreateDate.ShouldBe(TimeProvider.GetUtcNow().UtcDateTime);
		capturedUser.IsActive.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies role is assigned after user creation.
	/// Security: Role assignment must follow user creation.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_ValidInput_AssignsRoleAsync()
	{
		// Arrange
		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				TestPassword)
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		RegistrationService service =
			CreateService();

		// Act
		await service.CreateUserWithCredentialAsync(
			TestUsername,
			TestEmail,
			null,
			TestPassword,
			TestCreatedBy,
			RoleConstants.Developer);

		// Assert
		await UserManager
			.Received(1)
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				RoleConstants.Developer);
	}

	/// <summary>
	/// Verifies exception is thrown when user creation fails.
	/// Security: Failed registration should throw, not silently continue.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_CreateFails_ThrowsExceptionAsync()
	{
		// Arrange
		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				TestPassword)
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "DuplicateUserName",
						Description = "Username already exists",
					}));

		RegistrationService service =
			CreateService();

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(
				async () => await service.CreateUserWithCredentialAsync(
					TestUsername,
					TestEmail,
					null,
					TestPassword,
					TestCreatedBy,
					RoleConstants.User));

		exception.Message.ShouldContain("Failed to create user");
	}

	/// <summary>
	/// Verifies exception is thrown when role assignment fails.
	/// Security: User without proper role should not exist.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_RoleAssignmentFails_ThrowsExceptionAsync()
	{
		// Arrange
		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				TestPassword)
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(
				IdentityResult.Failed(
					new IdentityError
					{
						Code = "InvalidRole",
						Description = "Role does not exist",
					}));

		RegistrationService service =
			CreateService();

		// Act & Assert
		InvalidOperationException exception =
			await Should.ThrowAsync<InvalidOperationException>(
				async () => await service.CreateUserWithCredentialAsync(
					TestUsername,
					TestEmail,
					null,
					TestPassword,
					TestCreatedBy,
					"NonExistentRole"));

		exception.Message.ShouldContain("Failed to assign role");
	}

	/// <summary>
	/// Verifies password is passed to UserManager for hashing.
	/// Security: Password must be hashed by Identity, not stored in plain text.
	/// </summary>
	[Fact]
	public async Task CreateUserWithCredentialAsync_ValidInput_PassesPasswordToUserManagerAsync()
	{
		// Arrange
		string? capturedPassword = null;

		UserManager
			.CreateAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Do<string>(password => capturedPassword = password))
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);

		RegistrationService service =
			CreateService();

		// Act
		await service.CreateUserWithCredentialAsync(
			TestUsername,
			TestEmail,
			null,
			TestPassword,
			TestCreatedBy,
			RoleConstants.User);

		// Assert - Verify password passed to Identity for hashing
		capturedPassword.ShouldBe(TestPassword);
	}

	#endregion

	#region GenerateAuthResultAsync Tests

	/// <summary>
	/// Verifies GenerateAuthResultAsync delegates to AuthenticationService (DRY compliance).
	/// Actual token generation logic is tested in AuthenticationServiceTests (80/20 rule).
	/// </summary>
	[Fact]
	public async Task GenerateAuthResultAsync_ValidUser_DelegatesToAuthenticationServiceAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.Build();

		AuthResult expectedResult =
			AuthResult.Succeeded(
				"access-token",
				"refresh-token",
				TimeProvider.GetUtcNow().AddMinutes(15).UtcDateTime,
				TestEmail,
				"Test User",
				requiresPasswordChange: false);

		AuthenticationService
			.GenerateAuthResultAsync(
				user,
				"127.0.0.1",
				false,
				false,
				Arg.Any<CancellationToken>())
			.Returns(expectedResult);

		RegistrationService service =
			CreateService();

		// Act
		AuthResult result =
			await service.GenerateAuthResultAsync(
				user,
				"127.0.0.1",
				requiresPasswordChange: false,
				rememberMe: false,
				CancellationToken.None);

		// Assert - Verify delegation occurred and result passed through
		await AuthenticationService
			.Received(1)
			.GenerateAuthResultAsync(
				user,
				"127.0.0.1",
				false,
				false,
				Arg.Any<CancellationToken>());

		result.ShouldBe(expectedResult);
	}

	#endregion

	#region Helper Methods

	private RegistrationService CreateService()
	{
		return new RegistrationService(
			UserManager,
			AuthenticationService,
			TimeProvider,
			Logger);
	}

	#endregion
}