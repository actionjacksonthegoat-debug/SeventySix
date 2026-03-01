import { AccountService } from "@account/services";
import { AvailableRoleFixtures } from "@account/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Routes } from "@angular/router";
import { ROLE_ADMIN, ROLE_DEVELOPER } from "@shared/constants/role.constants";
import { ApiService } from "@shared/services/api.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockApiService,
	createTestQueryClient,
	MockApiService
} from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
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
						.has(ROLE_ADMIN))
					.toBe(false);

				component.toggleRole(ROLE_ADMIN);
				expect(
					component
						.selectedRoles()
						.has(ROLE_ADMIN))
					.toBe(true);

				component.toggleRole(ROLE_ADMIN);
				expect(
					component
						.selectedRoles()
						.has(ROLE_ADMIN))
					.toBe(false);
			});

		it("should not submit without selected roles",
			async () =>
			{
				const notificationService: NotificationService =
					TestBed.inject(NotificationService);
				vi.spyOn(notificationService, "warning");

				await component.onSubmit();

				expect(mockApiService.post).not.toHaveBeenCalled();
				expect(notificationService.warning)
					.toHaveBeenCalledWith("Select at least one role");
			});

		it("should submit with selected roles",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));
				component.toggleRole(ROLE_ADMIN);
				component.requestForm.patchValue(
					{ requestMessage: "Need access" });

				await component.onSubmit();

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/me/permission-requests",
						{
							requestedRoles: [ROLE_ADMIN],
							requestMessage: "Need access"
						});
			});

		it("should submit with undefined requestMessage when message is empty",
			async () =>
			{
				mockApiService.post.mockReturnValue(of(undefined));
				component.toggleRole(ROLE_DEVELOPER);
				// requestMessage defaults to "" (falsy) - should send undefined

				await component.onSubmit();

				expect(mockApiService.post)
					.toHaveBeenCalledWith(
						"users/me/permission-requests",
						{
							requestedRoles: [ROLE_DEVELOPER],
							requestMessage: undefined
						});
			});

		it("should show success notification after submit",
			async () =>
			{
				const notificationService: NotificationService =
					TestBed.inject(NotificationService);
				vi.spyOn(notificationService, "success");
				mockApiService.post.mockReturnValue(of(undefined));
				component.toggleRole(ROLE_ADMIN);

				await component.onSubmit();

				expect(notificationService.success)
					.toHaveBeenCalledWith("Permission request submitted");
			});

		it("should show error notification when submit fails",
			async () =>
			{
				const notificationService: NotificationService =
					TestBed.inject(NotificationService);
				vi.spyOn(notificationService, "error");
				mockApiService.post.mockReturnValue(
					throwError(
						() => new Error("Server error")));
				component.toggleRole(ROLE_ADMIN);

				await component.onSubmit();

				expect(notificationService.error)
					.toHaveBeenCalledWith("Failed to submit request");
			});
	});