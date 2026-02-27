// <copyright file="ResultTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Shared.Tests.POCOs.Results;

/// <summary>
/// Tests for <see cref="Result"/> non-generic and <see cref="Result{T}"/> generic result types.
/// </summary>
public sealed class ResultTests
{
	private const string ErrorMessage = "User not found";

	#region Result (non-generic) Tests

	[Fact]
	public void Success_ReturnsSuccessfulResult()
	{
		Result result = Result.Success();

		result.IsSuccess.ShouldBeTrue();
		result.Error.ShouldBeNull();
	}

	[Fact]
	public void Failure_ReturnsFailedResultWithError()
	{
		Result result =
			Result.Failure(ErrorMessage);

		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe(ErrorMessage);
	}

	[Fact]
	public void Failure_WithEmptyString_ReturnsFailedResultWithEmptyError()
	{
		Result result =
			Result.Failure(string.Empty);

		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe(string.Empty);
	}

	#endregion

	#region Result<T> Tests

	/// <summary>
	/// Success with a value sets IsSuccess to true and stores the value.
	/// </summary>
	[Fact]
	public void GenericSuccess_WithValue_ReturnsSuccessfulResultWithValue()
	{
		const int ExpectedValue = 42;

		Result<int> result =
			Result<int>.Success(ExpectedValue);

		result.IsSuccess.ShouldBeTrue();
		result.Value.ShouldBe(ExpectedValue);
	}

	/// <summary>
	/// Success with a value sets Error to null.
	/// </summary>
	[Fact]
	public void GenericSuccess_WithValue_HasNullError()
	{
		Result<string> result =
			Result<string>.Success("hello");

		result.Error.ShouldBeNull();
	}

	/// <summary>
	/// Failure sets IsSuccess to false and Value to default.
	/// </summary>
	[Fact]
	public void GenericFailure_WithError_ReturnsFailedResultWithNullValue()
	{
		Result<string> result =
			Result<string>.Failure(ErrorMessage);

		result.IsSuccess.ShouldBeFalse();
		result.Value.ShouldBeNull();
	}

	/// <summary>
	/// Failure stores the error message.
	/// </summary>
	[Fact]
	public void GenericFailure_WithError_SetsErrorMessage()
	{
		Result<int> result =
			Result<int>.Failure(ErrorMessage);

		result.Error.ShouldBe(ErrorMessage);
	}

	#endregion
}