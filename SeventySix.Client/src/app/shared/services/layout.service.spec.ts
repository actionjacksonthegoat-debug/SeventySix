import { BreakpointObserver } from "@angular/cdk/layout";
import { setupSimpleServiceTest } from "@shared/testing";
import { of } from "rxjs";
import { Mock, vi } from "vitest";
import { LayoutService } from "./layout.service";

interface MockBreakpointObserver
{
	observe: Mock;
}

describe("LayoutService",
	() =>
	{
		let service: LayoutService;
		let mockBreakpointObserver: MockBreakpointObserver;
		let sessionStorageSetItemSpy: Mock<(key: string, value: string) => void>;

		beforeEach(
			() =>
			{
				mockBreakpointObserver =
					{
						observe: vi.fn()
					};
				mockBreakpointObserver.observe.mockReturnValue(
					of(
						{ matches: false, breakpoints: {} }));

				// Create spy functions for sessionStorage
				sessionStorageSetItemSpy =
					vi.fn<(key: string, value: string) => void>();

				// Mock sessionStorage using Object.defineProperty
				const mockSessionStorage: Storage =
					{
						length: 0,
						key: vi.fn(() => null),
						getItem: vi.fn(() => null),
						setItem: sessionStorageSetItemSpy,
						removeItem: vi.fn(),
						clear: vi.fn()
					};

				Object.defineProperty(
					window,
					"sessionStorage",
					{
						value: mockSessionStorage,
						writable: true
					});

				service =
					setupSimpleServiceTest(LayoutService,
						[
							{
								provide: BreakpointObserver,
								useValue: mockBreakpointObserver
							}
						]);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("toggleSidebar",
			() =>
			{
				it("should toggle sidebar state",
					() =>
					{
						const initialState: boolean =
							service.sidebarExpanded();
						service.toggleSidebar();
						expect(service.sidebarExpanded())
							.toBe(!initialState);
					});

				it("should persist state to sessionStorage",
					() =>
					{
						service.toggleSidebar();
						expect(sessionStorageSetItemSpy)
							.toHaveBeenCalled();
					});
			});

		describe("setSidebarExpanded",
			() =>
			{
				it("should set sidebar expanded state",
					() =>
					{
						service.setSidebarExpanded(false);
						expect(service.sidebarExpanded())
							.toBe(false);

						service.setSidebarExpanded(true);
						expect(service.sidebarExpanded())
							.toBe(true);
					});
			});

		describe("closeSidebar",
			() =>
			{
				it("should set sidebar to closed",
					() =>
					{
						service.closeSidebar();
						expect(service.sidebarExpanded())
							.toBe(false);
					});
			});

		describe("openSidebar",
			() =>
			{
				it("should set sidebar to open",
					() =>
					{
						service.openSidebar();
						expect(service.sidebarExpanded())
							.toBe(true);
					});
			});

		describe("initial sidebar state",
			() =>
			{
				it("should start open when sessionStorage is empty (fresh load)",
					() =>
					{
						// Already mocked sessionStorage.getItem to return null
						expect(service.sidebarExpanded())
							.toBe(true);
					});
			});
	});
