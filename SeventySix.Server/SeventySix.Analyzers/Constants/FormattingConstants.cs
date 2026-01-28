// <copyright file="FormattingConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Analyzers.Constants;

/// <summary>
/// Constants for code formatting in analyzers and code fixes.
/// </summary>
internal static class FormattingConstants
{
	/// <summary>
	/// Single tab character for indentation.
	/// </summary>
	public const string Tab = "\t";

	/// <summary>
	/// Windows-style newline (CRLF).
	/// </summary>
	public const string WindowsNewline = "\r\n";

	/// <summary>
	/// Unix-style newline (LF).
	/// </summary>
	public const string UnixNewline = "\n";

	/// <summary>
	/// Default indentation (two tabs).
	/// </summary>
	public const string DefaultIndent = "\t\t";
}
