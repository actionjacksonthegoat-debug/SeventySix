import { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { LayoutService } from "@shared/services/layout.service";
import {
	ComponentTestBed,
	createMockAuthService,
	createMockLayoutService,
	createMockUserProfile,
	MockAuthService,
	MockLayoutService,
	TEST_ROLE_ADMIN,
	TEST_ROLE_DEVELOPER
} from "@shared/testing";
import { SidebarComponent } from "./sidebar.component";

describe("SidebarComponent",
	() =>
	{
		let component: SidebarComponent;
		let fixture: ComponentFixture<SidebarComponent>;
		let mockLayoutService: MockLayoutService;
		let mockAuthService: MockAuthService;

		beforeEach(
			async () =>
			{
				mockLayoutService =
					createMockLayoutService();
				mockAuthService =
					createMockAuthService();

				fixture =
					await new ComponentTestBed<SidebarComponent>()
						.withProvider(provideRouter([]))
						.withProvider(
							{
								provide: LayoutService,
								useValue: mockLayoutService
							})
						.withProvider(
							{
								provide: AuthService,
								useValue: mockAuthService
							})
						.build(SidebarComponent);

				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should have navigation sections",
			() =>
			{
				expect(component["visibleNavSections"]())
					.toBeDefined();
				expect(component["visibleNavSections"]().length)
					.toBeGreaterThan(0);
			});

		it("should close sidebar",
			() =>
			{
				component.closeSidebar();
				expect(mockLayoutService.setSidebarExpanded)
					.toHaveBeenCalledWith(
						false);
			});

		it("should toggle sidebar on mobile when nav item clicked",
			() =>
			{
				mockLayoutService.sidebarMode.mockReturnValue("over");

				component.closeSidebarOnMobile();

				expect(mockLayoutService.toggleSidebar)
					.toHaveBeenCalled();
			});

		it("should not toggle sidebar on desktop when nav item clicked",
			() =>
			{
				mockLayoutService.sidebarMode.mockReturnValue("side");

				component.closeSidebarOnMobile();

				expect(mockLayoutService.toggleSidebar).not.toHaveBeenCalled();
			});

		describe("Role-Based Navigation Filtering",
			() =>
			{
				it("should show only Main section for unauthenticated users",
					() =>
					{
						// Arrange - no user set (guest)

						// Act
						fixture.detectChanges();

						// Assert
						const sections: { title: string; }[] =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles).not.toContain("Developer");
						expect(sectionTitles).not.toContain("Management");
					});

				it("should show Main and Developer sections for developers",
					() =>
					{
						// Arrange
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "developer",
									email: "dev@test.com",
									fullName: "Test Developer",
									roles: [TEST_ROLE_DEVELOPER]
								}));

						// Act
						fixture.detectChanges();

						// Assert
						const sections: { title: string; }[] =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles)
							.toContain("Developer");
						expect(sectionTitles).not.toContain("Management");
					});

				it("should show all sections for admins",
					() =>
					{
						// Arrange
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "admin",
									email: "admin@test.com",
									fullName: "Test Admin",
									roles: [TEST_ROLE_ADMIN]
								}));

						// Act
						fixture.detectChanges();

						// Assert
						const sections: { title: string; }[] =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles)
							.toContain("Developer");
						expect(sectionTitles)
							.toContain("Management");
					});

				it("should update visible sections when user logs in",
					() =>
					{
						// Arrange - start as guest
						fixture.detectChanges();
						let sections: { title: string; }[] =
							component["visibleNavSections"]();
						expect(sections.length)
							.toBe(1); // Only Main

						// Act - log in as admin
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "admin",
									email: "admin@test.com",
									fullName: "Test Admin",
									roles: [TEST_ROLE_ADMIN]
								}));
						fixture.detectChanges();

						// Assert
						sections =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles)
							.toContain("Developer");
						expect(sectionTitles)
							.toContain("Management");
					});

				it("should update visible sections when user logs out",
					() =>
					{
						// Arrange - start as admin
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "admin",
									email: "admin@test.com",
									fullName: "Test Admin",
									roles: [TEST_ROLE_ADMIN]
								}));
						fixture.detectChanges();
						let sections: { title: string; }[] =
							component["visibleNavSections"]();
						expect(sections.length)
							.toBe(3); // All sections

						// Act - log out
						mockAuthService.setUser(null);
						fixture.detectChanges();

						// Assert
						sections =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles).not.toContain("Developer");
						expect(sectionTitles).not.toContain("Management");
					});

				it("should show Developer section for users with both Developer and Admin roles",
					() =>
					{
						// Arrange
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "superuser",
									email: "super@test.com",
									fullName: "Super User",
									roles: [TEST_ROLE_DEVELOPER, TEST_ROLE_ADMIN]
								}));

						// Act
						fixture.detectChanges();

						// Assert
						const sections: { title: string; }[] =
							component["visibleNavSections"]();
						const sectionTitles: string[] =
							sections.map(
								(s: { title: string; }) => s.title);

						expect(sectionTitles)
							.toContain("Main");
						expect(sectionTitles)
							.toContain("Developer");
						expect(sectionTitles)
							.toContain("Management");
					});
			});

		describe("accessibility",
			() =>
			{
				it("should have navigation landmark with aria-label",
					() =>
					{
						const nav: HTMLElement | null =
							fixture.nativeElement.querySelector("nav");

						expect(nav?.getAttribute("aria-label"))
							.toBe("Main navigation");
					});

				it("should have aria-label on close button",
					() =>
					{
						const closeButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".close-sidebar-btn");

						expect(closeButton?.getAttribute("aria-label"))
							.toBe("Close navigation menu");
					});

				it("should have aria-hidden on close button icon",
					() =>
					{
						const icon: HTMLElement | null =
							fixture.nativeElement.querySelector(".close-sidebar-btn mat-icon");

						expect(icon?.getAttribute("aria-hidden"))
							.toBe("true");
					});

				it("should have section headings with ids",
					() =>
					{
						const headings: NodeListOf<HTMLElement> =
							fixture.nativeElement.querySelectorAll(".nav-section-title");

						headings.forEach(
							(heading: HTMLElement, index: number) =>
							{
								expect(heading.getAttribute("id"))
									.toBe(`nav-section-${index}`);
							});
					});

				it("should have nav lists with aria-labelledby",
					() =>
					{
						const navLists: NodeListOf<HTMLElement> =
							fixture.nativeElement.querySelectorAll("mat-nav-list");

						navLists.forEach(
							(navList: HTMLElement, index: number) =>
							{
								expect(navList.getAttribute("aria-labelledby"))
									.toBe(`nav-section-${index}`);
							});
					});
			});
	});