// <copyright file="EmailQueueProcessJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Builders;
using Shouldly;
using Wolverine;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Unit tests for <see cref="EmailQueueProcessJobHandler"/>.
/// Tests queue processing behavior with mocked dependencies.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests critical job behavior including enabled/disabled states,
/// batch processing, and scheduling of next run.
/// </remarks>
public class EmailQueueProcessJobHandlerTests
{
	private readonly IMessageBus MessageBus;
	private readonly IEmailService EmailService;
	private readonly IRecurringJobService RecurringJobService;
	private readonly FakeTimeProvider TimeProvider;
	private readonly ILogger<EmailQueueProcessJobHandler> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailQueueProcessJobHandlerTests"/> class.
	/// </summary>
	public EmailQueueProcessJobHandlerTests()
	{
		MessageBus =
			Substitute.For<IMessageBus>();
		EmailService =
			Substitute.For<IEmailService>();
		RecurringJobService =
			Substitute.For<IRecurringJobService>();
		TimeProvider =
			new FakeTimeProvider(TestTimeProviderBuilder.DefaultTime);
		Logger =
			NullLogger<EmailQueueProcessJobHandler>.Instance;
	}

	/// <summary>
	/// Tests that handler schedules next run when email is disabled.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmailDisabled_SchedulesNextRunWithoutProcessingAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = false };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = true,
				ProcessingIntervalSeconds = 60,
			};

		EmailQueueProcessJobHandler handler =
			CreateHandler(emailSettings, queueSettings);

		EmailQueueProcessJob job =
			new();

		// Act
		await handler.HandleAsync(
			job,
			CancellationToken.None);

		// Assert - Should NOT query for pending emails
		await MessageBus
			.DidNotReceive()
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Any<GetPendingEmailsQuery>(),
				Arg.Any<CancellationToken>());

		// Assert - Should still schedule next run
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
				nameof(EmailQueueProcessJob),
				Arg.Any<DateTimeOffset>(),
				TimeSpan.FromSeconds(60),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that handler schedules next run when queue is disabled.
	/// </summary>
	[Fact]
	public async Task HandleAsync_QueueDisabled_SchedulesNextRunWithoutProcessingAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = true };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = false,
				ProcessingIntervalSeconds = 30,
			};

		EmailQueueProcessJobHandler handler =
			CreateHandler(emailSettings, queueSettings);

		EmailQueueProcessJob job =
			new();

		// Act
		await handler.HandleAsync(
			job,
			CancellationToken.None);

		// Assert - Should NOT query for pending emails
		await MessageBus
			.DidNotReceive()
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Any<GetPendingEmailsQuery>(),
				Arg.Any<CancellationToken>());

		// Assert - Should still schedule next run
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
				nameof(EmailQueueProcessJob),
				Arg.Any<DateTimeOffset>(),
				TimeSpan.FromSeconds(30),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that handler queries for pending emails when enabled.
	/// </summary>
	[Fact]
	public async Task HandleAsync_Enabled_QueriesForPendingEmailsAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = true };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = true,
				BatchSize = 10,
				ProcessingIntervalSeconds = 60,
			};

		MessageBus
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Any<GetPendingEmailsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(Array.Empty<EmailQueueEntry>());

		EmailQueueProcessJobHandler handler =
			CreateHandler(emailSettings, queueSettings);

		EmailQueueProcessJob job =
			new();

		// Act
		await handler.HandleAsync(
			job,
			CancellationToken.None);

		// Assert - Should query with correct batch size
		await MessageBus
			.Received(1)
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Is<GetPendingEmailsQuery>(
					query => query.BatchSize == 10),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that handler always schedules next run regardless of queue state.
	/// </summary>
	[Fact]
	public async Task HandleAsync_Always_SchedulesNextRunAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = true };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = true,
				BatchSize = 5,
				ProcessingIntervalSeconds = 120,
			};

		MessageBus
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Any<GetPendingEmailsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(Array.Empty<EmailQueueEntry>());

		EmailQueueProcessJobHandler handler =
			CreateHandler(emailSettings, queueSettings);

		EmailQueueProcessJob job =
			new();

		// Act
		await handler.HandleAsync(
			job,
			CancellationToken.None);

		// Assert
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
				nameof(EmailQueueProcessJob),
				TimeProvider.GetUtcNow(),
				TimeSpan.FromSeconds(120),
				Arg.Any<CancellationToken>());
	}

	private EmailQueueProcessJobHandler CreateHandler(
		EmailSettings emailSettings,
		EmailQueueSettings queueSettings) =>
		new(
			MessageBus,
			EmailService,
			RecurringJobService,
			Options.Create(emailSettings),
			Options.Create(queueSettings),
			TimeProvider,
			Logger);
}