// <copyright file="mock-service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { type Mock, vi } from "vitest";

/**
 * A fully mocked view of a service interface.
 *
 * @remarks
 * Each method declared in the keys list is replaced with a `vi.fn()` mock.
 * Properties that are not listed remain absent on the resulting object.
 */
export type MockedService<T, K extends keyof T> = {
	[P in K]: Mock;
};

/**
 * Generic helper that produces a vitest mock implementing the specified
 * subset of methods for a service interface.
 *
 * @remarks
 * Eliminates hand-written `MockXxxService` interfaces for services whose
 * tests only need `vi.fn()`-bound method spies. For services requiring
 * signals or default return values, prefer the specialised factories in
 * [mock-factories.ts](./mock-factories.ts).
 *
 * @example
 * const logger: MockedService<LoggerService, "info" | "error"> =
 *     mockService<LoggerService>(["info", "error"]);
 *
 * @typeParam T
 * The service interface to mock.
 * @param methods
 * Readonly list of method names to stub with `vi.fn()`.
 * @returns
 * A typed mock exposing each listed method as a vitest mock.
 */
export function mockService<T>(
	methods: readonly (keyof T)[]): MockedService<T, keyof T>
{
	const result: Record<string, Mock> = {};

	for (const method of methods)
	{
		result[method as string] =
			vi.fn();
	}

	return result as MockedService<T, keyof T>;
}