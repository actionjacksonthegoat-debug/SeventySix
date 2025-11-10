import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { Router } from "@angular/router";
import { UserList } from "./user-list";
import { UserService } from "@core/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { of, throwError } from "rxjs";
import { User } from "@core/models/interfaces/user";

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
		mockUserService.getAllUsers.and.returnValue(of([]));
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		expect(component).toBeTruthy();
	});

	it("should load users on initialization", async () =>
	{
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
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
		const error = new Error("Network error");
		mockUserService.getAllUsers.and.returnValue(throwError(() => error));
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
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
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
		mockUserService.getAllUsers.and.returnValue(
			throwError(() => new Error("Error"))
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
		component.retry();
		await fixture.whenStable();

		expect(component.users()).toEqual(mockUsers);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
	});

	it("should track users by ID", () =>
	{
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		const user = mockUsers[0];
		const trackResult = component.trackById(0, user);

		expect(trackResult).toBe(user.id);
	});

	it("should return correct status class", () =>
	{
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		expect(component.getStatusClass(mockUsers[0])).toBe("status-active");
		expect(component.getStatusClass(mockUsers[1])).toBe("status-inactive");
	});

	it("should return correct status text", () =>
	{
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		expect(component.getStatusText(mockUsers[0])).toBe("Active");
		expect(component.getStatusText(mockUsers[1])).toBe("Inactive");
	});

	it("should navigate to user detail on click", () =>
	{
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		const user = mockUsers[0];
		component.onUserClick(user);

		expect(mockRouter.navigate).toHaveBeenCalledWith(["/users", 1]);
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Navigating to user detail",
			{ userId: 1 }
		);
	});
});
