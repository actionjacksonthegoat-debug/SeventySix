import { AccountService } from "@account/services";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ApiService } from "@shared/services/api.service";
import { createMockApiService, MockApiService } from "@shared/testing";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { ProfilePage } from "./profile";

describe("ProfilePage",
	() =>
	{
		let component: ProfilePage;
		let fixture: ComponentFixture<ProfilePage>;
		let mockApiService: MockApiService;
		let queryClient: QueryClient;

		beforeEach(
			async () =>
			{
				mockApiService =
					createMockApiService();
				mockApiService.get.mockReturnValue(
					of(
						{
							id: 1,
							username: "testuser",
							email: "test@example.com",
							fullName: "Test User",
							roles: ["User"],
							hasPassword: true,
							linkedProviders: [],
							lastLoginAt: "2024-01-01T12:00:00Z"
						}));

				queryClient =
					new QueryClient(
						{
							defaultOptions: { queries: { retry: false } }
						});

				await TestBed
					.configureTestingModule(
						{
							imports: [ProfilePage],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								provideAngularQuery(queryClient),
								AccountService,
								{ provide: ApiService, useValue: mockApiService }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ProfilePage);
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

		it("should not submit invalid form",
			async () =>
			{
				component.profileForm.patchValue(
					{ email: "invalid" });

				await component.onSubmit();

				expect(mockApiService.put).not.toHaveBeenCalled();
			});

		it("should submit valid form",
			async () =>
			{
				mockApiService.put.mockReturnValue(of({}));
				component.profileForm.patchValue(
					{
						email: "new@example.com",
						fullName: "New Name"
					});
				component.profileForm.markAsDirty();

				await component.onSubmit();

				expect(mockApiService.put)
					.toHaveBeenCalledWith(
						"users/me",
						{
							email: "new@example.com",
							fullName: "New Name"
						});
			});
	});
