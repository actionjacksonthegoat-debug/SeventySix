import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { Router } from "@angular/router";
import { UserList } from "./user-list";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { createMockQueryResult } from "@core/testing/tanstack-query-helpers";
import { User } from "@admin/users/models";

describe("UserList", () =>
{
	let component: UserList | undefined;
	let fixture: ComponentFixture<UserList> | undefined;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockRouter: jasmine.SpyObj<Router>;

	const mockUsers: User[] = [
		{
			id: 1,
			username: "john_doe",
			email: "john@example.com",
			fullName: "John Doe",
			createdAt: "2024-01-01T00:00:00Z",
			isActive: true
		},
		{
			id: 2,
			username: "jane_smith",
			email: "jane@example.com",
			fullName: "Jane Smith",
			createdAt: "2024-01-02T00:00:00Z",
			isActive: false
		}
	];

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", ["getAllUsers"]);
		mockLogger = jasmine.createSpyObj("LoggerService", ["info", "error"]);
		mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

		await TestBed.configureTestingModule({
			imports: [UserList],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: Router, useValue: mockRouter }
			]
		}).compileComponents();
	});

	it("should create", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>([])
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		expect(component).toBeTruthy();
	});

	it("should load users on initialization", async () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.users()).toEqual(mockUsers);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Users loaded successfully",
			{ count: 2 }
		);
	});

	it("should handle error when loading users fails", async () =>
	{
		const error: Error = new Error("Network error");
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(undefined, {
				isError: true,
				error
			})
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.users()).toEqual([]);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe(
			"Failed to load users. Please try again."
		);
		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to load users",
			error
		);
	});

	it("should compute user statistics correctly", async () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.userCount()).toBe(2);
		expect(component.activeUserCount()).toBe(1);
		expect(component.inactiveUserCount()).toBe(1);
		expect(component.hasUsers()).toBe(true);
	});

	it("should retry loading users", async () =>
	{
		const error: Error = new Error("Error");
		const errorQuery = createMockQueryResult<User[], Error>(undefined, {
			isError: true,
			error
		});
		mockUserService.getAllUsers.and.returnValue(errorQuery);

		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		// Verify error state
		expect(component.error()).toBe(
			"Failed to load users. Please try again."
		);

		// Update the refetch spy to simulate successful retry
		const refetchSpy = errorQuery.refetch as jasmine.Spy;
		refetchSpy.and.returnValue(
			Promise.resolve({
				data: mockUsers,
				error: null,
				isError: false,
				isSuccess: true
			})
		);

		// Manually update the query signals to simulate successful refetch
		(component.usersQuery.data as any).set(mockUsers);
		(component.usersQuery.isError as any).set(false);
		(component.usersQuery.error as any).set(null);
		(component.usersQuery.isLoading as any).set(false);

		component.retry();
		await fixture.whenStable();

		expect(component.usersQuery.refetch).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it("should display users in table after loading", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;
		fixture.detectChanges();

		const compiled = fixture.nativeElement;
		const rows = compiled.querySelectorAll("tbody tr");

		expect(rows.length).toBeGreaterThan(0);
	});

	it("should display status chips for users", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;
		fixture.detectChanges();

		const compiled = fixture.nativeElement;
		const chips = compiled.querySelectorAll("mat-chip");

		expect(chips.length).toBeGreaterThan(0);
	});
});
