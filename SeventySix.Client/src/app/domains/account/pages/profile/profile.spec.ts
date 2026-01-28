import { AccountService } from "@account/services";
import { ProfileFixtures } from "@account/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
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
					of(ProfileFixtures.STANDARD_USER));

				queryClient =
					createTestQueryClient();

				await TestBed
					.configureTestingModule(
						{
							imports: [ProfilePage],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								provideTanStackQuery(queryClient),
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
