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
import { UserCreatePage } from "./user-create";

describe("UserCreatePage",
	() =>
	{
		let component: UserCreatePage;
		let fixture: ComponentFixture<UserCreatePage>;
		let mockUserService: jasmine.SpyObj<UserService>;
		let mockRouter: jasmine.SpyObj<Router>;
		let mockNotification: jasmine.SpyObj<NotificationService>;
		let mockLogger: jasmine.SpyObj<LoggerService>;

		beforeEach(
			async () =>
			{
				mockUserService =
					jasmine.createSpyObj("UserService",
						[
							"createUser",
							"checkUsernameAvailability"
						]);
				mockRouter =
					createMockRouter();
				mockNotification =
					createMockNotificationService();
				mockLogger =
					createMockLogger();

				const mockUser: UserDto =
					{
						id: 1,
						username: "test",
						email: "test@test.com",
						fullName: "Test User",
						createDate: "2024-01-01T00:00:00Z",
						isActive: true,
						createdBy: "system",
						modifiedBy: "system",
						needsPendingEmail: false,
						modifyDate: null,
						lastLoginAt: null,
						isDeleted: false,
						deletedAt: null,
						deletedBy: null
					};
				mockUserService.createUser.and.returnValue(
					createMockMutationResult<UserDto, Error, Partial<UserDto>, unknown>(
						{
							data: mockUser,
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
						mockUserService.checkUsernameAvailability.and.returnValue(
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
						mockUserService.checkUsernameAvailability.and.returnValue(
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
						mockUserService.checkUsernameAvailability.and.returnValue(
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

		describe("saveDraft",
			() =>
			{
				it("should log draft save and show snackbar notification",
					() =>
					{
						const snackBarSpy: jasmine.Spy<jasmine.Func> =
							spyOn(component["snackBar"], "open");

						component.saveDraft();

						// Check that logger was called with draft save message
						expect(mockLogger.info)
						.toHaveBeenCalledWith(
							"Draft save requested",
							jasmine.any(Object));

						expect(snackBarSpy)
						.toHaveBeenCalledWith(
							"Draft saved locally",
							"Close",
							jasmine.objectContaining(
								{ duration: 2000 }));
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

						const snackBarSpy: jasmine.Spy<jasmine.Func> =
							spyOn(component["snackBar"], "open");

						await component.onSubmit();

						expect(snackBarSpy)
						.toHaveBeenCalledWith(
							"Please complete all required fields",
							"Close",
							jasmine.objectContaining(
								{ duration: 3000 }));
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

						const snackBarSpy: jasmine.Spy<jasmine.Func> =
							spyOn(component["snackBar"], "open");

						await component.onSubmit();

						expect(snackBarSpy)
						.toHaveBeenCalledWith(
							"Please complete all required fields",
							"Close",
							jasmine.objectContaining(
								{ duration: 3000 }));
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
								needsPendingEmail: false,
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

						const snackBarSpy: jasmine.Spy =
							spyOn(component["snackBar"], "open");

						// Mock mutate to call onSuccess
						(component.createMutation.mutate as jasmine.Spy<jasmine.Func>).and.callFake(
							(data, options: { onSuccess: (user: UserDto) => void; }) =>
							{
								options.onSuccess(createdUser);
							});

						await component.onSubmit();

						expect(mockLogger.info)
						.toHaveBeenCalledWith(
							"User created successfully",
							{ id: 1 });
						expect(snackBarSpy)
						.toHaveBeenCalledWith(
							`User "testuser" created. Welcome email sent to test@example.com.`,
							"Close",
							jasmine.objectContaining(
								{ duration: 5000 }));
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
						(component.createMutation.mutate as jasmine.Spy<jasmine.Func>).and.callFake(
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
						.toEqual(jasmine.any(Object));
					});
			});
	});
