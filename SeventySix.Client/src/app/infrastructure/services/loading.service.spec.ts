import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { Subject } from "rxjs";
import { LoadingService } from "./loading.service";
import { setupSimpleServiceTest } from "@testing";

describe("LoadingService", () =>
{
	let service: LoadingService;
	let mockRouter: { events: Subject<any> };

	beforeEach(() =>
	{
		mockRouter = {
			events: new Subject()
		};

		service = setupSimpleServiceTest(LoadingService, [
			{ provide: Router, useValue: mockRouter }
		]);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should start with isLoading false", () =>
	{
		expect(service.isLoading()).toBe(false);
	});

	describe("show", () =>
	{
		it("should set isLoading to true", () =>
		{
			service.show();
			expect(service.isLoading()).toBe(true);
		});
	});

	describe("hide", () =>
	{
		it("should set isLoading to false", () =>
		{
			service.show();
			service.hide();
			expect(service.isLoading()).toBe(false);
		});
	});

	describe("router integration", () =>
	{
		it("should show loading on NavigationStart", () =>
		{
			mockRouter.events.next(new NavigationStart(1, "/test"));
			expect(service.isLoading()).toBe(true);
		});

		it("should hide loading on NavigationEnd", () =>
		{
			mockRouter.events.next(new NavigationStart(1, "/test"));
			mockRouter.events.next(new NavigationEnd(1, "/test", "/test"));
			expect(service.isLoading()).toBe(false);
		});
	});
});
