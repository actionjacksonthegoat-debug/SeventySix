import { Route } from "@angular/router";
import {
	firstValueFrom,
	Observable,
	of
} from "rxjs";
import { Mock, vi } from "vitest";
import { SelectivePreloadingStrategy } from "./selective-preloading.strategy";

type LoadFn = () => Observable<unknown>;

describe("SelectivePreloadingStrategy",
	() =>
	{
		let strategy: SelectivePreloadingStrategy;

		beforeEach(
			() =>
			{
				strategy =
					new SelectivePreloadingStrategy();
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
				const result: unknown =
					await firstValueFrom(
						strategy.preload(
							route,
							loadFunction));

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
	});
