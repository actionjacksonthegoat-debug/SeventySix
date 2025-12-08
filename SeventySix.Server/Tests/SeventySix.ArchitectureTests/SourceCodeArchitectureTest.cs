// <copyright file="SourceCodeArchitectureTest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Base class for architecture tests that scan source files.
/// Provides common file scanning utilities following DRY principle.
/// </summary>
public abstract class SourceCodeArchitectureTest
{
	/// <summary>
	/// Gets the solution root directory path.
	/// </summary>
	protected static readonly string SolutionRoot =
		Path.GetFullPath(
			Path.Combine(
				AppContext.BaseDirectory,
				"..",
				"..",
				"..",
				"..",
				".."));

	/// <summary>
	/// Gets source files matching the specified pattern.
	/// Excludes bin, obj, and test directories.
	/// </summary>
	/// <param name="pattern">File search pattern (e.g., "*.cs").</param>
	/// <param name="excludePath">Additional path to exclude (optional).</param>
	/// <returns>Enumerable of matching file paths.</returns>
	protected static IEnumerable<string> GetSourceFiles(
		string pattern,
		string excludePath = "")
	{
		string[] files =
			Directory.GetFiles(
				SolutionRoot,
				pattern,
				SearchOption.AllDirectories);

		return files.Where(file =>
			!file.Contains("\\bin\\")
			&& !file.Contains("\\obj\\")
			&& !file.Contains("\\Tests\\")
			&& !file.Contains("\\Migrations\\")
			&& (string.IsNullOrEmpty(excludePath) || !file.Contains(excludePath)));
	}

	/// <summary>
	/// Reads the content of a file.
	/// </summary>
	/// <param name="path">File path to read.</param>
	/// <returns>File content as string.</returns>
	protected static string ReadFileContent(string path) =>
		File.ReadAllText(path);

	/// <summary>
	/// Gets relative path from solution root for cleaner error messages.
	/// </summary>
	/// <param name="fullPath">Full file path.</param>
	/// <returns>Relative path from solution root.</returns>
	protected static string GetRelativePath(string fullPath) =>
		Path.GetRelativePath(
			SolutionRoot,
			fullPath);
}