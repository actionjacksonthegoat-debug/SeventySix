// <copyright file="TestLoggingController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Attributes;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Controller for testing logging functionality.
/// </summary>
/// <remarks>
/// DEVELOPMENT ONLY - Remove before production deployment.
/// Provides endpoints to test different log levels and exception handling.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="TestLoggingController"/> class.
/// </remarks>
/// <param name="logger">The logger instance.</param>
[ApiController]
[Route("api/[controller]")]
[RateLimit()] // 250 req/hour (default)
public class TestLoggingController(
	ILogger<TestLoggingController> logger) : ControllerBase
{
	/// <summary>
	/// Tests warning level logging.
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("warning")]
	public IActionResult TestWarning()
	{
		logger.LogWarning("Test warning message from TestLoggingController");
		return Ok(new { message = "Warning logged", level = "Warning" });
	}

	/// <summary>
	/// Tests error level logging.
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("error")]
	public IActionResult TestError()
	{
		logger.LogError("Test error message from TestLoggingController");
		return Ok(new { message = "Error logged", level = "Error" });
	}

	/// <summary>
	/// Tests exception logging with custom exception.
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("exception")]
	public IActionResult TestException()
	{
		try
		{
			throw new InvalidOperationException("Test exception from TestLoggingController");
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Caught test exception in TestLoggingController");
			return Ok(new { message = "Exception logged", exception = ex.Message });
		}
	}

	/// <summary>
	/// Tests nested exception logging (base exception different from main exception).
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("nested-exception")]
	public IActionResult TestNestedException()
	{
		try
		{
			try
			{
				throw new ArgumentException("Inner exception - invalid argument");
			}
			catch (ArgumentException inner)
			{
				throw new InvalidOperationException("Outer exception - operation failed", inner);
			}
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Caught nested exception in TestLoggingController");
			return Ok(new
			{
				message = "Nested exception logged",
				exception = ex.Message,
				baseException = ex.GetBaseException().Message,
			});
		}
	}

	/// <summary>
	/// Tests unhandled exception (will be caught by GlobalExceptionMiddleware).
	/// </summary>
	/// <returns>Never returns normally.</returns>
	[HttpGet("unhandled-exception")]
	public IActionResult TestUnhandledException() => throw new InvalidOperationException("Test unhandled exception from TestLoggingController");

	/// <summary>
	/// Tests critical level logging.
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("critical")]
	public IActionResult TestCritical()
	{
		logger.LogCritical("Test critical message from TestLoggingController - SYSTEM FAILURE");
		return Ok(new { message = "Critical logged", level = "Critical" });
	}

	/// <summary>
	/// Tests information level logging (should NOT go to database).
	/// </summary>
	/// <returns>OK response.</returns>
	[HttpGet("info")]
	public IActionResult TestInfo()
	{
		logger.LogInformation("Test info message from TestLoggingController - should only appear in file/console");
		return Ok(new { message = "Info logged - check file/console only", level = "Information" });
	}
}