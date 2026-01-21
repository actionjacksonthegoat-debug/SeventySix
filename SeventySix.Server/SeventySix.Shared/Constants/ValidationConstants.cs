// <copyright file="ValidationConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for field validation and database column lengths.
/// Single source of truth for consistent validation across the application (DRY).
/// </summary>
/// <remarks>
/// Use these constants in both EF Core Fluent API configurations and
/// validation attributes to ensure consistency between database schema and validation.
/// </remarks>
public static class ValidationConstants
{
	/// <summary>
	/// Standard username maximum length.
	/// </summary>
	public const int UsernameMaxLength = 100;

	/// <summary>
	/// Standard email maximum length.
	/// </summary>
	public const int EmailMaxLength = 256;

	/// <summary>
	/// Standard display name maximum length.
	/// </summary>
	public const int DisplayNameMaxLength = 100;

	/// <summary>
	/// Standard IP address maximum length (supports IPv6).
	/// </summary>
	public const int IpAddressMaxLength = 45;

	/// <summary>
	/// Standard URL maximum length.
	/// </summary>
	public const int UrlMaxLength = 500;

	/// <summary>
	/// Standard API name maximum length.
	/// </summary>
	public const int ApiNameMaxLength = 100;

	/// <summary>
	/// Standard status field maximum length.
	/// </summary>
	public const int StatusMaxLength = 20;

	/// <summary>
	/// Standard short text field maximum length.
	/// </summary>
	public const int ShortTextMaxLength = 50;

	/// <summary>
	/// Standard medium text field maximum length.
	/// </summary>
	public const int MediumTextMaxLength = 256;

	/// <summary>
	/// Standard long text field maximum length.
	/// </summary>
	public const int LongTextMaxLength = 500;

	/// <summary>
	/// Standard message maximum length.
	/// </summary>
	public const int MessageMaxLength = 4000;

	/// <summary>
	/// Standard exception message maximum length.
	/// </summary>
	public const int ExceptionMessageMaxLength = 2000;

	/// <summary>
	/// Standard error message maximum length.
	/// </summary>
	public const int ErrorMessageMaxLength = 1000;

	/// <summary>
	/// Standard machine name maximum length.
	/// </summary>
	public const int MachineNameMaxLength = 100;

	/// <summary>
	/// Standard environment name maximum length.
	/// </summary>
	public const int EnvironmentMaxLength = 50;

	/// <summary>
	/// Standard log level maximum length.
	/// </summary>
	public const int LogLevelMaxLength = 20;

	/// <summary>
	/// Standard request method maximum length.
	/// </summary>
	public const int RequestMethodMaxLength = 10;

	/// <summary>
	/// Standard request path maximum length.
	/// </summary>
	public const int RequestPathMaxLength = 2000;

	/// <summary>
	/// Standard job name maximum length.
	/// </summary>
	public const int JobNameMaxLength = 128;

	/// <summary>
	/// Standard correlation ID maximum length.
	/// </summary>
	public const int CorrelationIdMaxLength = 32;

	/// <summary>
	/// Standard span ID maximum length.
	/// </summary>
	public const int SpanIdMaxLength = 16;

	/// <summary>
	/// Standard token hash maximum length.
	/// </summary>
	public const int TokenHashMaxLength = 64;
}
