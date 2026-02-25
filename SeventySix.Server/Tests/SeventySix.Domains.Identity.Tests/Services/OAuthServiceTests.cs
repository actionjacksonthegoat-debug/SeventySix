// <copyright file="OAuthServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for OAuthService.
/// </summary>
/// <remarks>
/// Security-critical tests following 80/20 rule:
/// - Provider delegation via OAuthProviderFactory
/// - Callback error handling (provider not configured, strategy exceptions)
/// - Display Name sync on login
/// - User creation via FindByLoginAsync fallback
/// </remarks>
public sealed class OAuthServiceTests
{
	private readonly FakeTimeProvider TimeProvider =
		TestDates.CreateDefaultTimeProvider();

	private readonly UserManager<ApplicationUser> UserManager;
	private readonly OAuthProviderFactory ProviderFactory;
	private readonly IOAuthProviderStrategy MockStrategy;
	private readonly IOptions<AuthSettings> AuthSettings;
	private readonly AuthenticationService AuthenticationService;
	private readonly ILogger<OAuthService> Logger;

	private const string TestState = "test-state-12345";
	private const string TestCodeVerifier = "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklm";
	private const string TestAuthorizationCode = "auth-code-from-github";
	private const string TestClientId = "test-client-id";
	private const string TestClientSecret = "test-client-secret";
	private const string TestRedirectUri = "https://localhost/oauth/callback";
	private const string TestProvider = "GitHub";
	private const string TestProviderUserId = "12345";
	private const string TestUsername = "testuser";
	private const string TestEmail = "test@example.com";
	private const string TestIpAddress = "127.0.0.1";

	/// <summary>
	/// Initializes a new instance of the <see cref="OAuthServiceTests"/> class.
	/// </summary>
	public OAuthServiceTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		Logger =
			Substitute.For<ILogger<OAuthService>>();

		// Create mock strategy
		MockStrategy =
			Substitute.For<IOAuthProviderStrategy>();
		MockStrategy.ProviderName.Returns(TestProvider);

		// Create real factory with mock strategy
		ProviderFactory =
			new OAuthProviderFactory([MockStrategy]);

		AuthSettings settings =
			new()
			{
				OAuth =
					new OAuthSettings
					{
						Providers =
							[
								new OAuthProviderSettings
								{
									Provider = OAuthProviderConstants.GitHub,
									ClientId = TestClientId,
									ClientSecret = TestClientSecret,
									RedirectUri = TestRedirectUri,
									AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
									TokenEndpoint = "https://github.com/login/oauth/access_token",
									Scopes = "user:email",
								},
							],
					},
			};

