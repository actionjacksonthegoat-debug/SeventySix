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
import { QueryKeys } from "@shared/utilities/query-keys.utility";
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

		it("should not overwrite dirty form on query refetch",
			async () =>
			{
				// Simulate user editing the form (makes it dirty)
				component.profileForm.patchValue(
					{ fullName: "Unsaved Edit" });
				component.profileForm.markAsDirty();

				// Simulate a background refetch updating the profile signal
				queryClient.setQueryData(
					QueryKeys.account.profile,
					{ ...ProfileFixtures.STANDARD_USER, fullName: "Server Value" });
				await fixture.whenStable();
				fixture.detectChanges();

				// Form should retain the user's unsaved edit
				expect(component.profileForm.get("fullName")?.value)
					.toBe("Unsaved Edit");
				expect(component.profileForm.dirty)
					.toBe(true);
			});
	});
