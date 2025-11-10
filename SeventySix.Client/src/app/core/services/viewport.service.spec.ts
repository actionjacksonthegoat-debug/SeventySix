import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { of } from "rxjs";
import { ViewportService } from "./viewport.service";

describe("ViewportService", () =>
{
	let service: ViewportService;
	let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;

	beforeEach(() =>
	{
		mockBreakpointObserver = jasmine.createSpyObj("BreakpointObserver", [
			"observe",
			"isMatched"
		]);
		mockBreakpointObserver.observe.and.returnValue(
			of({ matches: false, breakpoints: {} })
		);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				ViewportService,
				{
					provide: BreakpointObserver,
					useValue: mockBreakpointObserver
				}
			]
		});

		service = TestBed.inject(ViewportService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("computed breakpoint signals", () =>
	{
		it("should have breakpoint detection methods", () =>
		{
			expect(service.isXSmall()).toBeDefined();
			expect(service.isSmall()).toBeDefined();
			expect(service.isMedium()).toBeDefined();
			expect(service.isLarge()).toBeDefined();
			expect(service.isXLarge()).toBeDefined();
		});

		it("should have device type methods", () =>
		{
			expect(service.isHandset()).toBeDefined();
			expect(service.isTablet()).toBeDefined();
			expect(service.isWeb()).toBeDefined();
		});

		it("should have convenience methods", () =>
		{
			expect(service.isMobile()).toBeDefined();
			expect(service.isDesktop()).toBeDefined();
			expect(service.isTouchDevice()).toBeDefined();
		});

		it("should compute current breakpoint", () =>
		{
			const breakpoint = service.currentBreakpoint();
			expect(breakpoint).toBeTruthy();
		});

		it("should compute device type", () =>
		{
			const deviceType = service.deviceType();
			expect(deviceType).toBeTruthy();
		});

		it("should compute orientation", () =>
		{
			const orientation = service.orientation();
			expect(orientation).toBeTruthy();
		});
	});

	describe("matches", () =>
	{
		it("should check if query matches", () =>
		{
			mockBreakpointObserver.isMatched.and.returnValue(true);

			const result = service.matches("(max-width: 600px)");

			expect(result).toBe(true);
			expect(mockBreakpointObserver.isMatched).toHaveBeenCalledWith(
				"(max-width: 600px)"
			);
		});
	});
});
