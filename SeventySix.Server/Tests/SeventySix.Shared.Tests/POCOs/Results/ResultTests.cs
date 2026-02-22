// <copyright file="ResultTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;
using Shouldly;

namespace SeventySix.Shared.Tests.POCOs.Results;

/// <summary>
/// Tests for <see cref="Result"/> non-generic class.
/// </summary>
public sealed class ResultTests
{
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
		string errorMessage = "User not found";

		Result result =
			Result.Failure(errorMessage);

		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe(errorMessage);
	}

	[Fact]
	public void Failure_WithEmptyString_ReturnsFailedResultWithEmptyError()
	{
		Result result =
			Result.Failure(string.Empty);

		result.IsSuccess.ShouldBeFalse();
		result.Error.ShouldBe(string.Empty);
	}
}