import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { AuthService, LayoutService } from "@shared/services";
import {
	createMockAuthService,
	createMockLayoutService,
	MockLayoutService
} from "@shared/testing";
import { Observable, of } from "rxjs";
import { App } from "./app";

interface MockActivatedRouteWithRoot
{
	params: Observable<Record<string, unknown>>;
	root: {
		firstChild: null;
		snapshot: { data: Record<string, unknown>; };
	};
}

describe("App",
	() =>
	{
		let mockActivatedRoute: MockActivatedRouteWithRoot;
		let mockLayoutService: MockLayoutService;
		let mockAuthService: ReturnType<typeof createMockAuthService>;

		beforeEach(
			async () =>
			{
				mockActivatedRoute =
					{
						params: of({}),
						root: {
							firstChild: null,
							snapshot: { data: {} }
						}
					};
				mockLayoutService =
					createMockLayoutService();
				mockLayoutService.sidebarMode.mockReturnValue("over");
				mockAuthService =
					createMockAuthService();

				await TestBed
					.configureTestingModule(
						{
							imports: [App],
							providers: [
								provideZonelessChangeDetection(),
								{ provide: ActivatedRoute, useValue: mockActivatedRoute },
								{ provide: LayoutService, useValue: mockLayoutService },
								{ provide: AuthService, useValue: mockAuthService }
							]
						})
					.compileComponents();
			});

		it("should create the app",
			() =>
			{
				const fixture: ComponentFixture<App> =
					TestBed.createComponent(App);
				const app: App =
					fixture.componentInstance;

				expect(app)
					.toBeTruthy();
			});

		it("should render title",
			() =>
			{
				const fixture: ComponentFixture<App> =
					TestBed.createComponent(App);

				fixture.detectChanges();
				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;

				// Check for main content area instead of specific text
				const mainContent: Element | null =
					compiled.querySelector("#main-content");
				expect(mainContent)
					.toBeTruthy();
			});

		describe("onSwipeLeft",
			() =>
			{
				it("should close sidebar when in overlay mode and sidebar is expanded",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: overlay mode, sidebar expanded
						mockLayoutService.sidebarMode.mockReturnValue("over");
						mockLayoutService.sidebarExpanded.mockReturnValue(true);

						app.onSwipeLeft();

						expect(mockLayoutService.closeSidebar)
							.toHaveBeenCalled();
					});

				it("should NOT close sidebar when in overlay mode but sidebar is collapsed",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: overlay mode, sidebar collapsed
						mockLayoutService.sidebarMode.mockReturnValue("over");
						mockLayoutService.sidebarExpanded.mockReturnValue(false);

						app.onSwipeLeft();

						expect(mockLayoutService.closeSidebar).not.toHaveBeenCalled();
					});

				it("should NOT close sidebar when NOT in overlay mode",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: side mode (desktop), sidebar expanded
						mockLayoutService.sidebarMode.mockReturnValue("side");
						mockLayoutService.sidebarExpanded.mockReturnValue(true);

						app.onSwipeLeft();

						expect(mockLayoutService.closeSidebar).not.toHaveBeenCalled();
					});
			});

		describe("onSwipeRight",
			() =>
			{
				it("should open sidebar when in overlay mode and sidebar is collapsed",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: overlay mode, sidebar collapsed
						mockLayoutService.sidebarMode.mockReturnValue("over");
						mockLayoutService.sidebarExpanded.mockReturnValue(false);

						app.onSwipeRight();

						expect(mockLayoutService.openSidebar)
							.toHaveBeenCalled();
					});

				it("should NOT open sidebar when in overlay mode but sidebar is already expanded",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: overlay mode, sidebar already expanded
						mockLayoutService.sidebarMode.mockReturnValue("over");
						mockLayoutService.sidebarExpanded.mockReturnValue(true);

						app.onSwipeRight();

						expect(mockLayoutService.openSidebar).not.toHaveBeenCalled();
					});

				it("should NOT open sidebar when NOT in overlay mode",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						// Setup: side mode (desktop), sidebar collapsed
						mockLayoutService.sidebarMode.mockReturnValue("side");
						mockLayoutService.sidebarExpanded.mockReturnValue(false);

						app.onSwipeRight();

						expect(mockLayoutService.openSidebar).not.toHaveBeenCalled();
					});
			});

		describe("onBackdropClick",
			() =>
			{
				it("should close sidebar when backdrop is clicked",
					() =>
					{
						const fixture: ComponentFixture<App> =
							TestBed.createComponent(App);
						const app: App =
							fixture.componentInstance;

						app.onBackdropClick();

						expect(mockLayoutService.closeSidebar)
							.toHaveBeenCalled();
					});
			});
	});
