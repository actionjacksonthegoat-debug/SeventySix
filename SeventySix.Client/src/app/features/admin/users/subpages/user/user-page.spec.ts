import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import {
	createMockQueryResult,
	createMockMutationResult
} from "@core/testing/tanstack-query-helpers";
import { User } from "@admin/users/models";
import { UserPage } from "./user-page";

describe("UserPage", () =>
{
	let component: UserPage;
	let fixture: ComponentFixture<UserPage>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockRouter: jasmine.SpyObj<Router>;
	let mockActivatedRoute: any;

	const mockUser: User = {
		id: 1,
		username: "john_doe",
		email: "john@example.com",
		fullName: "John Doe",
		createdAt: "2024-01-01T00:00:00Z",
		isActive: true
	};

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", [
			"getUserById",
			"updateUser"
		]);
		mockLogger = jasmine.createSpyObj("LoggerService", ["info", "error"]);
		mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

		mockActivatedRoute = {
			snapshot: {
				paramMap: {
					get: jasmine.createSpy("get").and.returnValue("1")
				}
			}
		};

		mockUserService.getUserById.and.returnValue(
			createMockQueryResult(mockUser)
		);
		mockUserService.updateUser.and.returnValue(createMockMutationResult());

		await TestBed.configureTestingModule({
			imports: [UserPage],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: Router, useValue: mockRouter },
				{ provide: ActivatedRoute, useValue: mockActivatedRoute }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;

		// Run initial detectChanges in injection context to handle effect()
		TestBed.runInInjectionContext(() =>
		{
			fixture.detectChanges();
		});
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should load user on initialization", async () =>
	{
		await fixture.whenStable();

		expect(mockUserService.getUserById).toHaveBeenCalledWith("1");
		expect(component.user()).toEqual(mockUser);
		expect(component.isLoading()).toBe(false);
	});

	it("should initialize form with user data", async () =>
	{
		await fixture.whenStable();

		expect(component.userForm.value).toEqual({
			username: "john_doe",
			email: "john@example.com",
			fullName: "John Doe",
			isActive: true
		});
	});

	it("should handle error when loading user fails", async () =>
	{
		const error: Error = new Error("Not found");
		mockUserService.getUserById.and.returnValue(
			createMockQueryResult<User, Error>(undefined, {
				isError: true,
				error
			})
		);

		// Recreate component with error mock
		const errorFixture: ComponentFixture<UserPage> =
			TestBed.createComponent(UserPage);
		const errorComponent: UserPage = errorFixture.componentInstance;
		TestBed.runInInjectionContext(() =>
		{
			errorFixture.detectChanges();
		});
		await errorFixture.whenStable();

		expect(errorComponent.error()).toBe(
			"Failed to load user. Please try again."
		);
		expect(errorComponent.isLoading()).toBe(false);
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it("should validate required fields", async () =>
	{
		await fixture.whenStable();

		component.userForm.patchValue({
			username: "",
			email: "",
			fullName: "",
			isActive: true
		});

		expect(component.userForm.valid).toBe(false);
		expect(component.userForm.get("username")?.errors?.["required"]).toBe(
			true
		);
		expect(component.userForm.get("email")?.errors?.["required"]).toBe(
			true
		);
	});

	it("should validate email format", async () =>
	{
		await fixture.whenStable();

		component.userForm.patchValue({
			email: "invalid-email"
		});

		expect(component.userForm.get("email")?.errors?.["email"]).toBe(true);
	});

	it("should update user on valid form submission", async () =>
	{
		const updatedUser: User = { ...mockUser, fullName: "Jane Doe" };
		const localMockMutationResult = createMockMutationResult<
			User,
			Error,
			{ id: string | number; user: Partial<User> },
			unknown
		>();
		localMockMutationResult.mutate = jasmine
			.createSpy("mutate")
			.and.callFake((variables, options) =>
			{
				if (options?.onSuccess)
				{
					options.onSuccess(updatedUser, variables, undefined);
				}
			});
		mockUserService.updateUser.and.returnValue(localMockMutationResult);

		// Recreate component to get new mutation instance
		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() =>
		{
			fixture.detectChanges();
		});

		await fixture.whenStable();

		component.userForm.patchValue({ fullName: "Jane Doe" });
		await component.onSubmit();

		expect(component.updateMutation.mutate).toHaveBeenCalledWith(
			{
				id: "1",
				user: jasmine.objectContaining({ fullName: "Jane Doe" })
			},
			jasmine.any(Object)
		);
		expect(mockLogger.info).toHaveBeenCalled();
	});

	it("should not submit invalid form", async () =>
	{
		await fixture.whenStable();

		component.userForm.patchValue({ username: "" });
		await component.onSubmit();

		expect(component.updateMutation.mutate).not.toHaveBeenCalled();
	});

	it("should handle save error", async () =>
	{
		const error: Error = new Error("Save failed");
		const errorMutation = createMockMutationResult<
			User,
			Error,
			{ id: string | number; user: Partial<User> },
			unknown
		>({ isError: true, error });

		// Setup mutate to call onError callback
		errorMutation.mutate = jasmine
			.createSpy("mutate")
			.and.callFake((variables, options) =>
			{
				if (options?.onError)
				{
					options.onError(error, variables, undefined);
				}
			});

		mockUserService.updateUser.and.returnValue(errorMutation);

		// Recreate component to get new mutation
		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() =>
		{
			fixture.detectChanges();
		});

		await fixture.whenStable();

		await component.onSubmit();

		expect(component.saveError()).toBe(
			"Failed to save user. Please try again."
		);
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it("should navigate back to users list on cancel", () =>
	{
		component.onCancel();

		expect(mockRouter.navigate).toHaveBeenCalledWith(["/admin/users"]);
	});

	it("should compute page title with username", async () =>
	{
		await fixture.whenStable();

		expect(component.pageTitle()).toBe("Edit User: john_doe");
	});

	it("should mark form as pristine after successful save", async () =>
	{
		const updatedUser: User = { ...mockUser, fullName: "Updated Name" };
		const localMockMutationResult = createMockMutationResult<
			User,
			Error,
			{ id: string | number; user: Partial<User> },
			unknown
		>();
		localMockMutationResult.mutate = jasmine
			.createSpy("mutate")
			.and.callFake((variables, options) =>
			{
				if (options?.onSuccess)
				{
					options.onSuccess(updatedUser, variables, undefined);
				}
			});
		mockUserService.updateUser.and.returnValue(localMockMutationResult);

		// Recreate component to get new mutation instance
		fixture = TestBed.createComponent(UserPage);
		component = fixture.componentInstance;
		TestBed.runInInjectionContext(() =>
		{
			fixture.detectChanges();
		});

		await fixture.whenStable();

		component.userForm.patchValue({ fullName: "Updated Name" });
		component.userForm.markAsDirty();
		await component.onSubmit();

		expect(component.userForm.pristine).toBe(true);
	});
});
