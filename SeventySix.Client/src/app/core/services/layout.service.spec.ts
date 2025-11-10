import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { of } from "rxjs";
import { LayoutService } from "./layout.service";

describe("LayoutService", () =>
{
	let service: LayoutService;
	let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;

	beforeEach(() =>
	{
		mockBreakpointObserver = jasmine.createSpyObj("BreakpointObserver", [
			"observe"
		]);
		mockBreakpointObserver.observe.and.returnValue(
			of({ matches: false, breakpoints: {} })
		);

		// Mock localStorage
		spyOn(localStorage, "getItem").and.returnValue(null);
		spyOn(localStorage, "setItem");

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				LayoutService,
				{
					provide: BreakpointObserver,
					useValue: mockBreakpointObserver
				}
			]
		});

		service = TestBed.inject(LayoutService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("toggleSidebar", () =>
	{
		it("should toggle sidebar state", () =>
		{
			const initialState = service.sidebarExpanded();
			service.toggleSidebar();
			expect(service.sidebarExpanded()).toBe(!initialState);
		});

		it("should persist state to localStorage", () =>
		{
			service.toggleSidebar();
			expect(localStorage.setItem).toHaveBeenCalled();
		});
	});

	describe("setSidebarExpanded", () =>
	{
		it("should set sidebar expanded state", () =>
		{
			service.setSidebarExpanded(false);
			expect(service.sidebarExpanded()).toBe(false);

			service.setSidebarExpanded(true);
			expect(service.sidebarExpanded()).toBe(true);
		});
	});

	describe("closeSidebar", () =>
	{
		it("should set sidebar to closed", () =>
		{
			service.closeSidebar();
			expect(service.sidebarExpanded()).toBe(false);
		});
	});

	describe("openSidebar", () =>
	{
		it("should set sidebar to open", () =>
		{
			service.openSidebar();
			expect(service.sidebarExpanded()).toBe(true);
		});
	});
});
