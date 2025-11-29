import { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { LayoutService } from "@infrastructure/services/layout.service";
import { AuthService } from "@infrastructure/services/auth.service";
import {
	ComponentTestBed,
	createMockLayoutService,
	createMockAuthService,
	MockLayoutService,
	MockAuthService
} from "@testing";

describe("SidebarComponent", () =>
{
	let component: SidebarComponent;
	let fixture: ComponentFixture<SidebarComponent>;
	let mockLayoutService: MockLayoutService;
	let mockAuthService: MockAuthService;

	beforeEach(async () =>
	{
		mockLayoutService = createMockLayoutService();
		mockAuthService = createMockAuthService();

		fixture = await new ComponentTestBed<SidebarComponent>()
			.withProvider(provideRouter([]))
			.withProvider({
				provide: LayoutService,
				useValue: mockLayoutService
			})
			.withProvider({
				provide: AuthService,
				useValue: mockAuthService
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
		expect(component["visibleNavSections"]()).toBeDefined();
		expect(component["visibleNavSections"]().length).toBeGreaterThan(0);
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

	describe("Role-Based Navigation Filtering", () =>
	{
		it("should show only Main section for unauthenticated users", () =>
		{
			// Arrange - no user set (guest)

			// Act
			fixture.detectChanges();

			// Assert
			const sections: { title: string }[] =
				component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).not.toContain("Developer");
			expect(sectionTitles).not.toContain("Management");
		});

		it("should show Main and Developer sections for developers", () =>
		{
			// Arrange
			mockAuthService.setUser({
				id: 1,
				username: "developer",
				email: "dev@test.com",
				fullName: "Test Developer",
				roles: ["Developer"]
			});

			// Act
			fixture.detectChanges();

			// Assert
			const sections: { title: string }[] =
				component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).toContain("Developer");
			expect(sectionTitles).not.toContain("Management");
		});

		it("should show all sections for admins", () =>
		{
			// Arrange
			mockAuthService.setUser({
				id: 1,
				username: "admin",
				email: "admin@test.com",
				fullName: "Test Admin",
				roles: ["Admin"]
			});

			// Act
			fixture.detectChanges();

			// Assert
			const sections: { title: string }[] =
				component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).toContain("Developer");
			expect(sectionTitles).toContain("Management");
		});

		it("should update visible sections when user logs in", () =>
		{
			// Arrange - start as guest
			fixture.detectChanges();
			let sections: { title: string }[] =
				component["visibleNavSections"]();
			expect(sections.length).toBe(1); // Only Main

			// Act - log in as admin
			mockAuthService.setUser({
				id: 1,
				username: "admin",
				email: "admin@test.com",
				fullName: "Test Admin",
				roles: ["Admin"]
			});
			fixture.detectChanges();

			// Assert
			sections = component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).toContain("Developer");
			expect(sectionTitles).toContain("Management");
		});

		it("should update visible sections when user logs out", () =>
		{
			// Arrange - start as admin
			mockAuthService.setUser({
				id: 1,
				username: "admin",
				email: "admin@test.com",
				fullName: "Test Admin",
				roles: ["Admin"]
			});
			fixture.detectChanges();
			let sections: { title: string }[] =
				component["visibleNavSections"]();
			expect(sections.length).toBe(3); // All sections

			// Act - log out
			mockAuthService.setUser(null);
			fixture.detectChanges();

			// Assert
			sections = component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).not.toContain("Developer");
			expect(sectionTitles).not.toContain("Management");
		});

		it("should show Developer section for users with both Developer and Admin roles", () =>
		{
			// Arrange
			mockAuthService.setUser({
				id: 1,
				username: "superuser",
				email: "super@test.com",
				fullName: "Super User",
				roles: ["Developer", "Admin"]
			});

			// Act
			fixture.detectChanges();

			// Assert
			const sections: { title: string }[] =
				component["visibleNavSections"]();
			const sectionTitles: string[] = sections.map(
				(s: { title: string }) => s.title
			);

			expect(sectionTitles).toContain("Main");
			expect(sectionTitles).toContain("Developer");
			expect(sectionTitles).toContain("Management");
		});
	});
});
