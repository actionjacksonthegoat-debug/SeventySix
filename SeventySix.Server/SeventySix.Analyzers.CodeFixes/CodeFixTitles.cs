// <copyright file="CodeFixTitles.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Analyzers;

/// <summary>
/// Code fix title constants for consistent user-facing messages.
/// </summary>
internal static class CodeFixTitles
{
	/// <summary>
	/// Title for adding a newline after assignment operator.
	/// </summary>
	public const string AddNewlineAfterAssignment = "Add newline after '='";

	/// <summary>
	/// Title for fixing continuation line indentation.
	/// </summary>
	public const string FixContinuationIndent = "Fix continuation indent";

	/// <summary>
	/// Title for moving closing parenthesis to same line as last argument.
	/// </summary>
	public const string MoveClosingParenToPreviousLine = "Move ')' to previous line";

	/// <summary>
	/// Title for moving lambda expression to a new line.
	/// </summary>
	public const string MoveLambdaToNewLine = "Move lambda to new line";

	/// <summary>
	/// Title for putting each argument on a separate line.
	/// </summary>
	public const string PutArgumentsOnSeparateLines = "Put each argument on separate line";
}
