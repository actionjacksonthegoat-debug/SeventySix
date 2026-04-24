// <copyright file="SensitivePropertyDestructuringPolicy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Serilog.Core;
using Serilog.Events;

namespace SeventySix.Api.Logging;

/// <summary>
/// Serilog destructuring policy that redacts sensitive property values
/// from structured log events before they reach any sink (console, file, database).
/// </summary>
/// <remarks>
/// Applied via <c>LoggerConfiguration.Destructure.With()</c> in <see cref="Extensions.SerilogExtensions"/>.
/// Any object destructured using the <c>@</c> operator (e.g., <c>{@request}</c>) passes
/// through this policy. Properties whose names match <see cref="SensitiveFieldRedactor.SensitiveKeys"/>
/// are replaced with <c>[REDACTED]</c> before the event is rendered to any output.
/// </remarks>
public sealed class SensitivePropertyDestructuringPolicy : IDestructuringPolicy
{
	/// <inheritdoc />
	/// <remarks>
	/// Returns false to allow normal destructuring to proceed first;
	/// the resulting <see cref="StructureValue"/> properties are then
	/// filtered via the Serilog <c>Enrich.WithProperty</c> pipeline.
	/// Because Serilog already handles individual scalar properties through
	/// <see cref="SensitiveFieldRedactor"/> in the database enricher, this policy
	/// intercepts object-level destructuring to protect console and file sinks.
	/// </remarks>
	public bool TryDestructure(
		object value,
		ILogEventPropertyValueFactory propertyValueFactory,
		out LogEventPropertyValue result)
	{
		ArgumentNullException.ThrowIfNull(propertyValueFactory);

		if (value is null)
		{
			result =
				new ScalarValue(null);
			return false;
		}

		// Reflect over public properties and redact sensitive ones
		System.Reflection.PropertyInfo[] properties =
			value.GetType().GetProperties(
				System.Reflection.BindingFlags.Public
				| System.Reflection.BindingFlags.Instance);

		if (properties.Length == 0)
		{
			result =
				new ScalarValue(null);
			return false;
		}

		bool hasSensitiveProperty =
			Array.Exists(
				properties,
				p => SensitiveFieldRedactor.SensitiveKeys.Contains(p.Name));

		if (!hasSensitiveProperty)
		{
			result =
				new ScalarValue(null);
			return false;
		}

		// Rebuild the structure with sensitive values redacted
		List<LogEventProperty> logProperties = [];

		foreach (System.Reflection.PropertyInfo property in properties)
		{
			object? rawValue =
				GetPropertyValue(property, value);

			LogEventPropertyValue logValue =
				SensitiveFieldRedactor.SensitiveKeys.Contains(property.Name)
					? new ScalarValue(SensitiveFieldRedactor.RedactedValue)
					: propertyValueFactory.CreatePropertyValue(rawValue, destructureObjects: true);

			logProperties.Add(
				new LogEventProperty(
					property.Name,
					logValue));
		}

		result =
			new StructureValue(
				logProperties,
				typeTag: value.GetType().Name);

		return true;
	}

	/// <summary>
	/// Safely retrieves a property value, returning <see langword="null"/> on access failure.
	/// </summary>
	/// <param name="property">
	/// The property to read.
	/// </param>
	/// <param name="target">
	/// The object instance to read from.
	/// </param>
	/// <returns>
	/// The property value, or <see langword="null"/> if reading fails.
	/// </returns>
	private static object? GetPropertyValue(
		System.Reflection.PropertyInfo property,
		object target)
	{
		try
		{
			return property.GetValue(target);
		}
		catch (System.Reflection.TargetInvocationException)
		{
			return null;
		}
	}
}