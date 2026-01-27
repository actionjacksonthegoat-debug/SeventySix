import {
	provideZonelessChangeDetection
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { WindowUtilities } from "./window.utilities";

describe("WindowUtilities",
	() =>
	{
		let service: WindowUtilities;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							WindowUtilities
						]
					});

				service =
					TestBed.inject(WindowUtilities);
			});

		it("should exist",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should return viewport height",
			() =>
			{
				const height: number =
					service.getViewportHeight();
				expect(height)
					.toBeGreaterThan(0);
			});

		it("should return viewport width",
			() =>
			{
				const width: number =
					service.getViewportWidth();
				expect(width)
					.toBeGreaterThan(0);
			});

		it("should return current URL",
			() =>
			{
				const url: string =
					service.getCurrentUrl();
				expect(url.length)
					.toBeGreaterThan(0);
			});

		it("should return current pathname",
			() =>
			{
				const pathname: string =
					service.getPathname();
				expect(pathname)
					.toBeDefined();
			});

		it("should have openWindow method",
			() =>
			{
				expect(service.openWindow)
					.toBeDefined();
			});

		it("should have scrollToTop method",
			() =>
			{
				expect(service.scrollToTop)
					.toBeDefined();
			});

		it("should have reload method",
			() =>
			{
				expect(service.reload)
					.toBeDefined();
			});

		it("should have navigateTo method",
			() =>
			{
				expect(service.navigateTo)
					.toBeDefined();
			});
	});
