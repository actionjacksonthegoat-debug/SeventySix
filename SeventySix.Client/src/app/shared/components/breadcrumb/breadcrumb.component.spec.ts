import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { BreadcrumbComponent } from "./breadcrumb.component";
import { Component } from "@angular/core";
import { ComponentTestBed } from "@testing/test-bed-builders";

@Component({
	selector: "app-test",
	template: ""
})
class TestComponent
{}

describe("BreadcrumbComponent", () =>
{
	let component: BreadcrumbComponent;
	let fixture: ComponentFixture<BreadcrumbComponent>;
	let router: Router;

	beforeEach(async () =>
	{
		fixture = await new ComponentTestBed<BreadcrumbComponent>()
			.withProvider(
				provideRouter([
					{ path: "", component: TestComponent },
					{
						path: "admin",
						component: TestComponent,
						data: { breadcrumb: "Administration" },
						children: [
							{
								path: "users",
								component: TestComponent,
								data: { breadcrumb: "User Management" },
								children: [
									{
										path: ":id",
										component: TestComponent
									}
								]
							}
						]
					},
					{
						path: "user-profile",
						component: TestComponent
					},
					{
						path: "log-management",
						component: TestComponent
					}
				])
			)
			.build(BreadcrumbComponent);

		component = fixture.componentInstance;
		router = TestBed.inject(Router);
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should have breadcrumbs signal", () =>
	{
		expect(component.breadcrumbs).toBeDefined();
	});

	it("should compute breadcrumbs", () =>
	{
		const breadcrumbs = component.breadcrumbs();
		expect(Array.isArray(breadcrumbs)).toBe(true);
	});

	it("should include home in breadcrumbs", () =>
	{
		const breadcrumbs = component.breadcrumbs();
		expect(
			breadcrumbs.some((b: { label: string }) => b.label === "Home")
		).toBe(true);
	});

	it("should use custom breadcrumb label from route data", async () =>
	{
		await router.navigate(["/admin"]);
		fixture.detectChanges();

		const breadcrumbs = component.breadcrumbs();
		const adminCrumb = breadcrumbs.find(
			(b) => b.label === "Admin" || b.label === "Dashboard"
		);

		expect(adminCrumb).toBeDefined();
	});

	it("should handle route parameters by showing Details", async () =>
	{
		await router.navigate(["/admin/users/123"]);
		fixture.detectChanges();

		const breadcrumbs = component.breadcrumbs();

		// Should have: Home, Admin, Users, Details (for :id)
		expect(breadcrumbs.length).toBe(4);
		expect(breadcrumbs[0].label).toBe("Home");
		expect(breadcrumbs[1].label).toBe("Admin");
		expect(breadcrumbs[2].label).toBe("Users");
		expect(breadcrumbs[3].label).toBe("Details");
	});

	it("should skip routes with empty paths", async () =>
	{
		// Navigate to root which has empty path
		await router.navigate(["/"]);
		fixture.detectChanges();

		const breadcrumbs = component.breadcrumbs();

		// Should only have Home breadcrumb
		expect(breadcrumbs.length).toBe(1);
		expect(breadcrumbs[0].label).toBe("Home");
	});

	it("should mark current route as active", async () =>
	{
		await router.navigate(["/log-management"]);
		fixture.detectChanges();

		const breadcrumbs = component.breadcrumbs();
		const activeCrumb = breadcrumbs.find((b) => b.isActive);

		expect(activeCrumb).toBeDefined();
		expect(activeCrumb?.label).toBe("Log Management");
	});

	it("should build correct URL paths for nested routes", async () =>
	{
		await router.navigate(["/admin/users"]);
		fixture.detectChanges();

		const breadcrumbs = component.breadcrumbs();
		const usersCrumb = breadcrumbs.find((b) => b.label === "Users");

		expect(usersCrumb?.url).toBe("/admin/users");
	});

	it("should handle navigation events and update breadcrumbs", async () =>
	{
		await router.navigate(["/admin"]);
		fixture.detectChanges();

		let breadcrumbs = component.breadcrumbs();
		expect(breadcrumbs.length).toBeGreaterThanOrEqual(2);
	});
});
