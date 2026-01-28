import { UserFixtures } from "@admin/testing";
import { UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services/user.service";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbstractControl } from "@angular/forms";
import { provideRouter } from "@angular/router";
import { Router } from "@angular/router";
import { LoggerService } from "@shared/services/logger.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockLogger,
	createMockNotificationService,
	createMockRouter
} from "@shared/testing";
import { createMockMutationResult } from "@testing/tanstack-query-helpers";
import { vi } from "vitest";
import { UserCreatePage } from "./user-create";

describe("UserCreatePage",
	() =>
	{
		let component: UserCreatePage;
		let fixture: ComponentFixture<UserCreatePage>;

		interface MockUserService
		{
			createUser: ReturnType<typeof vi.fn>;
			checkUsernameAvailability: ReturnType<typeof vi.fn>;
			addRole: ReturnType<typeof vi.fn>;
		}

		let mockUserService: MockUserService;
		let mockRouter: ReturnType<typeof createMockRouter>;
		let mockNotification: ReturnType<typeof createMockNotificationService>;
		let mockLogger: ReturnType<typeof createMockLogger>;

		beforeEach(
			async () =>
			{
				mockUserService =
					{
						createUser: vi.fn(),
						checkUsernameAvailability: vi.fn(),
						addRole: vi.fn()
					};
				mockRouter =
					createMockRouter();
				mockNotification =
					createMockNotificationService();
				mockLogger =
					createMockLogger();

				const mockUser: UserDto =
					UserFixtures.createUser(
						{
							username: "test",
							email: "test@test.com"
						});

				mockUserService.createUser.mockReturnValue(
					createMockMutationResult<UserDto, Error, Partial<UserDto>, unknown>(
						{
							data: mockUser,
							isSuccess: true
						}));

				mockUserService.addRole.mockReturnValue(
					createMockMutationResult<void, Error, { userId: number; roleName: string; }, unknown>(
						{
							isSuccess: true
						}));

				await TestBed
					.configureTestingModule(
						{
							imports: [UserCreatePage],
							providers: [
								provideHttpClient(withFetch()),
								provideHttpClientTesting(),
								provideZonelessChangeDetection(),
								provideRouter([]),
								{ provide: UserService, useValue: mockUserService },
								{ provide: Router, useValue: mockRouter },
								{ provide: NotificationService, useValue: mockNotification },
								{ provide: LoggerService, useValue: mockLogger }
							]
						})
					.compileComponents();
				fixture =
					TestBed.createComponent(UserCreatePage);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		describe("Form Validation",
			() =>
			{
				it("should initialize forms with correct validators",
					() =>
					{
						expect(component.basicInfoForm)
							.toBeDefined();
						expect(component.accountDetailsForm)
							.toBeDefined();

						// Basic info form validators
						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						const emailControl: AbstractControl | null =
							component.basicInfoForm.get("email");

						expect(usernameControl?.hasError("required"))
							.toBe(true);
						expect(emailControl?.hasError("required"))
							.toBe(true);
					});

				it("should validate username min length",
					() =>
					{
						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						usernameControl?.setValue("ab"); // Less than 3 chars
						expect(usernameControl?.hasError("minlength"))
							.toBe(true);
					});

				it("should validate username max length",
					() =>
					{
						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						const longUsername: string =
							"a".repeat(51); // More than 50 chars
						usernameControl?.setValue(longUsername);
						expect(usernameControl?.hasError("maxlength"))
							.toBe(true);
					});

				it("should validate email format",
					() =>
					{
						const emailControl: AbstractControl | null =
							component.basicInfoForm.get("email");
						emailControl?.setValue("invalid-email");
						expect(emailControl?.hasError("email"))
							.toBe(true);

						emailControl?.setValue("valid@example.com");
						expect(emailControl?.hasError("email"))
							.toBe(false);
					});

				it("should validate email max length",
					() =>
					{
						const emailControl: AbstractControl | null =
							component.basicInfoForm.get("email");
						const longEmail: string =
							"a".repeat(250) + "@test.com"; // More than 255 chars
						emailControl?.setValue(longEmail);
						expect(emailControl?.hasError("maxlength"))
							.toBe(true);
					});

				it("should validate fullName max length",
					() =>
					{
						const fullNameControl: AbstractControl | null =
							component.accountDetailsForm.get("fullName");
						const longName: string =
							"a".repeat(101); // More than 100 chars
						fullNameControl?.setValue(longName);
						expect(fullNameControl?.hasError("maxlength"))
							.toBe(true);
					});

				it("should accept valid form data",
					() =>
					{
						component.basicInfoForm.patchValue(
							{
								username: "testuser",
								email: "test@example.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "Test User",
								isActive: true
							});

						expect(component.basicInfoForm.valid)
							.toBe(true);
						expect(component.accountDetailsForm.valid)
							.toBe(true);
					});
			});

		describe("Async Username Validation",
			() =>
			{
				it("should validate username availability asynchronously",
					async () =>
					{
						// Mock username check to return false (username available)
						mockUserService.checkUsernameAvailability.mockReturnValue(
							Promise.resolve(false));

						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						usernameControl?.setValue("newuser");

						// Wait for async validation
						await fixture.whenStable();

						expect(
							mockUserService.checkUsernameAvailability)
							.toHaveBeenCalledWith("newuser");
						expect(usernameControl?.hasError("usernameTaken"))
							.toBe(false);
						expect(usernameControl?.valid)
							.toBe(true);
					});

				it("should fail validation if username is taken",
					async () =>
					{
						// Mock username check to return true (username exists)
						mockUserService.checkUsernameAvailability.mockReturnValue(
							Promise.resolve(true));

						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						usernameControl?.setValue("existinguser");

						// Wait for async validation
						await fixture.whenStable();

						expect(
							mockUserService.checkUsernameAvailability)
							.toHaveBeenCalledWith("existinguser");
						expect(usernameControl?.hasError("usernameTaken"))
							.toBe(true);
						expect(usernameControl?.valid)
							.toBe(false);
					});

				it("should not validate empty username",
					async () =>
					{
						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						usernameControl?.setValue("");

						// Wait for async validation
						await fixture.whenStable();

						expect(
							mockUserService.checkUsernameAvailability)
							.not
							.toHaveBeenCalled();
					});

				it("should handle validation errors gracefully",
					async () =>
					{
						// Mock username check to reject
						mockUserService.checkUsernameAvailability.mockReturnValue(
							Promise.reject(new Error("API Error")));

						const usernameControl: AbstractControl | null =
							component.basicInfoForm.get("username");
						usernameControl?.setValue("testuser");

						// Wait for async validation
						await fixture.whenStable();

						// Should not set usernameTaken error on API failure
						expect(usernameControl?.hasError("usernameTaken"))
							.toBe(false);
					});
			});

		describe("onSubmit",
			() =>
			{
				it("should show error when basic info form is invalid",
					async () =>
					{
						component.basicInfoForm.patchValue(
							{
								username: "", // Invalid: required
								email: "test@example.com"
							});

						await component.onSubmit();

						expect(mockNotification.error)
							.toHaveBeenCalledWith(
								"Please complete all required fields");
						expect(component.createMutation.mutate).not.toHaveBeenCalled();
					});

				it("should show error when account details form is invalid",
					async () =>
					{
						component.basicInfoForm.patchValue(
							{
								username: "testuser",
								email: "test@example.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "a".repeat(101) // Invalid: maxlength
							});

						await component.onSubmit();

						expect(mockNotification.error)
							.toHaveBeenCalledWith(
								"Please complete all required fields");
						expect(component.createMutation.mutate).not.toHaveBeenCalled();
					});

				it("should call mutation with form data when forms are valid",
					async () =>
					{
						component.basicInfoForm.patchValue(
							{
								username: "testuser",
								email: "test@example.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "Test User",
								isActive: true
							});

						await component.onSubmit();

						// Verify mutation was called
						expect(component.createMutation.mutate)
							.toHaveBeenCalled();
					});
				it("should handle successful user creation",
					async () =>
					{
						const createdUser: UserDto =
							{
								id: 1,
								username: "testuser",
								email: "test@example.com",
								fullName: "Test User",
								createDate: "2024-01-01T00:00:00Z",
								isActive: true,
								createdBy: "system",
								modifiedBy: "system",
								modifyDate: null,
								lastLoginAt: null,
								isDeleted: false,
								deletedAt: null,
								deletedBy: null
							};

						component.basicInfoForm.patchValue(
							{
								username: "testuser",
								email: "test@example.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "Test User"
							});
						fixture.detectChanges();

						// Mock mutate to call onSuccess
						(component.createMutation.mutate as ReturnType<typeof vi.fn>).mockImplementation(
							(data, options: { onSuccess: (user: UserDto) => void; }) =>
							{
								options.onSuccess(createdUser);
							});

						await component.onSubmit();

						expect(mockNotification.success)
							.toHaveBeenCalledWith(
								`User "testuser" created. Welcome email queued for test@example.com.`);
						expect(mockRouter.navigate)
							.toHaveBeenCalledWith(
								["/admin/users"]);
					});
				it("should handle failed user creation",
					async () =>
					{
						const error: Error =
							new Error("Network error");

						component.basicInfoForm.patchValue(
							{
								username: "testuser",
								email: "test@example.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "Test User"
							});
						fixture.detectChanges();

						// Mock mutate to call onError
						(component.createMutation.mutate as ReturnType<typeof vi.fn>).mockImplementation(
							(data, options: { onError: (error: Error) => void; }) =>
							{
								options.onError(error);
							});
						await component.onSubmit();

						expect(mockLogger.error)
							.toHaveBeenCalledWith(
								"Failed to create user",
								error);
					});
			});

		describe("onCancel",
			() =>
			{
				it("should navigate back to users list",
					() =>
					{
						component.onCancel();

						expect(mockRouter.navigate)
							.toHaveBeenCalledWith(
								["/admin/users"]);
					});
			});

		describe("Computed Signals",
			() =>
			{
				it("should compute isSaving state",
					() =>
					{
						// Initially not pending
						expect(component.isSaving())
							.toBe(false);

						// Mock pending state by modifying signal
						(component.createMutation.isPending as unknown as { set(value: boolean): void; }).set(true);

						expect(component.isSaving())
							.toBe(true);
					});
				it("should compute saveError when mutation fails",
					() =>
					{
						// Initially no error
						expect(component.saveError())
							.toBeNull();

						// Mock error state
						(component.createMutation.error as unknown as { set(value: Error | null): void; }).set(
							new Error("API Error"));

						expect(component.saveError())
							.toBe(
								"Failed to create user. Please try again.");
					});
				it("should have formData as a computed signal",
					() =>
					{
						// Verify formData is a function (computed signal)
						expect(typeof component.formData)
							.toBe("function");
						// Verify it returns an object
						expect(component.formData())
							.toEqual(expect.any(Object));
					});
			});

		describe("Role Selection",
			() =>
			{
				it("should initialize with empty selected roles",
					() =>
					{
						expect(component.selectedRoles())
							.toEqual([]);
					});

				it("should add role when toggled on",
					() =>
					{
						component.toggleRole("Developer");

						expect(component.selectedRoles())
							.toEqual(
								["Developer"]);
					});

				it("should remove role when toggled off",
					() =>
					{
						// Add role first
						component.toggleRole("Developer");
						expect(component.selectedRoles())
							.toEqual(
								["Developer"]);

						// Toggle again to remove
						component.toggleRole("Developer");
						expect(component.selectedRoles())
							.toEqual([]);
					});

				it("should allow multiple roles",
					() =>
					{
						component.toggleRole("Developer");
						component.toggleRole("Admin");

						expect(component.selectedRoles())
							.toContain("Developer");
						expect(component.selectedRoles())
							.toContain("Admin");
					});

				it("should have available roles defined",
					() =>
					{
						expect(component.availableRoles.length)
							.toBeGreaterThan(0);
						expect(component.availableRoles)
							.toContain("Developer");
						expect(component.availableRoles)
							.toContain("Admin");
					});

				it("should assign roles after user creation",
					async () =>
					{
						// Arrange - fill forms and select roles
						component.basicInfoForm.patchValue(
							{
								username: "newuser",
								email: "newuser@test.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "New User",
								isActive: true
							});
						component.toggleRole("Developer");
						component.toggleRole("Admin");

						// Mock createMutation to trigger onSuccess with created user
						const createdUser: UserDto =
							UserFixtures.createUser(
								{
									username: "newuser",
									email: "newuser@test.com",
									fullName: "New User"
								});
						(component.createMutation.mutate as ReturnType<typeof vi.fn>).mockImplementation(
							(
								data: Partial<UserDto>,
								options: { onSuccess: (user: UserDto) => void; }) =>
							{
								options.onSuccess(createdUser);
							});

						// Act
						await component.onSubmit();

						// Assert - addRole mutation should be called for each role
						expect(component.addRoleMutation.mutate)
							.toHaveBeenCalledTimes(2);
						expect(component.addRoleMutation.mutate)
							.toHaveBeenCalledWith(
								{ userId: 1, roleName: "Developer" },
								expect.objectContaining(
									{ onError: expect.any(Function) }));
						expect(component.addRoleMutation.mutate)
							.toHaveBeenCalledWith(
								{ userId: 1, roleName: "Admin" },
								expect.objectContaining(
									{ onError: expect.any(Function) }));
					});

				it("should show error snackbar when role assignment fails",
					async () =>
					{
						// Arrange - fill forms and select a role
						component.basicInfoForm.patchValue(
							{
								username: "newuser",
								email: "newuser@test.com"
							});
						component.accountDetailsForm.patchValue(
							{
								fullName: "New User",
								isActive: true
							});
						component.toggleRole("Developer");

						const createdUser: UserDto =
							UserFixtures.createUser(
								{
									username: "newuser",
									email: "newuser@test.com",
									fullName: "New User"
								});

						// Mock createMutation to trigger onSuccess
						(component.createMutation.mutate as ReturnType<typeof vi.fn>).mockImplementation(
							(
								data: Partial<UserDto>,
								options: { onSuccess: (user: UserDto) => void; }) =>
							{
								options.onSuccess(createdUser);
							});

						// Mock addRoleMutation to trigger onError
						(component.addRoleMutation.mutate as ReturnType<typeof vi.fn>).mockImplementation(
							(
								data: { userId: number; roleName: string; },
								options: { onError: (error: Error) => void; }) =>
							{
								options.onError(new Error("Role assignment failed"));
							});

						// Act
						await component.onSubmit();

						// Assert - error notification should be shown
						expect(mockNotification.error)
							.toHaveBeenCalledWith(
								"Failed to assign role \"Developer\"");
					});
			});
	});
