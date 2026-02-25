import { AccountService } from "@account/services";
import { ProfileFixtures } from "@account/testing";
import { provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { FeatureFlagsService } from "@shared/services";
import { ApiService } from "@shared/services/api.service";
import { AuthService } from "@shared/services/auth.service";
import { ExternalLoginDto } from "@shared/services/auth.types";
import type { OAuthProvider } from "@shared/services/auth.types";
import {
	createMockApiService,
	createMockFeatureFlagsService,
	createTestQueryClient,
	MockApiService
} from "@shared/testing";
import { registerOAuthIcons } from "@shared/utilities/oauth-icons.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { vi } from "vitest";
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
								{ provide: ApiService, useValue: mockApiService },
								{
									provide: FeatureFlagsService,
									useValue: createMockFeatureFlagsService()
								}
							]
						})
					.compileComponents();

				registerOAuthIcons(
					TestBed.inject(MatIconRegistry),
					TestBed.inject(DomSanitizer));

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

describe("ProfilePage linked accounts",
	() =>
	{
		let mockApiService: MockApiService;
		let queryClient: QueryClient;
		let mockIsOAuthInProgress: WritableSignal<boolean>;
		let mockLinkProvider: ReturnType<typeof vi.fn<(provider: OAuthProvider) => void>>;

		/** GitHub external login fixture */
		const GITHUB_LOGIN: ExternalLoginDto =
			{
				provider: "GitHub",
				providerDisplayName: "GitHub"
			};

		/** Pre-populate TanStack Query cache and create component */
		async function createFixture(
			logins: ExternalLoginDto[],
			profileOverrides?: Partial<ReturnType<typeof ProfileFixtures.create>>): Promise<ComponentFixture<ProfilePage>>
		{
			const profile: ReturnType<typeof ProfileFixtures.create> =
				ProfileFixtures.create(profileOverrides);

			queryClient.setQueryData(
				QueryKeys.account.profile,
				profile);
			queryClient.setQueryData(
				QueryKeys.account.externalLogins,
				logins);
			queryClient.setQueryData(
				QueryKeys.account.availableRoles,
				[]);

			const componentFixture: ComponentFixture<ProfilePage> =
				TestBed.createComponent(ProfilePage);
			await componentFixture.whenStable();
			componentFixture.detectChanges();
			return componentFixture;
		}

		beforeEach(
			async () =>
			{
				mockApiService =
					createMockApiService();
				queryClient =
					createTestQueryClient();
				mockIsOAuthInProgress =
					signal<boolean>(false);
				mockLinkProvider =
					vi.fn();

				const mockAuthService: Partial<AuthService> =
					{
						isOAuthInProgress: mockIsOAuthInProgress,
						linkProvider: mockLinkProvider
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [ProfilePage],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								provideTanStackQuery(queryClient),
								AccountService,
								{ provide: ApiService, useValue: mockApiService },
								{ provide: AuthService, useValue: mockAuthService },
								{
									provide: FeatureFlagsService,
									useValue: createMockFeatureFlagsService()
								}
							]
						})
					.compileComponents();

				registerOAuthIcons(
					TestBed.inject(MatIconRegistry),
					TestBed.inject(DomSanitizer));
			});

		afterEach(
			() => queryClient.clear());

		it("should render linked providers with Disconnect button",
			async () =>
			{
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture(
						[GITHUB_LOGIN]);

				const disconnectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Disconnect GitHub']");
				expect(disconnectButton)
					.toBeTruthy();
				expect(disconnectButton?.textContent)
					.toContain("Disconnect");
			});

		it("should render unlinked providers with Connect button",
			async () =>
			{
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture([]);

				const connectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Connect GitHub']");
				expect(connectButton)
					.toBeTruthy();
				expect(connectButton?.textContent)
					.toContain("Connect");
			});

		it("should disable Disconnect when would lock out user",
			async () =>
			{
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture(
						[GITHUB_LOGIN],
						{ hasPassword: false });

				const disconnectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Disconnect GitHub']");
				expect(disconnectButton?.disabled)
					.toBe(true);
			});

		it("should enable Disconnect when user has password",
			async () =>
			{
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture(
						[GITHUB_LOGIN],
						{ hasPassword: true });

				const disconnectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Disconnect GitHub']");
				expect(disconnectButton?.disabled)
					.toBe(false);
			});

		it("should call linkProvider when Connect is clicked",
			async () =>
			{
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture([]);

				const connectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Connect GitHub']");
				connectButton?.click();

				expect(mockLinkProvider)
					.toHaveBeenCalledWith("github");
			});

		it("should call unlink API when Disconnect is clicked",
			async () =>
			{
				mockApiService.delete.mockReturnValue(of(undefined));
				const componentFixture: ComponentFixture<ProfilePage> =
					await createFixture(
						[GITHUB_LOGIN],
						{ hasPassword: true });

				const disconnectButton: HTMLButtonElement | null =
					componentFixture.nativeElement.querySelector(
						"button[aria-label='Disconnect GitHub']");
				disconnectButton?.click();
				await componentFixture.whenStable();

				expect(mockApiService.delete)
					.toHaveBeenCalledWith("auth/oauth/link/github");
			});
	});