		AuthSettings =
			Options.Create(settings);
	}

	#region BuildAuthorizationUrl Tests

	/// <summary>
	/// Verifies BuildAuthorizationUrl delegates to the provider strategy.
	/// </summary>
	[Fact]
	public void BuildAuthorizationUrl_ValidProvider_DelegatesToProviderStrategy()
	{
		// Arrange
		OAuthService service =
			CreateService();

		string expectedUrl =
			"https://github.com/login/oauth/authorize?test=1";

		MockStrategy
			.BuildAuthorizationUrl(
				Arg.Any<OAuthProviderSettings>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(expectedUrl);

		// Act
		string url =
			service.BuildAuthorizationUrl(
				TestProvider,
				TestRedirectUri,
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldBe(expectedUrl);
		MockStrategy
			.Received(1)
			.BuildAuthorizationUrl(
				Arg.Any<OAuthProviderSettings>(),
				TestRedirectUri,
				TestState,
				TestCodeVerifier);
	}

	/// <summary>
	/// Verifies service throws when provider is not configured in settings.
	/// </summary>
	[Fact]
	public void BuildAuthorizationUrl_ProviderNotConfigured_ThrowsInvalidOperationException()
	{
		// Arrange
		IOptions<AuthSettings> emptySettings =
			Options.Create(
			new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					Providers = [],
				},
			});

		OAuthService service =
			new(
				UserManager,
				ProviderFactory,
				emptySettings,
				TimeProvider,
				AuthenticationService,
				Logger);

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(() =>
				service.BuildAuthorizationUrl(
					TestProvider,
					TestRedirectUri,
					TestState,
					TestCodeVerifier));

		exception.Message.ShouldContain(TestProvider);
	}

	#endregion

	#region HandleCallbackAsync Tests

	/// <summary>
	/// Verifies callback returns failure when provider is not configured.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_ProviderNotConfigured_ReturnsFailureAsync()
	{
		// Arrange
		IOptions<AuthSettings> emptySettings =
			Options.Create(
			new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					Providers = [],
				},
			});

		OAuthService service =
			new(
				UserManager,
				ProviderFactory,
				emptySettings,
				TimeProvider,
				AuthenticationService,
				Logger);

		// Act
		AuthResult result =
			await service.HandleCallbackAsync(
				TestProvider,
				TestAuthorizationCode,
				TestRedirectUri,
				TestCodeVerifier,
				TestIpAddress,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.Error!.ShouldContain("not configured", Case.Insensitive);
	}

	/// <summary>
	/// Verifies callback returns failure when token exchange throws.
	/// Security: Error responses should not leak implementation details.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_TokenExchangeFails_ReturnsFailureAsync()
	{
		// Arrange
		MockStrategy
			.ExchangeCodeForTokenAsync(
				Arg.Any<OAuthProviderSettings>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new HttpRequestException("Token exchange failed"));

		OAuthService service =
			CreateService();

		// Act
		AuthResult result =
			await service.HandleCallbackAsync(
				TestProvider,
				TestAuthorizationCode,
				TestRedirectUri,
				TestCodeVerifier,
				TestIpAddress,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.OAuthError);
	}

	/// <summary>
	/// Verifies callback creates user and returns auth result for new OAuth user.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_NewUser_CreatesUserAndExternalLoginAsync()
	{
		// Arrange
		OAuthUserInfoResult userInfo =
			new(
				ProviderId: TestProviderUserId,
				Login: TestUsername,
				Email: TestEmail,
				FullName: "Test User",
				AvatarUrl: null);

		SetupStrategyForSuccessfulCallback(userInfo);
		SetupUserManagerForNewUser();

		ApplicationUser createdUser =
			new UserBuilder(TimeProvider)
				.WithId(1)
				.WithUsername(TestUsername)
				.WithEmail(TestEmail)
				.Build();

		IdentityMockFactory.ConfigureAuthServiceForSuccess(
			AuthenticationService,
			createdUser);

		OAuthService service =
			CreateService();

		// Act
		AuthResult result =
			await service.HandleCallbackAsync(
				TestProvider,
				TestAuthorizationCode,
				TestRedirectUri,
				TestCodeVerifier,
				TestIpAddress,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		await UserManager
			.Received(1)
			.CreateAsync(
				Arg.Any<ApplicationUser>());
		await UserManager
			.Received(1)
			.AddLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Is<UserLoginInfo>(login =>
					login.LoginProvider == TestProvider
					&& login.ProviderKey == TestProviderUserId));
	}

	/// <summary>
	/// Verifies callback returns auth result for existing OAuth user.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_ExistingUser_ReturnsAuthResultAsync()
	{
		// Arrange
		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername("existinguser")
				.WithEmail("existing@example.com")
				.WithFullName("Existing User")
				.Build();

		OAuthUserInfoResult userInfo =
			new(
				ProviderId: TestProviderUserId,
				Login: "existinguser",
				Email: "existing@example.com",
				FullName: "Existing User",
				AvatarUrl: null);

		SetupStrategyForSuccessfulCallback(userInfo);

		UserManager
			.FindByLoginAsync(TestProvider, TestProviderUserId)
			.Returns(existingUser);

		IdentityMockFactory.ConfigureAuthServiceForSuccess(
			AuthenticationService,
			existingUser);

		OAuthService service =
			CreateService();

		// Act
		AuthResult result =
			await service.HandleCallbackAsync(
				TestProvider,
				TestAuthorizationCode,
				TestRedirectUri,
				TestCodeVerifier,
				TestIpAddress,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		await UserManager
			.DidNotReceive()
			.CreateAsync(Arg.Any<ApplicationUser>());
	}

	/// <summary>
	/// Verifies Display Name is synced from provider when user's is empty.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_ExistingUser_SyncsDisplayNameWhenEmptyAsync()
	{
		// Arrange
		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername("existinguser")
				.WithEmail("existing@example.com")
				.WithFullName(null)
				.Build();

		OAuthUserInfoResult userInfo =
			new(
				ProviderId: TestProviderUserId,
				Login: "existinguser",
				Email: "existing@example.com",
				FullName: "Provider Display Name",
				AvatarUrl: null);

		SetupStrategyForSuccessfulCallback(userInfo);

		UserManager
			.FindByLoginAsync(TestProvider, TestProviderUserId)
			.Returns(existingUser);

		UserManager
			.UpdateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		IdentityMockFactory.ConfigureAuthServiceForSuccess(
			AuthenticationService,
			existingUser);

		OAuthService service =
			CreateService();

		// Act
		await service.HandleCallbackAsync(
			TestProvider,
			TestAuthorizationCode,
			TestRedirectUri,
			TestCodeVerifier,
			TestIpAddress,
			CancellationToken.None);

		// Assert
		existingUser.FullName.ShouldBe("Provider Display Name");
		await UserManager
			.Received(1)
			.UpdateAsync(
				Arg.Is<ApplicationUser>(user =>
					user.FullName == "Provider Display Name"));
	}

	/// <summary>
	/// Verifies Display Name is NOT overwritten when user already has one.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_ExistingUser_DoesNotOverwriteManualDisplayNameAsync()
	{
		// Arrange
		ApplicationUser existingUser =
			new UserBuilder(TimeProvider)
				.WithId(42)
				.WithUsername("existinguser")
				.WithEmail("existing@example.com")
				.WithFullName("My Manual Name")
				.Build();

		OAuthUserInfoResult userInfo =
			new(
				ProviderId: TestProviderUserId,
				Login: "existinguser",
				Email: "existing@example.com",
				FullName: "Provider Display Name",
				AvatarUrl: null);

		SetupStrategyForSuccessfulCallback(userInfo);

		UserManager
			.FindByLoginAsync(TestProvider, TestProviderUserId)
			.Returns(existingUser);

		IdentityMockFactory.ConfigureAuthServiceForSuccess(
			AuthenticationService,
			existingUser);

		OAuthService service =
			CreateService();

		// Act
		await service.HandleCallbackAsync(
			TestProvider,
			TestAuthorizationCode,
			TestRedirectUri,
			TestCodeVerifier,
			TestIpAddress,
			CancellationToken.None);

		// Assert
		existingUser.FullName.ShouldBe("My Manual Name");
		await UserManager
			.DidNotReceive()
			.UpdateAsync(Arg.Any<ApplicationUser>());
	}

	/// <summary>
	/// Verifies callback throws when provider is not registered in factory.
	/// </summary>
	[Fact]
	public async Task HandleCallbackAsync_InvalidProvider_ReturnsFailureAsync()
	{
		// Arrange
		OAuthService service =
			CreateService();

		// Act
		AuthResult result =
			await service.HandleCallbackAsync(
				"unknown-provider",
				TestAuthorizationCode,
				TestRedirectUri,
				TestCodeVerifier,
				TestIpAddress,
				CancellationToken.None);

		// Assert — provider not in settings → returns failure
		result.Success.ShouldBeFalse();
	}

	#endregion

	#region Helper Methods

	private OAuthService CreateService()
	{
		return new OAuthService(
			UserManager,
			ProviderFactory,
			AuthSettings,
			TimeProvider,
			AuthenticationService,
			Logger);
	}

	private void SetupStrategyForSuccessfulCallback(OAuthUserInfoResult userInfo)
	{
		MockStrategy
			.ExchangeCodeForTokenAsync(
				Arg.Any<OAuthProviderSettings>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns("mock-access-token");

		MockStrategy
			.GetUserInfoAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(userInfo);
	}

	private void SetupUserManagerForNewUser()
	{
		UserManager
			.FindByLoginAsync(
				Arg.Any<string>(),
				Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		UserManager
			.FindByNameAsync(Arg.Any<string>())
			.Returns(default(ApplicationUser?));

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		UserManager
			.AddLoginAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<UserLoginInfo>())
			.Returns(IdentityResult.Success);

		UserManager
			.AddToRoleAsync(
				Arg.Any<ApplicationUser>(),
				Arg.Any<string>())
			.Returns(IdentityResult.Success);
	}

	#endregion
}