import { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { LayoutService } from "@core/services/layout.service";
import { signal } from "@angular/core";
import { ComponentTestBed } from "@testing";

describe("SidebarComponent", () =>
{
	let component: SidebarComponent;
	let fixture: ComponentFixture<SidebarComponent>;
	let mockLayoutService: any;

	beforeEach(async () =>
	{
		mockLayoutService = jasmine.createSpyObj("LayoutService", [
			"setSidebarExpanded",
			"toggleSidebar"
		]);
		mockLayoutService.sidebarMode = jasmine
			.createSpy("sidebarMode")
			.and.returnValue("side");

		fixture = await new ComponentTestBed<SidebarComponent>()
			.withProvider(provideRouter([]))
			.withProvider({
				provide: LayoutService,
				useValue: mockLayoutService
			})
			.build(SidebarComponent);

		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should have navigation sections", () =>
	{
		expect(component["navSections"]).toBeDefined();
		expect(component["navSections"].length).toBeGreaterThan(0);
	});

	it("should close sidebar", () =>
	{
		component.closeSidebar();
		expect(mockLayoutService.setSidebarExpanded).toHaveBeenCalledWith(
			false
		);
	});

	it("should toggle sidebar on mobile when nav item clicked", () =>
	{
		mockLayoutService.sidebarMode.and.returnValue("over");

		component.closeSidebarOnMobile();

		expect(mockLayoutService.toggleSidebar).toHaveBeenCalled();
	});

	it("should not toggle sidebar on desktop when nav item clicked", () =>
	{
		mockLayoutService.sidebarMode.and.returnValue("side");

		component.closeSidebarOnMobile();

		expect(mockLayoutService.toggleSidebar).not.toHaveBeenCalled();
	});
});
