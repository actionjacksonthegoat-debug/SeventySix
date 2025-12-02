import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter, Routes } from "@angular/router";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { of } from "rxjs";
import { RequestPermissionsPage } from "./request-permissions";
import { AccountService } from "../services";
import { AccountRepository } from "../repositories";

const testRoutes: Routes = [
	{ path: "account", component: RequestPermissionsPage }
];

describe("RequestPermissionsPage", () =>
{
	let component: RequestPermissionsPage;
	let fixture: ComponentFixture<RequestPermissionsPage>;
	let mockRepository: jasmine.SpyObj<AccountRepository>;
	let queryClient: QueryClient;

	beforeEach(async () =>
	{
		mockRepository = jasmine.createSpyObj(
			"AccountRepository",
			["getAvailableRoles", "createPermissionRequest"]
		);
		mockRepository.getAvailableRoles.and.returnValue(
			of([
				{ name: "Admin", description: "Administrator access" },
				{ name: "Developer", description: "Developer access" }
			])
		);

		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } }
		});

		await TestBed.configureTestingModule({
			imports: [RequestPermissionsPage],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideRouter(testRoutes),
				provideAngularQuery(queryClient),
				AccountService,
				{ provide: AccountRepository, useValue: mockRepository }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(RequestPermissionsPage);
		component = fixture.componentInstance;
		await fixture.whenStable();
		fixture.detectChanges();
	});

	afterEach(() => queryClient.clear());

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should toggle role selection", () =>
	{
		expect(component.selectedRoles().has("Admin")).toBeFalse();

		component.toggleRole("Admin");
		expect(component.selectedRoles().has("Admin")).toBeTrue();

		component.toggleRole("Admin");
		expect(component.selectedRoles().has("Admin")).toBeFalse();
	});

	it("should not submit without selected roles", async () =>
	{
		await component.onSubmit();

		expect(mockRepository.createPermissionRequest).not.toHaveBeenCalled();
	});

	it("should submit with selected roles", async () =>
	{
		mockRepository.createPermissionRequest.and.returnValue(of(undefined));
		component.toggleRole("Admin");
		component.requestForm.patchValue({ requestMessage: "Need access" });

		await component.onSubmit();

		expect(mockRepository.createPermissionRequest).toHaveBeenCalledWith({
			requestedRoles: ["Admin"],
			requestMessage: "Need access"
		});
	});
});
