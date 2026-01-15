// <copyright file="Result.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.POCOs;

/// <summary>
/// Result pattern for service operations.
/// </summary>
public class Result<T>
{
	/// <summary>
	/// Indicates whether the operation completed successfully.
	/// </summary>
	public bool IsSuccess { get; }

	/// <summary>
	/// The value returned when the operation succeeds; null when the operation fails.
	/// </summary>
	public T? Value { get; }

	/// <summary>
	/// Error message when the operation failed; null when operation succeeded.
	/// </summary>
	public string? Error { get; }

	private Result(bool isSuccess, T? value, string? error)
	{
		IsSuccess = isSuccess;
		Value = value;
		Error = error;
	}

	public static Result<T> Success(T value) => new(true, value, null);

	public static Result<T> Failure(string error) => new(false, default, error);
}