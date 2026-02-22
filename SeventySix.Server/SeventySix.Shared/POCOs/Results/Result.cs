// <copyright file="Result.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.POCOs;

/// <summary>
/// Result pattern for operations without a return value.
/// Use when operation succeeds or fails without returning data.
/// </summary>
public sealed class Result
{
	/// <summary>
	/// Indicates whether the operation completed successfully.
	/// </summary>
	public bool IsSuccess { get; }

	/// <summary>
	/// Error message when the operation failed; null when operation succeeded.
	/// </summary>
	public string? Error { get; }

	private Result(
		bool isSuccess,
		string? error)
	{
		IsSuccess = isSuccess;
		Error = error;
	}

	/// <summary>
	/// Creates a successful result.
	/// </summary>
	/// <returns>
	/// A successful Result instance.
	/// </returns>
	public static Result Success() =>
		new(true, null);

	/// <summary>
	/// Creates a failed result with an error message.
	/// </summary>
	/// <param name="error">
	/// The error message describing the failure.
	/// </param>
	/// <returns>
	/// A failed Result instance with the specified error.
	/// </returns>
	public static Result Failure(string error) =>
		new(false, error);
}

/// <summary>
/// Result pattern for service operations that return a value.
/// </summary>
/// <typeparam name="T">
/// The type of value returned on success.
/// </typeparam>
public sealed class Result<T>
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

	private Result(
		bool isSuccess,
		T? value,
		string? error)
	{
		IsSuccess = isSuccess;
		Value = value;
		Error = error;
	}

	/// <summary>
	/// Creates a successful result with a value.
	/// </summary>
	/// <param name="value">
	/// The value to return.
	/// </param>
	/// <returns>
	/// A successful Result instance with the specified value.
	/// </returns>
	public static Result<T> Success(T value) =>
		new(true, value, null);

	/// <summary>
	/// Creates a failed result with an error message.
	/// </summary>
	/// <param name="error">
	/// The error message describing the failure.
	/// </param>
	/// <returns>
	/// A failed Result instance with the specified error.
	/// </returns>
	public static Result<T> Failure(string error) =>
		new(false, default, error);
}