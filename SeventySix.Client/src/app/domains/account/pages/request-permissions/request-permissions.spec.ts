import { AccountService } from "@account/services";
import { AvailableRoleFixtures } from "@account/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Routes } from "@angular/router";
import { ApiService } from "@shared/services/api.service";
import {
	createMockApiService,
	createTestQueryClient,
	MockApiService
} from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { RequestPermissionsPage } from "./request-permissions";

const testRoutes: Routes =
	[
		{ path: "account", component: RequestPermissionsPage }
	];

describe("RequestPermissionsPage",
	() =>
	{
		let component: RequestPermissionsPage;
		let fixture: ComponentFixture<RequestPermissionsPage>;
		let mockApiService: MockApiService;
		let queryClient: QueryClient;

		beforeEach(
			async () =>
			{
				mockApiService =
					createMockApiService();
				mockApiService.get.mockReturnValue(
					of(AvailableRoleFixtures.getAll()));

				queryClient =
					createTestQueryClient();

				await TestBed
					.configureTestingModule(
						{
							imports: [RequestPermissionsPage],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter(testRoutes),
								provideTanStackQuery(queryClient),
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

		afterEach(
			() => queryClient.clear());

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should toggle role selection",
			() =>
			{
				expect(
					component
						.selectedRoles()
						.has("Admin"))
					.toBe(false);

				component.toggleRole("Admin");
				expect(
					component
						.selectedRoles()
						.has("Admin"))
					.toBe(true);

				component.toggleRole("Admin");
				expect(
					component
						.selectedRoles()
						.has("Admin"))
					.toBe(false);
			});

		it("should not submit without selected roles",
			async () =>
			{
				await component.onSubmit();

				expect(mockApiService.post).not.toHaveBeenCalled();
			});

		it("should submit with selected roles",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));
				component.toggleRole("Admin");
				component.requestForm.patchValue(
					{ requestMessage: "Need access" });

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
