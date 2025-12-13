import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter, Routes } from "@angular/router";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { createMockApiService } from "@testing";
import { of } from "rxjs";
import { AccountService } from "../services";
import { RequestPermissionsPage } from "./request-permissions";

const testRoutes: Routes =
	[
		{ path: "account", component: RequestPermissionsPage }
	];

describe("RequestPermissionsPage", () =>
{
	let component: RequestPermissionsPage;
	let fixture: ComponentFixture<RequestPermissionsPage>;
	let mockApiService: jasmine.SpyObj<ApiService>;
	let queryClient: QueryClient;

	beforeEach(async () =>
	{
		mockApiService =
			createMockApiService() as jasmine.SpyObj<ApiService>;
		mockApiService.get.and.returnValue(
			of([
				{ name: "Admin", description: "Administrator access" },
				{ name: "Developer", description: "Developer access" }
			]));

		queryClient =
			new QueryClient({
			defaultOptions: { queries: { retry: false } }
		});

		await TestBed
			.configureTestingModule({
				imports: [RequestPermissionsPage],
				providers: [
					provideZonelessChangeDetection(),
					provideNoopAnimations(),
					provideRouter(testRoutes),
					provideAngularQuery(queryClient),
					AccountService,
					{ provide: ApiService, useValue: mockApiService }
				]
			})
			.compileComponents();

		fixture =
			TestBed.createComponent(RequestPermissionsPage);
		component =
			fixture.componentInstance;
		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => queryClient.clear());

	it("should create", () =>
	{
		expect(component)
			.toBeTruthy();
	});

	it("should toggle role selection", () =>
	{
		expect(
			component
				.selectedRoles()
				.has("Admin"))
			.toBeFalse();

		component.toggleRole("Admin");
		expect(
			component
				.selectedRoles()
				.has("Admin"))
			.toBeTrue();

		component.toggleRole("Admin");
		expect(
			component
				.selectedRoles()
				.has("Admin"))
			.toBeFalse();
	});

	it("should not submit without selected roles", async () =>
	{
		await component.onSubmit();

		expect(mockApiService.post).not.toHaveBeenCalled();
	});

	it("should submit with selected roles", async () =>
	{
		mockApiService.post.and.returnValue(of(undefined));
		component.toggleRole("Admin");
		component.requestForm.patchValue({ requestMessage: "Need access" });

		await component.onSubmit();

		expect(mockApiService.post)
			.toHaveBeenCalledWith(
				"users/me/permission-requests",
				{
					requestedRoles: ["Admin"],
					requestMessage: "Need access"
				});
	});
});
