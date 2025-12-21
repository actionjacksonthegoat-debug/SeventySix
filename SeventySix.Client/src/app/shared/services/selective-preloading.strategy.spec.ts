import { Route } from "@angular/router";
import {
	firstValueFrom,
	of
} from "rxjs";
import { SelectivePreloadingStrategy } from "./selective-preloading.strategy";

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
				const loadFunction: jasmine.Spy =
					jasmine.createSpy("loadFunction").and.returnValue(of({}));

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
				const loadFunction: jasmine.Spy =
					jasmine.createSpy("loadFunction");

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
				const loadFunction: jasmine.Spy =
					jasmine.createSpy("loadFunction");

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
