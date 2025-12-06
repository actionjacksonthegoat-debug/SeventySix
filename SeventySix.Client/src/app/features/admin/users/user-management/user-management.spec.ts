import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { UserManagementPage } from "./user-management";
import { UserService } from "@admin/users/services";

describe("UserManagementPage", () =>
{
	let fixture: ComponentFixture<UserManagementPage>;

	const mockUserService: Partial<UserService> = {
		getPagedUsers: jasmine.createSpy("getPagedUsers").and.returnValue({
			data: () => ({ items: [], totalCount: 0, page: 1, pageSize: 50 }),
			isLoading: () => false,
			error: () => null,
			isSuccess: () => true
		}),
		updateUser: jasmine.createSpy("updateUser").and.returnValue({
			mutate: jasmine.createSpy("mutate"),
			isPending: () => false
		}),
		resetPassword: jasmine.createSpy("resetPassword").and.returnValue({
			mutate: jasmine.createSpy("mutate"),
			isPending: () => false
		}),
		restoreUser: jasmine.createSpy("restoreUser").and.returnValue({
			mutate: jasmine.createSpy("mutate"),
			isPending: () => false
		}),
		updateFilter: jasmine.createSpy("updateFilter"),
		getCurrentFilter: jasmine
			.createSpy("getCurrentFilter")
			.and.returnValue({
				page: 1,
				pageSize: 50,
				sortBy: "Id",
				sortDescending: true
			})
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [UserManagementPage],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClientTesting(),
				provideRouter([]),
				{ provide: UserService, useValue: mockUserService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserManagementPage);
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render page header with title", () =>
	{
		const header: HTMLElement | null =
			fixture.nativeElement.querySelector("app-page-header");
		expect(header).toBeTruthy();
	});
});
