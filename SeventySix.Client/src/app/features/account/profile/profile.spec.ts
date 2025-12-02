import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { ProfilePage } from "./profile";
import { AccountService } from "../services";
import { AccountRepository } from "../repositories";

describe("ProfilePage", () =>
{
	let component: ProfilePage;
	let fixture: ComponentFixture<ProfilePage>;
	let mockRepository: jasmine.SpyObj<AccountRepository>;
	let queryClient: QueryClient;

	beforeEach(async () =>
	{
		mockRepository = jasmine.createSpyObj(
			"AccountRepository",
			["getProfile", "updateProfile"]
		);
		mockRepository.getProfile.and.returnValue(
			of({
				id: 1,
				username: "testuser",
				email: "test@example.com",
				createDate: "2024-01-01",
				roles: ["User"]
			})
		);

		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } }
		});

		await TestBed.configureTestingModule({
			imports: [ProfilePage],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideRouter([]),
				provideAngularQuery(queryClient),
				AccountService,
				{ provide: AccountRepository, useValue: mockRepository }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(ProfilePage);
		component = fixture.componentInstance;
		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => queryClient.clear());

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should not submit invalid form", async () =>
	{
		component.profileForm.patchValue({ email: "invalid" });

		await component.onSubmit();

		expect(mockRepository.updateProfile).not.toHaveBeenCalled();
	});

	it("should submit valid form", async () =>
	{
		mockRepository.updateProfile.and.returnValue(of({} as any));
		component.profileForm.patchValue({
			email: "new@example.com",
			fullName: "New Name"
		});
		component.profileForm.markAsDirty();

		await component.onSubmit();

		expect(mockRepository.updateProfile).toHaveBeenCalledWith({
			email: "new@example.com",
			fullName: "New Name"
		});
	});
});
