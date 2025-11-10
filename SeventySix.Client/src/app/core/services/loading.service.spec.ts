import { TestBed } from "@angular/core/testing";
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { provideZonelessChangeDetection } from "@angular/core";
import { Subject } from "rxjs";
import { LoadingService } from "./loading.service";

describe("LoadingService", () =>
{
	let service: LoadingService;
	let mockRouter: { events: Subject<any> };

	beforeEach(() =>
	{
		mockRouter = {
			events: new Subject()
		};

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				LoadingService,
				{ provide: Router, useValue: mockRouter }
			]
		});

		service = TestBed.inject(LoadingService);
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
