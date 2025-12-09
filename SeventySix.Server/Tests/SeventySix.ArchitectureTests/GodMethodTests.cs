// <copyright file="GodMethodTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to prevent god methods.
/// Methods with 50+ lines violate SRP and must be split.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - Under 50 lines: OK - focused method
/// - 50+ lines: MUST SPLIT - violates single responsibility
/// Counts non-blank, non-comment lines only.
/// </remarks>
public class GodMethodTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Maximum allowed lines per method before requiring split.
	/// </summary>
	private const int MaxLinesPerMethod = 49;

	/// <summary>
	/// Methods that are explicitly allowed to exceed the line limit.
	/// These are technical debt items to be refactored.
	/// </summary>
	private static readonly HashSet<string> AllowedExceptions =
		[
			// DI Configuration - acceptable for setup methods
			"SeventySix\\DependencyExtensions\\IdentityExtensions.cs::AddIdentityDomain",
			"SeventySix.Api\\Extensions\\AuthenticationExtensions.cs::AddAuthenticationServices",
			"SeventySix.Api\\Extensions\\ServiceCollectionExtensions.cs::AddConfiguredRateLimiting",

			// Middleware - initialization and exception handling
			"SeventySix.Api\\Middleware\\AttributeBasedSecurityHeadersMiddleware.cs::AttributeBasedSecurityHeadersMiddleware",
			"SeventySix.Api\\Middleware\\GlobalExceptionMiddleware.cs::GlobalExceptionMiddleware",
			"SeventySix.Api\\Middleware\\GlobalExceptionMiddleware.cs::HandleExceptionAsync",

			// Infrastructure services and health checks
			"SeventySix.Api\\HealthChecks\\JaegerHealthCheck.cs::CheckHealthAsync",
			"SeventySix.Api\\Logging\\DatabaseLogSink.cs::EmitAsync",
			"SeventySix\\Infrastructure\\Services\\RateLimitingService.cs::TryIncrementRequestCountAsync",
			"SeventySix\\ElectronicNotifications\\Emails\\Services\\EmailService.cs::SendEmailAsync",

			// EF Core Configurations - fluent API chains
			"SeventySix\\Identity\\Configurations\\SecurityRoleConfiguration.cs::Configure",
			"SeventySix\\Identity\\Configurations\\UserConfiguration.cs::Configure",

			// Seeding and complex business logic - to be migrated to Wolverine handlers
			"SeventySix\\Identity\\Services\\AdminSeederService.cs::SeedAdminUserAsync",
			"SeventySix\\Identity\\Services\\AuthService.cs::LoginAsync",
			"SeventySix\\Identity\\Services\\AuthService.cs::RefreshTokensAsync",
			"SeventySix\\Identity\\Services\\AuthService.cs::FindOrCreateGitHubUserAsync",
			"SeventySix\\Identity\\Services\\PermissionRequestService.cs::CreateRequestsAsync",
			"SeventySix\\Identity\\Services\\TokenService.cs::RotateRefreshTokenAsync",

			// CQRS command handlers - complex business logic
			"SeventySix\\Identity\\Commands\\ChangePassword\\ChangePasswordCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\CompleteRegistration\\CompleteRegistrationCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\CreateUser\\CreateUserCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\InitiatePasswordReset\\InitiatePasswordResetCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\Login\\LoginCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\RefreshTokens\\RefreshTokensCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\Register\\RegisterCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\SetPassword\\SetPasswordCommandHandler.cs::HandleAsync",
			"SeventySix\\Identity\\Commands\\UpdateUser\\UpdateUserCommandHandler.cs::HandleAsync",

			// Test methods - integration tests with setup/teardown
			"Tests\\SeventySix.Api.Tests\\Controllers\\HealthControllerTests.cs::GetHealthStatus_ReturnsOkResult_WithHealthStatusAsync",
			"Tests\\SeventySix.Tests\\Identity\\Services\\RefreshTokenCleanupJobTests.cs::CleanupExpiredTokensAsync_DeletesTokensExpiredMoreThanRetentionDaysAgoAsync",
			"Tests\\SeventySix.Tests\\Identity\\Services\\TokenServiceTests.cs::ValidateRefreshTokenAsync_ReturnsExpectedResultAsync",
			"Tests\\SeventySix.Tests\\Identity\\Services\\TokenServiceTests.cs::GenerateRefreshTokenAsync_RevokesOldestToken_WhenSessionLimitReachedAsync",

			// Architecture tests themselves - meta exceptions
			"Tests\\SeventySix.ArchitectureTests\\GodMethodTests.cs::FindAllMethods",
			"Tests\\SeventySix.ArchitectureTests\\GodMethodTests.cs::CountMethodLines",
			"Tests\\SeventySix.ArchitectureTests\\TransactionUsageTests.cs::Services_Should_Not_Wrap_Single_Repository_Calls_In_Transactions",
		]; [Fact]
	public void All_Methods_Should_Be_Under_50_Lines()
	{
		// Arrange
		IEnumerable<string> sourceFiles = GetAllSourceFiles();
		List<string> godMethodViolations = [];

		// Act
		foreach (string filePath in sourceFiles)
		{
			string fileContent = ReadFileContent(filePath);
			string relativePath = GetRelativePath(filePath);

			List<MethodInfo> methods = FindAllMethods(fileContent);

			foreach (MethodInfo method in methods)
			{
				string methodIdentifier =
					$"{relativePath}::{method.Name}";

				if (AllowedExceptions.Contains(methodIdentifier))
				{
					continue;
				}

				int lineCount =
					CountMethodLines(
						fileContent,
						method.StartIndex);

				if (lineCount > MaxLinesPerMethod)
				{
					godMethodViolations.Add(
						$"{methodIdentifier}: {lineCount} lines (max {MaxLinesPerMethod})");
				}
			}
		}

		// Assert - output violations for debugging
		if (godMethodViolations.Count > 0)
		{
			string violations = string.Join("\n", godMethodViolations);
			throw new Xunit.Sdk.XunitException($"God method violations found:\n{violations}");
		}

		// Assert
		Assert.Empty(godMethodViolations);
	}

	private static List<MethodInfo> FindAllMethods(string fileContent)
	{
		List<MethodInfo> methods = [];

		// Match method declarations (public, private, protected, internal, async, static, etc.)
		// Captures method name and finds opening brace
		Regex methodRegex =
			new(
				@"^\s*(?:public|private|protected|internal|static|virtual|override|async|sealed|\s)+\s+(?:\w+(?:<[^>]+>)?(?:\?)?(?:\[\])?)\s+(\w+)\s*\([^)]*\)\s*(?:where[^{]*)?{",
				RegexOptions.Multiline);

		MatchCollection matches = methodRegex.Matches(fileContent);

		foreach (Match match in matches)
		{
			string methodName = match.Groups[1].Value;

			// Skip property getters/setters and constructors that are single-line
			if (methodName is "get" or "set" or "init")
			{
				continue;
			}

			methods.Add(
				new MethodInfo
				{
					Name = methodName,
					StartIndex = match.Index,
				});
		}

		return methods;
	}

	private static int CountMethodLines(
		string fileContent,
		int methodStartIndex)
	{
		int braceDepth = 0;
		bool methodStarted = false;
		int nonBlankLineCount = 0;

		// Find the opening brace
		int lineIndex = methodStartIndex;
		while (lineIndex < fileContent.Length)
		{
			char character = fileContent[lineIndex];

			if (character == '{')
			{
				braceDepth++;
				methodStarted = true;
				lineIndex++;
				break;
			}

			lineIndex++;
		}

		if (!methodStarted)
		{
			return 0;
		}

		// Count lines until closing brace
		int currentLineStart = lineIndex;

		for (int index = lineIndex; index < fileContent.Length; index++)
		{
			char character = fileContent[index];

			if (character == '{')
			{
				braceDepth++;
			}
			else if (character == '}')
			{
				braceDepth--;

				if (braceDepth == 0)
				{
					// Count the last line if not blank
					string lastLine =
						fileContent
							.Substring(
								currentLineStart,
								index - currentLineStart)
							.Trim();

					if (!string.IsNullOrWhiteSpace(lastLine)
						&& !lastLine.StartsWith("//"))
					{
						nonBlankLineCount++;
					}

					break;
				}
			}
			else if (character == '\n')
			{
				// Count this line if not blank or comment
				string lineContent =
					fileContent
						.Substring(
							currentLineStart,
							index - currentLineStart)
						.Trim();

				if (!string.IsNullOrWhiteSpace(lineContent)
					&& !lineContent.StartsWith("//"))
				{
					nonBlankLineCount++;
				}

				currentLineStart = index + 1;
			}
		}

		return nonBlankLineCount;
	}

	private sealed class MethodInfo
	{
		public string Name { get; init; } = string.Empty;

		public int StartIndex
		{
			get; init;
		}
	}
}