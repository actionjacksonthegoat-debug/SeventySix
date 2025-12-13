import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@infrastructure/services/logger.service";
import {
	createMockQueryResult,
	createMockMutationResult
} from "@testing/tanstack-query-helpers";
import {
	createMockLogger,
	createMockRouter,
	createMockActivatedRoute
} from "@testing";
import { UserDto, UpdateUserRequest } from "@admin/users/models";
import { UserDetailPage } from "./user-detail";

describe("UserDetailPage", () =>
{
	let component: UserDetailPage;
	let fixture: ComponentFixture<UserDetailPage>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockRouter: jasmine.SpyObj<Router>;
	let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

	const mockUser: UserDto = {
		id: 1,
		username: "john_doe",
		email: "john@example.com",
		fullName: "John Doe",
		createDate: "2024-01-01T00:00:00Z",
		isActive: true,
		needsPendingEmail: false,
		createdBy: "admin",
		modifyDate: "2024-01-02T00:00:00Z",
		modifiedBy: "admin",
		lastLoginAt: "2024-01-03T00:00:00Z",
		isDeleted: false,
		deletedAt: null,
		deletedBy: null
	};

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", [
			"getUserById",
			"updateUser",
			"getUserRoles",
			"addRole",
			"removeRole"
		]);
		mockLogger = createMockLogger();
		mockRouter = createMockRouter();
		mockActivatedRoute = createMockActivatedRoute({ id: "1" });

		mockUserService.getUserById.and.returnValue(
			createMockQueryResult(mockUser)
		);
		mockUserService.updateUser.and.returnValue(createMockMutationResult());
		mockUserService.getUserRoles.and.returnValue(
			createMockQueryResult(["Developer"])
		);
		mockUserService.addRole.and.returnValue(createMockMutationResult());
		mockUserService.removeRole.and.returnValue(createMockMutationResult());

		await TestBed.configureTestingModule({
			imports: [UserDetailPage],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: Router, useValue: mockRouter },
				{ provide: ActivatedRoute, useValue: mockActivatedRoute }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserDetailPage);
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
			createMockQueryResult<UserDto, Error>(undefined, {
				isError: true,
				error
			})
		);

		// Recreate component with error mock
		const errorFixture: ComponentFixture<UserDetailPage> =
			TestBed.createComponent(UserDetailPage);
		const errorComponent: UserDetailPage = errorFixture.componentInstance;
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
		const updatedUser: UserDto = { ...mockUser, fullName: "Jane Doe" };
		const localMockMutationResult = createMockMutationResult<
			UserDto,
			Error,
			{ userId: string | number; user: UpdateUserRequest },
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
		fixture = TestBed.createComponent(UserDetailPage);
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
				userId: "1",
				user: jasmine.objectContaining({ fullName: "Jane Doe" })
			},
			jasmine.any(Object)
		);
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
			UserDto,
			Error,
			{ userId: string | number; user: UpdateUserRequest },
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
		fixture = TestBed.createComponent(UserDetailPage);
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
		const updatedUser: UserDto = { ...mockUser, fullName: "Updated Name" };
		const localMockMutationResult = createMockMutationResult<
			UserDto,
			Error,
			{ userId: string | number; user: UpdateUserRequest },
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
		fixture = TestBed.createComponent(UserDetailPage);
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

	describe("UpdateUserRequest", () =>
	{
		it("should include all required fields in update request", async () =>
		{
			const updatedUser: UserDto = { ...mockUser, fullName: "New Name" };
			const localMockMutationResult = createMockMutationResult<
				UserDto,
				Error,
				{ userId: string | number; user: UpdateUserRequest },
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
			fixture = TestBed.createComponent(UserDetailPage);
			component = fixture.componentInstance;
			TestBed.runInInjectionContext(() =>
			{
				fixture.detectChanges();
			});

			await fixture.whenStable();

			component.userForm.patchValue({ fullName: "New Name" });
			await component.onSubmit();

			expect(component.updateMutation.mutate).toHaveBeenCalledWith(
				{
					userId: "1",
					user: jasmine.objectContaining({
						id: 1,
						username: "john_doe"
					})
				},
				jasmine.any(Object)
			);
		});
		it("should handle 409 conflict error with refresh option", async () =>
		{
			const conflictError: any = {
				status: 409,
				message: "Concurrency conflict"
			};
			const errorMutation = createMockMutationResult<
				UserDto,
				any,
				{ userId: string | number; user: UpdateUserRequest },
				unknown
			>({ isError: true, error: conflictError });

			errorMutation.mutate = jasmine
				.createSpy("mutate")
				.and.callFake((variables, options) =>
				{
					if (options?.onError)
					{
						options.onError(conflictError, variables, undefined);
					}
				});

			mockUserService.updateUser.and.returnValue(errorMutation);

			// Spy on snackBar to verify it was called
			const snackBarSpy = jasmine.createSpyObj("MatSnackBarRef", [
				"onAction"
			]);
			snackBarSpy.onAction.and.returnValue(new Subject());

			// Recreate component to get new mutation
			fixture = TestBed.createComponent(UserDetailPage);
			component = fixture.componentInstance;

			// Spy on the component's snackbar
			spyOn(
				component["snackBar" as keyof UserDetailPage] as any,
				"open"
			).and.returnValue(snackBarSpy);

			TestBed.runInInjectionContext(() =>
			{
				fixture.detectChanges();
			});

			await fixture.whenStable();

			component.userForm.patchValue({ fullName: "Modified" });
			await component.onSubmit();

			expect(
				(component["snackBar" as keyof UserDetailPage] as any).open
			).toHaveBeenCalledWith(
				jasmine.stringContaining("User was modified by another user"),
				"REFRESH",
				jasmine.any(Object)
			);
		});

		it("should not submit if user data not loaded", async () =>
		{
			mockUserService.getUserById.and.returnValue(
				createMockQueryResult<UserDto, Error>(undefined, {
					isLoading: true
				})
			);

			// Recreate component with loading state
			const loadingFixture: ComponentFixture<UserDetailPage> =
				TestBed.createComponent(UserDetailPage);
			const loadingComponent: UserDetailPage =
				loadingFixture.componentInstance;
			TestBed.runInInjectionContext(() =>
			{
				loadingFixture.detectChanges();
			});
			await loadingFixture.whenStable();

			loadingComponent.userForm.patchValue({ fullName: "New Name" });
			await loadingComponent.onSubmit();

			expect(
				loadingComponent.updateMutation.mutate
			).not.toHaveBeenCalled();
		});

		it("should include all required fields in UpdateUserRequest", async () =>
		{
			const updatedUser: UserDto = {
				...mockUser,
				username: "new_username",
				email: "new@example.com",
				fullName: "New Full Name",
				isActive: false
			};
			const localMockMutationResult = createMockMutationResult<
				UserDto,
				Error,
				{ userId: string | number; user: UpdateUserRequest },
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
			fixture = TestBed.createComponent(UserDetailPage);
			component = fixture.componentInstance;
			TestBed.runInInjectionContext(() =>
			{
				fixture.detectChanges();
			});

			await fixture.whenStable();

			component.userForm.patchValue({
				username: "new_username",
				email: "new@example.com",
				fullName: "New Full Name",
				isActive: false
			});
			await component.onSubmit();

			expect(component.updateMutation.mutate).toHaveBeenCalledWith(
				{
					userId: "1",
					user: {
						id: 1,
						username: "new_username",
						email: "new@example.com",
						fullName: "New Full Name",
						isActive: false
					}
				},
				jasmine.any(Object)
			);
		});
	});
});
