// <copyright file="DbExceptionExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Extensions;
using Shouldly;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for <see cref="DbExceptionExtensions"/>.
/// </summary>
public sealed class DbExceptionExtensionsTests
{
	private const string UnrelatedCode = "99999";

	#region IsDuplicateKeyViolation Tests

	/// <summary>
	/// Returns true for UniqueViolation error code and duplicate key message fragment.
	/// </summary>
	[Theory]
	[InlineData(PostgresErrorCodes.UniqueViolation)]
	[InlineData(PostgresErrorCodes.DuplicateKeyMessage)]
	public void IsDuplicateKeyViolation_ViolationCode_ReturnsTrue(string errorCode)
	{
		DbUpdateException exception =
			CreateDbUpdateException(errorCode);

		bool result =
			exception.IsDuplicateKeyViolation();

		result.ShouldBeTrue();
	}

	/// <summary>
	/// Uses inner exception message when inner exception is present.
	/// </summary>
	[Fact]
	public void IsDuplicateKeyViolation_ViolationInInnerException_ReturnsTrue()
	{
		DbUpdateException exception =
			CreateDbUpdateExceptionWithInner(
				outerMessage: "outer-unrelated",
				innerMessage: PostgresErrorCodes.UniqueViolation);

		bool result =
			exception.IsDuplicateKeyViolation();

		result.ShouldBeTrue();
	}

	/// <summary>
	/// Returns false when the error code is unrelated to duplicate key violations.
	/// </summary>
	[Fact]
	public void IsDuplicateKeyViolation_UnrelatedCode_ReturnsFalse()
	{
		DbUpdateException exception =
			CreateDbUpdateException(UnrelatedCode);

		bool result =
			exception.IsDuplicateKeyViolation();

		result.ShouldBeFalse();
	}

	#endregion

	#region IsConcurrencyRelated Tests

	/// <summary>
	/// Returns true for all concurrency-related PostgreSQL error codes.
	/// </summary>
	[Theory]
	[InlineData(PostgresErrorCodes.UniqueViolation)]
	[InlineData(PostgresErrorCodes.DuplicateKeyMessage)]
	[InlineData(PostgresErrorCodes.SerializationFailure)]
	[InlineData(PostgresErrorCodes.DeadlockDetected)]
	public void IsConcurrencyRelated_ConcurrencyCode_ReturnsTrue(string errorCode)
	{
		DbUpdateException exception =
			CreateDbUpdateException(errorCode);

		bool result =
			exception.IsConcurrencyRelated();

		result.ShouldBeTrue();
	}

	/// <summary>
	/// Returns false when the error code is unrelated to concurrency.
	/// </summary>
	[Fact]
	public void IsConcurrencyRelated_UnrelatedCode_ReturnsFalse()
	{
		DbUpdateException exception =
			CreateDbUpdateException(UnrelatedCode);

		bool result =
			exception.IsConcurrencyRelated();

		result.ShouldBeFalse();
	}

	/// <summary>
	/// Uses inner exception message for concurrency check when inner exception is present.
	/// </summary>
	[Fact]
	public void IsConcurrencyRelated_ConcurrencyInInnerException_ReturnsTrue()
	{
		DbUpdateException exception =
			CreateDbUpdateExceptionWithInner(
				outerMessage: "outer-unrelated",
				innerMessage: PostgresErrorCodes.DeadlockDetected);

		bool result =
			exception.IsConcurrencyRelated();

		result.ShouldBeTrue();
	}

	#endregion

	#region Helpers

	private static DbUpdateException CreateDbUpdateException(string message) =>
		new(message);

	private static DbUpdateException CreateDbUpdateExceptionWithInner(
		string outerMessage,
		string innerMessage) =>
		new(
			outerMessage,
			new Exception(innerMessage));

	#endregion
}