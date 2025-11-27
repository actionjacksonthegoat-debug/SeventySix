import { BreakpointObserver } from "@angular/cdk/layout";
import { of } from "rxjs";
import { LayoutService } from "./layout.service";
import { setupSimpleServiceTest } from "@testing";

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

		// Mock sessionStorage (sidebar uses sessionStorage for session-only persistence)
		spyOn(sessionStorage, "getItem").and.returnValue(null);
		spyOn(sessionStorage, "setItem");

		service = setupSimpleServiceTest(LayoutService, [
			{
				provide: BreakpointObserver,
				useValue: mockBreakpointObserver
			}
		]);
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

		it("should persist state to sessionStorage", () =>
		{
			service.toggleSidebar();
			expect(sessionStorage.setItem).toHaveBeenCalled();
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

	describe("initial sidebar state", () =>
	{
		it("should start open when sessionStorage is empty (fresh load)", () =>
		{
			// Already mocked sessionStorage.getItem to return null
			expect(service.sidebarExpanded()).toBe(true);
		});
	});
});
