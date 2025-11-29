import { ComponentFixture } from "@angular/core/testing";
import { UserList } from "@features/admin/users/components/user-list/user-list";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@infrastructure/services/logger.service";
import { PagedResponse } from "@infrastructure/models";
import { User } from "@admin/users/models";
import { UsersComponent } from "./users.component";
import { ActivatedRoute } from "@angular/router";
import {
	createMockQueryResult,
	createMockMutationResult,
	ComponentTestBed,
	createMockLogger,
	createMockActivatedRoute
} from "@testing";

describe("UsersComponent", () =>
{
	let component: UsersComponent;
	let fixture: ComponentFixture<UsersComponent>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", [
			"getPagedUsers",
			"updateUser",
			"deleteUser",
			"resetPassword",
			"bulkActivateUsers",
			"bulkDeactivateUsers",
			"getCurrentFilter",
			"updateFilter",
			"setPage",
			"setPageSize"
		]);
		mockLogger = createMockLogger();
		mockActivatedRoute = createMockActivatedRoute();

		// Set default mock return values
		mockUserService.getPagedUsers.and.returnValue(
			createMockQueryResult<PagedResponse<User>, Error>({
				items: [],
				totalCount: 0,
				page: 1,
				pageSize: 50,
				totalPages: 0,
				hasPrevious: false,
				hasNext: false
			})
		);
		mockUserService.getCurrentFilter.and.returnValue({
			page: 1,
			pageSize: 50
		});
		mockUserService.updateUser.and.returnValue(
			createMockMutationResult<
				User,
				Error,
				{ id: number | string; user: any },
				unknown
			>()
		);
		mockUserService.deleteUser.and.returnValue(
			createMockMutationResult<void, Error, number | string, unknown>()
		);
		mockUserService.bulkActivateUsers.and.returnValue(
			createMockMutationResult<number, Error, number[], unknown>()
		);
		mockUserService.bulkDeactivateUsers.and.returnValue(
			createMockMutationResult<number, Error, number[], unknown>()
		);
		mockUserService.resetPassword.and.returnValue(
			createMockMutationResult<void, Error, number | string, unknown>()
		);

		fixture = await new ComponentTestBed<UsersComponent>()
			.withImport(UserList)
			.withProvider({
				provide: ActivatedRoute,
				useValue: mockActivatedRoute
			})
			.withProvider({ provide: UserService, useValue: mockUserService })
			.withProvider({ provide: LoggerService, useValue: mockLogger })
			.build(UsersComponent);

		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display correct page title", () =>
	{
		expect(component.pageTitle()).toBe("User Management");
	});

	it("should render page header with title", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		const compiled: HTMLElement = fixture.nativeElement;
		const title: HTMLElement | null = compiled.querySelector("h1");
		expect(title).toBeTruthy();
		expect(title?.textContent).toContain("User Management");
	});

	it("should embed UserList component", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		const compiled: HTMLElement = fixture.nativeElement;
		const userList: HTMLElement | null =
			compiled.querySelector("app-user-list");
		expect(userList).toBeTruthy();
	});

	it("should have a title", () =>
	{
		fixture.detectChanges();
		const compiled: HTMLElement = fixture.nativeElement;
		const title: HTMLElement | null = compiled.querySelector("h1");
		expect(title).toBeTruthy();
	});
});
