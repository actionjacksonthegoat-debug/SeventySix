// <copyright file="GenerateBackupCodesCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands;

/// <summary>
/// Unit tests for <see cref="GenerateBackupCodesCommandHandler"/>.
/// Tests user validation and successful code generation.
/// </summary>
/// <remarks>
/// 80/20 Approach: Focuses on user lookup and happy path code generation.
/// </remarks>
public sealed class GenerateBackupCodesCommandHandlerTests
{
	private const long TestUserId = 42;

	private readonly IBackupCodeService BackupCodeService;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="GenerateBackupCodesCommandHandlerTests"/> class.
	/// </summary>
	public GenerateBackupCodesCommandHandlerTests()
	{
		BackupCodeService =
			Substitute.For<IBackupCodeService>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
	}

	[Fact]
	public async Task HandleAsync_UserNotFound_ReturnsFailureAsync()
	{
		// Arrange
		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(default(ApplicationUser?));

		GenerateBackupCodesCommand command =
			new(TestUserId);

		// Act
		BackupCodesResult result =
			await GenerateBackupCodesCommandHandler.HandleAsync(
				command,
				BackupCodeService,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
		result.Codes.ShouldBeNull();
	}

	[Fact]
	public async Task HandleAsync_ValidUser_ReturnsGeneratedCodesAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(new Microsoft.Extensions.Time.Testing.FakeTimeProvider())
				.WithId(TestUserId)
				.Build();

		IReadOnlyList<string> generatedCodes =
			["AAAA-1111", "BBBB-2222", "CCCC-3333"];

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		BackupCodeService
			.GenerateCodesAsync(
				TestUserId,
				Arg.Any<CancellationToken>())
			.Returns(generatedCodes);

		GenerateBackupCodesCommand command =
			new(TestUserId);

		// Act
		BackupCodesResult result =
			await GenerateBackupCodesCommandHandler.HandleAsync(
				command,
				BackupCodeService,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.Codes.ShouldNotBeNull();
		result.Codes.ShouldBe(generatedCodes);
		await SecurityAuditService
			.Received(1)
			.LogEventAsync(
				SecurityEventType.BackupCodesRegenerated,
				user,
				success: true,
				details: Arg.Any<string?>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_InactiveUser_ReturnsFailureAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(new Microsoft.Extensions.Time.Testing.FakeTimeProvider())
				.WithId(TestUserId)
				.WithIsActive(false)
				.Build();

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

		GenerateBackupCodesCommand command =
			new(TestUserId);

		// Act
		BackupCodesResult result =
			await GenerateBackupCodesCommandHandler.HandleAsync(
				command,
				BackupCodeService,
				UserManager,
				SecurityAuditService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.InvalidCredentials);
	}
}