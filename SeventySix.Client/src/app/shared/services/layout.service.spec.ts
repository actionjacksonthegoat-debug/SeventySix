import { APP_BREAKPOINTS } from "@shared/constants";
import { setupSimpleServiceTest } from "@shared/testing";
import { Mock, vi } from "vitest";
import { LayoutService } from "./layout.service";

/**
 * In-memory MediaQueryList stub supporting the modern
 * `addEventListener('change', ...)` API.
 * Call `setMatches(value)` to simulate a viewport change.
 */
class MockMediaQueryList
{
	matches: boolean;
	readonly media: string;
	onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;

	private readonly listeners: ((event: MediaQueryListEvent) => void)[] = [];

	constructor(
		query: string,
		initialMatches: boolean = false)
	{
		this.media = query;
		this.matches = initialMatches;
	}

	addEventListener(
		_type: string,
		handler: (event: MediaQueryListEvent) => void): void
	{
		this.listeners.push(handler);
	}

	removeEventListener(
		_type: string,
		handler: (event: MediaQueryListEvent) => void): void
	{
		const index: number =
			this.listeners.indexOf(handler);
		if (index !== -1)
		{
			this.listeners.splice(
				index,
				1);
		}
	}

	dispatchEvent(): boolean
	{
		return true;
	}

	/**
	 * Simulate a viewport change.
	 * @param {boolean} value
	 * Whether its media query now matches.
	 */
	setMatches(value: boolean): void
	{
		this.matches = value;
		const event: MediaQueryListEvent =
			{ matches: value, media: this.media } as MediaQueryListEvent;
		for (const listener of this.listeners)
		{
			listener(event);
		}
	}
}

describe("LayoutService",
	() =>
	{
		let service: LayoutService;
		let sessionStorageSetItemSpy: Mock<(key: string, value: string) => void>;
		let mockQueryLists: Map<string, MockMediaQueryList>;

		/**
	 * Set up mock matchMedia so each query gets its own MockMediaQueryList.
	 */
		function setupMatchMediaMock(
			defaults: Record<string, boolean> = {}): void
		{
			mockQueryLists =
				new Map();

			Object.defineProperty(
				window,
				"matchMedia",
				{
					writable: true,
					value: vi
						.fn()
						.mockImplementation(
							(query: string) =>
							{
								const existing: MockMediaQueryList | undefined =
									mockQueryLists.get(query);
								if (existing)
								{
									return existing;
								}

								const initialMatch: boolean =
									defaults[query] ?? false;
								const mediaQueryList: MockMediaQueryList =
									new MockMediaQueryList(
										query,
										initialMatch);
								mockQueryLists.set(
									query,
									mediaQueryList);
								return mediaQueryList;
							})
				});
		}

		beforeEach(
			() =>
			{
				setupMatchMediaMock();

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
					setupSimpleServiceTest(LayoutService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("breakpoint signals",
			() =>
			{
				it("should report isMobile when XSmall matches",
					() =>
					{
						const xsmallMql: MockMediaQueryList | undefined =
							mockQueryLists.get(APP_BREAKPOINTS.XSmall);
						xsmallMql?.setMatches(true);

						expect(service.isMobile())
							.toBe(true);
						expect(service.isBelowLaptop())
							.toBe(true);
						expect(service.sidebarMode())
							.toBe("over");
					});

				it("should report isLaptop when Medium matches",
					() =>
					{
						const mediumMql: MockMediaQueryList | undefined =
							mockQueryLists.get(APP_BREAKPOINTS.Medium);
						mediumMql?.setMatches(true);

						expect(service.isLaptop())
							.toBe(true);
						expect(service.isLaptopOrLarger())
							.toBe(true);
						expect(service.sidebarMode())
							.toBe("side");
					});

				it("should report isDesktop when Large matches",
					() =>
					{
						const largeMql: MockMediaQueryList | undefined =
							mockQueryLists.get(APP_BREAKPOINTS.Large);
						largeMql?.setMatches(true);

						expect(service.isDesktop())
							.toBe(true);
						expect(service.isLaptopOrLarger())
							.toBe(true);
					});
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