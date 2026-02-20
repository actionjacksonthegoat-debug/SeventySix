// <copyright file="EmailQueueProcessJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Jobs;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.TestUtilities.Builders;
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
public sealed class EmailQueueProcessJobHandlerTests
{
	private readonly IMessageBus MessageBus;
	private readonly IEmailService EmailService;
	private readonly IRecurringJobService RecurringJobService;
	private readonly IRateLimitingService RateLimitingService;
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
		RateLimitingService =
			Substitute.For<IRateLimitingService>();
		TimeProvider =
			new FakeTimeProvider(TestTimeProviderBuilder.DefaultTime);
		Logger =
			NullLogger<EmailQueueProcessJobHandler>.Instance;

		RateLimitingService
			.CanMakeRequestAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(true);
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

	/// <summary>
	/// Tests that handler skips batch and schedules backoff when rate limited.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RateLimited_SkipsBatchAndSchedulesBackoffAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = true };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = true,
				BatchSize = 10,
				ProcessingIntervalSeconds = 30,
				RateLimitBackoffMinutes = 15,
			};

		RateLimitingService
			.CanMakeRequestAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>())
			.Returns(false);

		RateLimitingService
			.GetTimeUntilReset()
			.Returns(TimeSpan.Zero);

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

		// Assert - Should schedule with backoff interval (fallback since TimeUntilReset is Zero)
		await RecurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
				nameof(EmailQueueProcessJob),
				Arg.Any<DateTimeOffset>(),
				TimeSpan.FromMinutes(15),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that handler stops processing remaining emails when rate limit is hit mid-batch.
	/// </summary>
	[Fact]
	public async Task HandleAsync_RateLimitMidBatch_StopsProcessingRemainingEmailsAsync()
	{
		// Arrange
		EmailSettings emailSettings =
			new() { Enabled = true };

		EmailQueueSettings queueSettings =
			new()
			{
				Enabled = true,
				BatchSize = 10,
				ProcessingIntervalSeconds = 30,
				RateLimitBackoffMinutes = 15,
			};

		List<EmailQueueEntry> pendingEmails =
			[
				new()
				{
					Id = 1,
					EmailType = "Welcome",
					RecipientEmail = "first@test.local",
					TemplateData = """{"username":"User1","resetToken":"token1"}""",
				},
				new()
				{
					Id = 2,
					EmailType = "Welcome",
					RecipientEmail = "second@test.local",
					TemplateData = """{"username":"User2","resetToken":"token2"}""",
				},
				new()
				{
					Id = 3,
					EmailType = "Welcome",
					RecipientEmail = "third@test.local",
					TemplateData = """{"username":"User3","resetToken":"token3"}""",
				},
			];

		MessageBus
			.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				Arg.Any<GetPendingEmailsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(pendingEmails);

		// First email succeeds, second throws rate limit
		EmailService
			.SendWelcomeEmailAsync(
				"first@test.local",
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		EmailService
			.SendWelcomeEmailAsync(
				"second@test.local",
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Throws(new EmailRateLimitException());

		EmailQueueProcessJobHandler handler =
			CreateHandler(emailSettings, queueSettings);

		EmailQueueProcessJob job =
			new();

		// Act
		await handler.HandleAsync(
			job,
			CancellationToken.None);

		// Assert - First email should be marked as sent
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<MarkEmailSentCommand>(
					command => command.EmailQueueId == 1),
				Arg.Any<CancellationToken>());

		// Assert - Second email should be marked as failed
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Is<MarkEmailFailedCommand>(
					command => command.EmailQueueId == 2),
				Arg.Any<CancellationToken>());

		// Assert - Third email should NOT be processed at all
		await EmailService
			.DidNotReceive()
			.SendWelcomeEmailAsync(
				"third@test.local",
				Arg.Any<string>(),
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	private EmailQueueProcessJobHandler CreateHandler(
		EmailSettings emailSettings,
		EmailQueueSettings queueSettings) =>
		new(
			MessageBus,
			EmailService,
			RecurringJobService,
			RateLimitingService,
			Options.Create(emailSettings),
			Options.Create(queueSettings),
			TimeProvider,
			Logger);
}