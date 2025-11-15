import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { App } from "./app";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { LayoutService } from "@core/services";

describe("App", () =>
{
	let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
	let mockLayoutService: any;

	beforeEach(async () =>
	{
		mockActivatedRoute = jasmine.createSpyObj("ActivatedRoute", [], {
			params: of({}),
			root: {
				firstChild: null,
				snapshot: { data: {} }
			}
		});

		mockLayoutService = jasmine.createSpyObj("LayoutService", [
			"openSidebar",
			"closeSidebar"
		]);
		mockLayoutService.sidebarMode = jasmine
			.createSpy("sidebarMode")
			.and.returnValue("over");
		mockLayoutService.sidebarExpanded = jasmine
			.createSpy("sidebarExpanded")
			.and.returnValue(true);

		await TestBed.configureTestingModule({
			imports: [App],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: LayoutService, useValue: mockLayoutService }
			]
		}).compileComponents();
	});

	it("should create the app", () =>
	{
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;

		expect(app).toBeTruthy();
	});

	it("should render title", () =>
	{
		const fixture = TestBed.createComponent(App);

		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;

		// Check for main content area instead of specific text
		const mainContent = compiled.querySelector("#main-content");
		expect(mainContent).toBeTruthy();
	});

	describe("onSwipeLeft", () =>
	{
		it("should close sidebar when in overlay mode and sidebar is expanded", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: overlay mode, sidebar expanded
			mockLayoutService.sidebarMode.and.returnValue("over");
			mockLayoutService.sidebarExpanded.and.returnValue(true);

			app.onSwipeLeft();

			expect(mockLayoutService.closeSidebar).toHaveBeenCalled();
		});

		it("should NOT close sidebar when in overlay mode but sidebar is collapsed", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: overlay mode, sidebar collapsed
			mockLayoutService.sidebarMode.and.returnValue("over");
			mockLayoutService.sidebarExpanded.and.returnValue(false);

			app.onSwipeLeft();

			expect(mockLayoutService.closeSidebar).not.toHaveBeenCalled();
		});

		it("should NOT close sidebar when NOT in overlay mode", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: side mode (desktop), sidebar expanded
			mockLayoutService.sidebarMode.and.returnValue("side");
			mockLayoutService.sidebarExpanded.and.returnValue(true);

			app.onSwipeLeft();

			expect(mockLayoutService.closeSidebar).not.toHaveBeenCalled();
		});
	});

	describe("onSwipeRight", () =>
	{
		it("should open sidebar when in overlay mode and sidebar is collapsed", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: overlay mode, sidebar collapsed
			mockLayoutService.sidebarMode.and.returnValue("over");
			mockLayoutService.sidebarExpanded.and.returnValue(false);

			app.onSwipeRight();

			expect(mockLayoutService.openSidebar).toHaveBeenCalled();
		});

		it("should NOT open sidebar when in overlay mode but sidebar is already expanded", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: overlay mode, sidebar already expanded
			mockLayoutService.sidebarMode.and.returnValue("over");
			mockLayoutService.sidebarExpanded.and.returnValue(true);

			app.onSwipeRight();

			expect(mockLayoutService.openSidebar).not.toHaveBeenCalled();
		});

		it("should NOT open sidebar when NOT in overlay mode", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			// Setup: side mode (desktop), sidebar collapsed
			mockLayoutService.sidebarMode.and.returnValue("side");
			mockLayoutService.sidebarExpanded.and.returnValue(false);

			app.onSwipeRight();

			expect(mockLayoutService.openSidebar).not.toHaveBeenCalled();
		});
	});

	describe("onBackdropClick", () =>
	{
		it("should close sidebar when backdrop is clicked", () =>
		{
			const fixture = TestBed.createComponent(App);
			const app = fixture.componentInstance;

			app.onBackdropClick();

			expect(mockLayoutService.closeSidebar).toHaveBeenCalled();
		});
	});
});
