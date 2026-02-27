// <copyright file="SharedExceptionTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Exceptions;
using Shouldly;

namespace SeventySix.Shared.Tests.Exceptions;

/// <summary>
/// Unit tests for shared exception types:
/// <see cref="EntityNotFoundException"/>, <see cref="BusinessRuleViolationException"/>,
/// and <see cref="StartupFailedException"/>.
/// </summary>
public sealed class SharedExceptionTests
{
	private const string CustomMessage = "Custom error message";
	private const string EntityName = "User";
	private const long EntityId = 42L;

	#region EntityNotFoundException Tests

	/// <summary>
	/// Default constructor sets the standard "entity not found" message.
	/// </summary>
	[Fact]
	public void EntityNotFoundException_DefaultConstructor_SetsDefaultMessage()
	{
		ConcreteEntityNotFoundException exception =
			new();

		exception.Message.ShouldBe("The requested entity was not found.");
	}

	/// <summary>
	/// Entity-name-and-id constructor formats the message and sets the properties.
	/// </summary>
	[Fact]
	public void EntityNotFoundException_EntityNameAndIdConstructor_FormatsMessage()
	{
		ConcreteEntityNotFoundException exception =
			new(EntityName, EntityId);

		exception.Message.ShouldContain(EntityName);
		exception.Message.ShouldContain(EntityId.ToString());
		exception.EntityName.ShouldBe(EntityName);
		exception.EntityId.ShouldBe((object)EntityId);
	}

	/// <summary>
	/// Message constructor stores the supplied message verbatim.
	/// </summary>
	[Fact]
	public void EntityNotFoundException_MessageConstructor_SetsMessage()
	{
		ConcreteEntityNotFoundException exception =
			new(CustomMessage);

		exception.Message.ShouldBe(CustomMessage);
	}

	/// <summary>
	/// Default constructor leaves EntityName and EntityId null.
	/// </summary>
	[Fact]
	public void EntityNotFoundException_DefaultConstructor_EntityPropertiesAreNull()
	{
		ConcreteEntityNotFoundException exception =
			new();

		exception.EntityName.ShouldBeNull();
		exception.EntityId.ShouldBeNull();
	}

	/// <summary>
	/// EntityNotFoundException inherits from DomainException.
	/// </summary>
	[Fact]
	public void EntityNotFoundException_IsDomainException()
	{
		ConcreteEntityNotFoundException exception =
			new();

		exception.ShouldBeAssignableTo<DomainException>();
	}

	#endregion

	#region BusinessRuleViolationException Tests

	/// <summary>
	/// Default constructor sets the standard "business rule violated" message.
	/// </summary>
	[Fact]
	public void BusinessRuleViolationException_DefaultConstructor_SetsDefaultMessage()
	{
		BusinessRuleViolationException exception =
			new();

		exception.Message.ShouldBe("A business rule was violated.");
	}

	/// <summary>
	/// Message constructor stores the supplied message verbatim.
	/// </summary>
	[Fact]
	public void BusinessRuleViolationException_MessageConstructor_SetsMessage()
	{
		BusinessRuleViolationException exception =
			new(CustomMessage);

		exception.Message.ShouldBe(CustomMessage);
	}

	/// <summary>
	/// Message-and-inner-exception constructor sets both message and inner exception.
	/// </summary>
	[Fact]
	public void BusinessRuleViolationException_MessageAndInnerExceptionConstructor_SetsBoth()
	{
		Exception innerException =
			new("inner error");

		BusinessRuleViolationException exception =
			new(CustomMessage, innerException);

		exception.Message.ShouldBe(CustomMessage);
		exception.InnerException.ShouldBeSameAs(innerException);
	}

	/// <summary>
	/// BusinessRuleViolationException inherits from DomainException.
	/// </summary>
	[Fact]
	public void BusinessRuleViolationException_IsDomainException()
	{
		BusinessRuleViolationException exception =
			new();

		exception.ShouldBeAssignableTo<DomainException>();
	}

	#endregion

	#region StartupFailedException Tests

	/// <summary>
	/// Constructor sets the Reason property and message correctly.
	/// </summary>
	[Fact]
	public void StartupFailedException_Constructor_SetsReasonAndMessage()
	{
		StartupFailedException exception =
			new(
				StartupFailedReason.DatabaseMigration,
				CustomMessage);

		exception.Reason.ShouldBe(StartupFailedReason.DatabaseMigration);
		exception.Message.ShouldBe(CustomMessage);
		exception.InnerException.ShouldBeNull();
	}

	/// <summary>
	/// Constructor sets the inner exception when provided.
	/// </summary>
	[Fact]
	public void StartupFailedException_ConstructorWithInner_SetsInnerException()
	{
		Exception innerException =
			new("database error");

		StartupFailedException exception =
			new(
				StartupFailedReason.DatabaseMigration,
				CustomMessage,
				innerException);

		exception.InnerException.ShouldBeSameAs(innerException);
	}

	#endregion

	#region Private concrete subclass for abstract EntityNotFoundException

	private sealed class ConcreteEntityNotFoundException : EntityNotFoundException
	{
		public ConcreteEntityNotFoundException() : base() { }

		public ConcreteEntityNotFoundException(string entityName, object entityId)
			: base(entityName, entityId) { }

		public ConcreteEntityNotFoundException(string message)
			: base(message) { }
	}

	#endregion
}