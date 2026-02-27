import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from "@angular/router";
import { setupSimpleServiceTest } from "@shared/testing";
import { Subject } from "rxjs";
import { LoadingService } from "./loading.service";

describe("LoadingService",
	() =>
	{
		let service: LoadingService;
		let mockRouter: { events: Subject<NavigationCancel | NavigationEnd | NavigationError | NavigationStart>; };

		beforeEach(
			() =>
			{
				mockRouter =
					{
						events: new Subject()
					};

				service =
					setupSimpleServiceTest(LoadingService,
						[
							{ provide: Router, useValue: mockRouter }
						]);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should start with isLoading false",
			() =>
			{
				expect(service.isLoading())
					.toBe(false);
			});

		describe("show",
			() =>
			{
				it("should set isLoading to true",
					() =>
					{
						service.show();
						expect(service.isLoading())
							.toBe(true);
					});
			});

		describe("hide",
			() =>
			{
				it("should set isLoading to false",
					() =>
					{
						service.show();
						service.hide();
						expect(service.isLoading())
							.toBe(false);
					});
			});

		describe("router integration",
			() =>
			{
				it("should show loading on NavigationStart",
					() =>
					{
						mockRouter.events.next(new NavigationStart(1, "/test"));
						expect(service.isLoading())
							.toBe(true);
					});

				it("should hide loading on NavigationEnd",
					() =>
					{
						mockRouter.events.next(new NavigationStart(1, "/test"));
						mockRouter.events.next(new NavigationEnd(1, "/test", "/test"));
						expect(service.isLoading())
							.toBe(false);
					});

				it("should hide loading on NavigationCancel",
					() =>
					{
						mockRouter.events.next(new NavigationStart(1, "/test"));
						mockRouter.events.next(new NavigationCancel(1, "/test", ""));
						expect(service.isLoading())
							.toBe(false);
					});

				it("should hide loading on NavigationError",
					() =>
					{
						mockRouter.events.next(new NavigationStart(1, "/test"));
						mockRouter.events.next(new NavigationError(1, "/test", new Error("nav error")));
						expect(service.isLoading())
							.toBe(false);
					});
			});
	});