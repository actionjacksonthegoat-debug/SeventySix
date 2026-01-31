// <copyright file="DiagnosticCategories.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Analyzers;

/// <summary>
/// Diagnostic category constants for Roslyn analyzers.
/// </summary>
internal static class DiagnosticCategories
{
	/// <summary>
	/// Category for code formatting rules (indentation, newlines, spacing).
	/// </summary>
	public const string Formatting = "Formatting";

	/// <summary>
	/// Category for design and API usage rules.
	/// </summary>
	public const string Design = "Design";
}