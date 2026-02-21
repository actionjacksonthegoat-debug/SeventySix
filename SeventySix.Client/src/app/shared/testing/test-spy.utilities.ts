/**
 * Test Spy Utilities
 * Type-safe helpers for spying on private methods in tests.
 * Eliminates need for 'as any' casts while maintaining type safety.
 */

import { type Mock, vi } from "vitest";

/**
 * Type helper to extract method names from a class type.
 * Reserved for future typed spy extensions.
 * @template T
 * The class type to extract method names from.
 */
type _MethodNames<T> = {
	[K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * Creates a spy on a private method of an object.
 * This provides a type-safe way to spy on private methods without casting.
 * @template T
 * The object type.
 * @param {T} object
 * The object containing the method to spy on.
 * @param {string} methodName
 * The name of the private method to spy on.
 * @returns {Mock}
 * A Vitest mock function that wraps the original method.
 * @example
 * const updateSpy = spyOnPrivateMethod(directive, "updateHeight");
 * // Trigger action that calls updateHeight
 * expect(updateSpy).toHaveBeenCalled();
 */
export function spyOnPrivateMethod<T extends object>(
	object: T,
	methodName: string): Mock
{
	const objectWithMethod: Record<string, unknown> =
		object as unknown as Record<string, unknown>;
	const originalMethod: (...args: unknown[]) => unknown =
		objectWithMethod[methodName] as (
			...args: unknown[]) => unknown;

	if (typeof originalMethod !== "function")
	{
		throw new Error(`Method "${methodName}" not found on object`);
	}

	const spy: Mock =
		vi.fn((...args: unknown[]) =>
			originalMethod.apply(object, args));
	objectWithMethod[methodName] = spy;

	return spy;
}

/**
 * Gets the value of a private property from an object.
 * @template T
 * The object type.
 * @template R
 * The return type of the property.
 * @param {T} object
 * The object containing the property.
 * @param {string} propertyName
 * The name of the private property.
 * @returns {R}
 * The value of the property.
 * @example
 * const value = getPrivateProperty<MyClass, number>(instance, "privateCounter");
 */
export function getPrivateProperty<T extends object, R>(
	object: T,
	propertyName: string): R
{
	const objectWithProp: Record<string, unknown> =
		object as unknown as Record<string, unknown>;
	return objectWithProp[propertyName] as R;
}

/**
 * Sets the value of a private property on an object.
 * @template T
 * The object type.
 * @template V
 * The value type.
 * @param {T} object
 * The object containing the property.
 * @param {string} propertyName
 * The name of the private property.
 * @param {V} value
 * The value to set.
 * @returns {void}
 * @example
 * setPrivateProperty(instance, "privateCounter", 42);
 */
export function setPrivateProperty<T extends object, V>(
	object: T,
	propertyName: string,
	value: V): void
{
	const objectWithProp: Record<string, unknown> =
		object as unknown as Record<string, unknown>;
	objectWithProp[propertyName] = value;
}

/**
 * Calls a private method on an object with the given arguments.
 * @template T
 * The object type.
 * @template R
 * The return type of the method.
 * @param {T} object
 * The object containing the method.
 * @param {string} methodName
 * The name of the private method.
 * @param {unknown[]} args
 * Arguments to pass to the method.
 * @returns {R}
 * The return value of the method.
 * @example
 * const result = callPrivateMethod<MyClass, boolean>(instance, "validateInput", "test");
 */
export function callPrivateMethod<T extends object, R>(
	object: T,
	methodName: string,
	...args: unknown[]): R
{
	const objectWithMethod: Record<string, unknown> =
		object as unknown as Record<string, unknown>;
	const method: (...args: unknown[]) => R =
		objectWithMethod[methodName] as (...args: unknown[]) => R;

	if (typeof method !== "function")
	{
		throw new Error(`Method "${methodName}" not found on object`);
	}

	return method.apply(object, args);
}

/**
 * Creates a mock for window.navigator properties.
 * @param {string} property
 * The navigator property to mock (e.g., 'userAgent', 'onLine').
 * @param {unknown} value
 * The mock value to return.
 * @returns {ReturnType<typeof vi.spyOn>}
 * The spy instance for verification and cleanup.
 * @example
 * const userAgentSpy = mockNavigatorProperty("userAgent", "TestBrowser/1.0");
 * // ... run tests
 * userAgentSpy.mockRestore();
 */
export function mockNavigatorProperty(
	property: string,
	value: unknown): ReturnType<typeof vi.spyOn>
{
	return vi
		.spyOn(
			window.navigator as unknown as Record<string, unknown>,
			property as keyof typeof window.navigator,
			"get")
		.mockReturnValue(value);
}

/**
 * Creates a mock for window properties.
 * @param {keyof Window} property
 * The window property to mock.
 * @param {unknown} value
 * The mock value to return.
 * @returns {void}
 * @remarks
 * Uses Object.defineProperty for properties that cannot be spied on.
 * @example
 * mockWindowProperty("innerHeight", 1000);
 */
export function mockWindowProperty(
	property: keyof Window,
	value: unknown): void
{
	Object.defineProperty(
		window,
		property,
		{
			writable: true,
			configurable: true,
			value
		});
}