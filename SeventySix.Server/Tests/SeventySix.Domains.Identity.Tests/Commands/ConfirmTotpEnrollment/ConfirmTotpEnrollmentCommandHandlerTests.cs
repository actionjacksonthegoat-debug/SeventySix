// <copyright file="ConfirmTotpEnrollmentCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands;

/// <summary>
/// Unit tests for <see cref="ConfirmTotpEnrollmentCommandHandler"/>.
/// Tests the critical paths: user not found, already enrolled, invalid code, and successful enrollment.
/// </summary>
/// <remarks>
/// 80/20 Approach: Focuses on the handler orchestration (user lookup, code verification, enrollment state).
/// </remarks>
public sealed class ConfirmTotpEnrollmentCommandHandlerTests
{
	private const long TestUserId = 42;
	private const string TestPlaintextSecret = "JBSWY3DPEHPK3PXP";
	private const string TestValidCode = "123456";

	private readonly ITotpService TotpService;
	private readonly TotpSecretProtector TotpProtector;
	private readonly string ProtectedSecret;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly ITransactionManager TransactionManager;

	/// <summary>
	/// Initializes a new instance of the <see cref="ConfirmTotpEnrollmentCommandHandlerTests"/> class.
	/// </summary>
	public ConfirmTotpEnrollmentCommandHandlerTests()
	{
		TotpService =
			Substitute.For<ITotpService>();

		IDataProtectionProvider dataProtectionProvider =
			new EphemeralDataProtectionProvider();
		TotpProtector =
			new TotpSecretProtector(dataProtectionProvider);
		ProtectedSecret =
			TotpProtector.Protect(TestPlaintextSecret);

		UserManager =
			IdentityMockFactory.CreateUserManager();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
		TransactionManager =
			Substitute.For<ITransactionManager>();

		// Pass-through: execute the operation lambda directly
		TransactionManager
			.ExecuteInTransactionAsync(
				Arg.Any<Func<CancellationToken, Task>>(),
				Arg.Any<int>(),
				Arg.Any<CancellationToken>())
			.Returns(
				call =>
				{
					Func<CancellationToken, Task> operation =
						call.ArgAt<Func<CancellationToken, Task>>(0);

					return operation(CancellationToken.None);
				});
	}

	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns((ApplicationUser?)null);

		ConfirmTotpEnrollmentCommand command =
			CreateCommand(TestValidCode);

		// Act
		Result result =
			await InvokeHandlerAsync(command);

		// Assert
		result.IsSuccess.ShouldBeFalse();
	}

	[Fact]
	public async Task HandleAsync_NoTotpSecretInitiated_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(new FakeTimeProvider())
				.WithId(TestUserId)
				.Build();

		// TotpSecret is null — enrollment not initiated
		user.TotpSecret.ShouldBeNull();

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		ConfirmTotpEnrollmentCommand command =
			CreateCommand(TestValidCode);

		// Act
		Result result =
			await InvokeHandlerAsync(command);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe("TOTP enrollment not initiated");
	}

	[Fact]
	public async Task HandleAsync_AlreadyEnrolled_ReturnsFailureAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithId(TestUserId)
				.Build();

		user.TotpSecret =
			ProtectedSecret;
		user.TotpEnrolledAt =
			timeProvider.GetUtcNow();

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		ConfirmTotpEnrollmentCommand command =
			CreateCommand(TestValidCode);

		// Act
		Result result =
			await InvokeHandlerAsync(command);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe("TOTP is already confirmed");
	}

	[Fact]
	public async Task HandleAsync_InvalidCode_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(new FakeTimeProvider())
				.WithId(TestUserId)
				.Build();

		user.TotpSecret =
			ProtectedSecret;

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		TotpService
			.VerifyCode(
				TestPlaintextSecret,
				TestValidCode)
			.Returns(false);

		ConfirmTotpEnrollmentCommand command =
			CreateCommand(TestValidCode);

		// Act
		Result result =
			await InvokeHandlerAsync(command);

		// Assert
		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe("Invalid verification code");
		await SecurityAuditService
			.Received(1)
			.LogEventAsync(
				SecurityEventType.MfaFailed,
				user,
				success: false,
				details: Arg.Any<string?>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_ValidCode_EnrollsUserAndReturnsSuccessAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(new FakeTimeProvider())
				.WithId(TestUserId)
				.Build();

		user.TotpSecret =
			ProtectedSecret;

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		TotpService
			.VerifyCode(
				TestPlaintextSecret,
				TestValidCode)
			.Returns(true);

		UserManager
			.UpdateAsync(user)
			.Returns(IdentityResult.Success);

		ConfirmTotpEnrollmentCommand command =
			CreateCommand(TestValidCode);

		// Act
		Result result =
			await InvokeHandlerAsync(command);

		// Assert
		result.IsSuccess.ShouldBeTrue();
		user.MfaEnabled.ShouldBeTrue();
		user.TotpEnrolledAt.ShouldNotBeNull();
		await SecurityAuditService
			.Received(1)
			.LogEventAsync(
				SecurityEventType.TotpEnrolled,
				user,
				success: true,
				details: null,
				Arg.Any<CancellationToken>());
	}

	private ConfirmTotpEnrollmentCommand CreateCommand(string code) =>
		new(
			TestUserId,
			new ConfirmTotpEnrollmentRequest(code));

	private Task<Result> InvokeHandlerAsync(
		ConfirmTotpEnrollmentCommand command) =>
		ConfirmTotpEnrollmentCommandHandler.HandleAsync(
			command,
			TotpService,
			TotpProtector,
			UserManager,
			SecurityAuditService,
			new FakeTimeProvider(),
			TransactionManager,
			CancellationToken.None);
}
