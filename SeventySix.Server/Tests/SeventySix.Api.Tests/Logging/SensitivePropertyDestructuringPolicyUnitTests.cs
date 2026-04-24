// <copyright file="SensitivePropertyDestructuringPolicyUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using Serilog.Core;
using Serilog.Events;
using SeventySix.Api.Logging;
using Shouldly;

namespace SeventySix.Api.Tests.Logging;

/// <summary>
/// Unit tests for <see cref="SensitivePropertyDestructuringPolicy"/>.
/// </summary>
public sealed class SensitivePropertyDestructuringPolicyUnitTests
{
	private readonly SensitivePropertyDestructuringPolicy Policy = new();

	private readonly ILogEventPropertyValueFactory PropertyValueFactory =
		Substitute.For<ILogEventPropertyValueFactory>();

	/// <summary>
	/// Verifies that a null property value factory throws ArgumentNullException.
	/// </summary>
	[Fact]
	public void TryDestructure_NullPropertyValueFactory_ThrowsArgumentNullException()
	{
		Should.Throw<ArgumentNullException>(
			() => Policy.TryDestructure(
				new object(),
				null!,
				out _));
	}

	/// <summary>
	/// Verifies that a null value returns false and sets result to a null scalar.
	/// </summary>
	[Fact]
	public void TryDestructure_NullValue_ReturnsFalseWithNullScalar()
	{
		bool result =
			Policy.TryDestructure(
				null!,
				PropertyValueFactory,
				out LogEventPropertyValue value);

		result.ShouldBeFalse();
		ScalarValue scalar =
			value.ShouldBeOfType<ScalarValue>();
		scalar.Value.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that an object with no public properties returns false.
	/// </summary>
	[Fact]
	public void TryDestructure_ObjectWithNoPublicProperties_ReturnsFalseWithNullScalar()
	{
		NoPublicProperties target = new();

		bool result =
			Policy.TryDestructure(
				target,
				PropertyValueFactory,
				out LogEventPropertyValue value);

		result.ShouldBeFalse();
		ScalarValue scalar =
			value.ShouldBeOfType<ScalarValue>();
		scalar.Value.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that an object with properties but none sensitive returns false.
	/// </summary>
	[Fact]
	public void TryDestructure_ObjectWithNoSensitiveProperties_ReturnsFalseWithNullScalar()
	{
		NonSensitiveObject target =
			new()
			{
				Username = "alice",
				Email = "alice@example.com"
			};

		bool result =
			Policy.TryDestructure(
				target,
				PropertyValueFactory,
				out LogEventPropertyValue value);

		result.ShouldBeFalse();
		ScalarValue scalar =
			value.ShouldBeOfType<ScalarValue>();
		scalar.Value.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that an object with a sensitive property is destructured
	/// with the sensitive field replaced by the redacted placeholder.
	/// </summary>
	[Fact]
	public void TryDestructure_ObjectWithSensitiveProperty_ReturnsTrueWithRedactedStructure()
	{
		ObjectWithPassword target =
			new()
			{
				Username = "alice",
				Password = "super-secret"
			};

		PropertyValueFactory
			.CreatePropertyValue(
				Arg.Any<object?>(),
				Arg.Any<bool>())
			.Returns(callInfo => new ScalarValue(callInfo.ArgAt<object?>(0)));

		bool result =
			Policy.TryDestructure(
				target,
				PropertyValueFactory,
				out LogEventPropertyValue value);

		result.ShouldBeTrue();
		StructureValue structure =
			value.ShouldBeOfType<StructureValue>();
		structure.TypeTag.ShouldBe(nameof(ObjectWithPassword));

		LogEventProperty? passwordProp =
			structure.Properties.FirstOrDefault(p => p.Name == "Password");
		passwordProp.ShouldNotBeNull();
		ScalarValue passwordValue =
			passwordProp.Value.ShouldBeOfType<ScalarValue>();
		passwordValue.Value.ShouldBe(SensitiveFieldRedactor.RedactedValue);

		LogEventProperty? usernameProp =
			structure.Properties.FirstOrDefault(p => p.Name == "Username");
		usernameProp.ShouldNotBeNull();
		ScalarValue usernameValue =
			usernameProp.Value.ShouldBeOfType<ScalarValue>();
		usernameValue.Value.ShouldBe("alice");
	}

	/// <summary>
	/// Verifies that when a property getter throws, the property value is treated as null
	/// and processed normally (non-sensitive properties use null, sensitive ones are redacted).
	/// </summary>
	[Fact]
	public void TryDestructure_PropertyGetterThrows_HandledGracefully()
	{
		ObjectWithThrowingProperty target = new();

		PropertyValueFactory
			.CreatePropertyValue(
				Arg.Any<object?>(),
				Arg.Any<bool>())
			.Returns(callInfo => new ScalarValue(callInfo.ArgAt<object?>(0)));

		// Should not throw — GetPropertyValue catches TargetInvocationException
		bool result =
			Policy.TryDestructure(
				target,
				PropertyValueFactory,
				out LogEventPropertyValue value);

		// ObjectWithThrowingProperty has a "Password" property so hasSensitiveProperty = true
		result.ShouldBeTrue();
		StructureValue structure =
			value.ShouldBeOfType<StructureValue>();
		LogEventProperty? passwordProp =
			structure.Properties.FirstOrDefault(p => p.Name == "Password");
		passwordProp.ShouldNotBeNull();
		ScalarValue passwordValue =
			passwordProp.Value.ShouldBeOfType<ScalarValue>();
		passwordValue.Value.ShouldBe(SensitiveFieldRedactor.RedactedValue);
	}

	/// <summary>
	/// Helper: object with no public properties.
	/// </summary>
	private sealed class NoPublicProperties
	{
		private string Hidden { get; } = string.Empty;

		/// <summary>
		/// Silences unused warning — not accessible by reflection without BindingFlags.NonPublic.
		/// </summary>
		public string GetHidden() => Hidden;
	}

	/// <summary>
	/// Helper: object with non-sensitive properties only.
	/// </summary>
	private sealed class NonSensitiveObject
	{
		/// <summary>Gets or sets the username.</summary>
		public string Username { get; set; } = string.Empty;

		/// <summary>Gets or sets the email.</summary>
		public string Email { get; set; } = string.Empty;
	}

	/// <summary>
	/// Helper: object with a sensitive Password property.
	/// </summary>
	private sealed class ObjectWithPassword
	{
		/// <summary>Gets or sets the username.</summary>
		public string Username { get; set; } = string.Empty;

		/// <summary>Gets or sets the password (sensitive).</summary>
		public string Password { get; set; } = string.Empty;
	}

	/// <summary>
	/// Helper: object whose Password getter throws a TargetInvocationException.
	/// </summary>
	private sealed class ObjectWithThrowingProperty
	{
		/// <summary>Gets the password (always throws).</summary>
		public string Password =>
			throw new InvalidOperationException("Simulated getter failure");
	}
}
