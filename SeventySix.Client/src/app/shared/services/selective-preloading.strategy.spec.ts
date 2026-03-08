import { Route } from "@angular/router";
import {
	firstValueFrom,
	Observable,
	of
} from "rxjs";
import { Mock, vi } from "vitest";
import { SelectivePreloadingStrategy } from "./selective-preloading.strategy";

type LoadFn = () => Observable<unknown>;

function mockMatchMedia(matches: boolean): void
{
	Object.defineProperty(
		globalThis,
		"matchMedia",
		{
			configurable: true,
			value: vi.fn(
				() => ({ matches }))
		});
}

function mockConnection(connection?: { saveData?: boolean; effectiveType?: string; }): void
{
	Object.defineProperty(
		globalThis.navigator,
		"connection",
		{
			configurable: true,
			value: connection
		});
}

describe("SelectivePreloadingStrategy",
	() =>
	{
		let strategy: SelectivePreloadingStrategy;

		beforeEach(
			() =>
			{
				vi.useFakeTimers();
				mockMatchMedia(true);
				mockConnection(
					{ effectiveType: "4g", saveData: false });
				strategy =
					new SelectivePreloadingStrategy();
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
			});

		it("should preload routes with preload: true after delay",
			async () =>
			{
				// Arrange
				const route: Route =
					{ data: { preload: true } };
				const loadFunction: Mock<LoadFn> =
					vi.fn(() => of({}));

				// Act
				const resultPromise: Promise<unknown> =
					firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				await vi.advanceTimersByTimeAsync(2000);
				const result: unknown =
					await resultPromise;

				// Assert
				expect(loadFunction)
					.toHaveBeenCalledTimes(1);
				expect(result)
					.toEqual({});
			});

		it("should NOT preload routes without preload flag",
			async () =>
			{
				// Arrange
				const route: Route =
					{ data: { breadcrumb: "Test" } };
				const loadFunction: Mock<LoadFn> =
					vi.fn();

				// Act
				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				// Assert
				expect(loadFunction).not.toHaveBeenCalled();
				expect(result)
					.toBeNull();
			});

		it("should NOT preload routes with preload: false",
			async () =>
			{
				// Arrange
				const route: Route =
					{ data: { preload: false } };
				const loadFunction: Mock<LoadFn> =
					vi.fn();

				// Act
				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				// Assert
				expect(loadFunction).not.toHaveBeenCalled();
				expect(result)
					.toBeNull();
			});

		it("should NOT preload routes on mobile viewports",
			async () =>
			{
				mockMatchMedia(false);
				const route: Route =
					{ data: { preload: true } };
				const loadFunction: Mock<LoadFn> =
					vi.fn();

				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				expect(loadFunction).not.toHaveBeenCalled();
				expect(result)
					.toBeNull();
			});

		it("should NOT preload routes when data saver is enabled",
			async () =>
			{
				mockConnection(
					{ effectiveType: "4g", saveData: true });
				const route: Route =
					{ data: { preload: true } };
				const loadFunction: Mock<LoadFn> =
					vi.fn();

				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				expect(loadFunction).not.toHaveBeenCalled();
				expect(result)
					.toBeNull();
			});

		it("should NOT preload routes on slow connections",
			async () =>
			{
				mockConnection(
					{ effectiveType: "3g", saveData: false });
				const route: Route =
					{ data: { preload: true } };
				const loadFunction: Mock<LoadFn> =
					vi.fn();

				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

				expect(loadFunction).not.toHaveBeenCalled();
				expect(result)
					.toBeNull();
			});
	});