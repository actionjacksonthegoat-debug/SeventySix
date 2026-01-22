import { UpdateUserRequest, UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services/user.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { LoggerService } from "@shared/services/logger.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockActivatedRoute,
	createMockLogger,
	createMockNotificationService,
	createMockRouter
} from "@shared/testing";
import {
	createMockMutationResult,
	createMockQueryResult
} from "@testing/tanstack-query-helpers";
import { vi } from "vitest";
import { UserDetailPage } from "./user-detail";

/** Type alias for mock mutation result - DRY */
type MockUserMutation = ReturnType<
	typeof createMockMutationResult<
		UserDto,
		Error,
		{ userId: string | number; user: UpdateUserRequest; },
		unknown>>;

/** Mock UserService interface for testing. */
interface MockUserService
{
	getUserById: ReturnType<typeof vi.fn>;
	updateUser: ReturnType<typeof vi.fn>;
	getUserRoles: ReturnType<typeof vi.fn>;
	addRole: ReturnType<typeof vi.fn>;
	removeRole: ReturnType<typeof vi.fn>;
	getAdminCount: ReturnType<typeof vi.fn>;
}

describe("UserDetailPage",
	() =>
	{
		let component: UserDetailPage;
		let fixture: ComponentFixture<UserDetailPage>;
		let mockUserService: MockUserService;
		let mockLogger: ReturnType<typeof createMockLogger>;
		let mockRouter: ReturnType<typeof createMockRouter>;
		let mockActivatedRoute: ReturnType<typeof createMockActivatedRoute>;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;

		const mockUser: UserDto =
			{
				id: 1,
				username: "john_doe",
				email: "john@example.com",
				fullName: "John Doe",
				createDate: "2024-01-01T00:00:00Z",
				isActive: true,
				createdBy: "admin",
				modifyDate: "2024-01-02T00:00:00Z",
				modifiedBy: "admin",
				lastLoginAt: "2024-01-03T00:00:00Z",
				isDeleted: false,
				deletedAt: null,
				deletedBy: null
			};

		/**
		 * Creates a fresh component instance with optional mock overrides.
		 * Use this instead of calling TestBed.createComponent directly.
		 * @param {Partial<MockUserService>} [mockOverrides]
		 * Optional overrides for mock service methods.
		 * @returns {{ fixture: ComponentFixture<UserDetailPage>; component: UserDetailPage; }}
		 * The fixture and component instance.
		 */
		function createComponent(
			mockOverrides?: Partial<MockUserService>): { fixture: ComponentFixture<UserDetailPage>; component: UserDetailPage; }
		{
			if (mockOverrides)
			{
				Object.assign(mockUserService, mockOverrides);
			}

			const newFixture: ComponentFixture<UserDetailPage> =
				TestBed.createComponent(UserDetailPage);
			const newComponent: UserDetailPage =
				newFixture.componentInstance;

			TestBed.runInInjectionContext(
				() =>
				{
					newFixture.detectChanges();
				});

			return { fixture: newFixture, component: newComponent };
		}

		beforeEach(
			async () =>
			{
				mockUserService =
					{
						getUserById: vi.fn(),
						updateUser: vi.fn(),
						getUserRoles: vi.fn(),
						addRole: vi.fn(),
						removeRole: vi.fn(),
						getAdminCount: vi.fn()
					};
				mockLogger =
					createMockLogger();
				mockRouter =
					createMockRouter();
				mockActivatedRoute =
					createMockActivatedRoute(
						{ id: "1" });
				mockNotificationService =
					createMockNotificationService();

				mockUserService.getUserById.mockReturnValue(
					createMockQueryResult(mockUser));
				mockUserService.updateUser.mockReturnValue(createMockMutationResult());
				mockUserService.getUserRoles.mockReturnValue(
					createMockQueryResult(
						["Developer"]));
				mockUserService.addRole.mockReturnValue(createMockMutationResult());
				mockUserService.removeRole.mockReturnValue(createMockMutationResult());
				mockUserService.getAdminCount.mockReturnValue(
					createMockQueryResult(2));

				await TestBed
					.configureTestingModule(
						{
							imports: [UserDetailPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								{ provide: UserService, useValue: mockUserService },
								{ provide: LoggerService, useValue: mockLogger },
								{ provide: Router, useValue: mockRouter },
								{ provide: ActivatedRoute, useValue: mockActivatedRoute },
								{ provide: NotificationService, useValue: mockNotificationService }
							]
						})
					.compileComponents();

				// Create default component for most tests
				const created: { fixture: ComponentFixture<UserDetailPage>; component: UserDetailPage; } =
					createComponent();
				fixture =
					created.fixture;
				component =
					created.component;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should load user on initialization",
			async () =>
			{
				await fixture.whenStable();

				expect(mockUserService.getUserById)
					.toHaveBeenCalledWith("1");
				expect(component.user())
					.toEqual(mockUser);
				expect(component.isLoading())
					.toBe(false);
			});

		it("should initialize form with user data",
			async () =>
			{
				await fixture.whenStable();

				expect(component.userForm.value)
					.toEqual(
						{
							username: "john_doe",
							email: "john@example.com",
							fullName: "John Doe",
							isActive: true
						});
			});

		it("should handle error when loading user fails",
			async () =>
			{
				const error: Error =
					new Error("Not found");
				mockUserService.getUserById.mockReturnValue(
					createMockQueryResult<UserDto, Error>(undefined,
						{
							isError: true,
							error
						}));

				// Use factory to create component with error mock
				const { fixture: errorFixture, component: errorComponent } =
					createComponent();
				await errorFixture.whenStable();

				expect(errorComponent.error())
					.toBe(
						"Failed to load user. Please try again.");
				expect(errorComponent.isLoading())
					.toBe(false);
				expect(mockLogger.error)
					.toHaveBeenCalled();
			});

		it("should validate required fields",
			async () =>
			{
				await fixture.whenStable();

				component.userForm.patchValue(
					{
						username: "",
						email: "",
						fullName: "",
						isActive: true
					});

				expect(component.userForm.valid)
					.toBe(false);
				expect(component.userForm.get("username")?.errors?.["required"])
					.toBe(
						true);
				expect(component.userForm.get("email")?.errors?.["required"])
					.toBe(
						true);
			});

		it("should validate email format",
			async () =>
			{
				await fixture.whenStable();

				component.userForm.patchValue(
					{
						email: "invalid-email"
					});

				expect(component.userForm.get("email")?.errors?.["email"])
					.toBe(true);
			});

		it("should update user on valid form submission",
			async () =>
			{
				const updatedUser: UserDto =
					{ ...mockUser, fullName: "Jane Doe" };
				const localMockMutationResult: MockUserMutation =
					createMockMutationResult<
						UserDto,
						Error,
						{ userId: string | number; user: UpdateUserRequest; },
						unknown>();
				localMockMutationResult.mutate =
					vi
						.fn()
						.mockImplementation(
							(variables, options) =>
							{
								if (options?.onSuccess)
								{
									options.onSuccess(updatedUser, variables, undefined);
								}
							});
				mockUserService.updateUser.mockReturnValue(localMockMutationResult);

				// Use factory to create component with new mutation
				const { fixture: submitFixture, component: submitComponent } =
					createComponent();
				await submitFixture.whenStable();

				submitComponent.userForm.patchValue(
					{ fullName: "Jane Doe" });
				await submitComponent.onSubmit();

				expect(submitComponent.updateMutation.mutate)
					.toHaveBeenCalledWith(
						{
							userId: "1",
							user: expect.objectContaining(
								{ fullName: "Jane Doe" })
						},
						expect.any(Object));
			});

		it("should not submit invalid form",
			async () =>
			{
				await fixture.whenStable();

				component.userForm.patchValue(
					{ username: "" });
				await component.onSubmit();

				expect(component.updateMutation.mutate).not.toHaveBeenCalled();
			});

		it("should handle save error",
			async () =>
			{
				const error: Error =
					new Error("Save failed");
				const errorMutation: MockUserMutation =
					createMockMutationResult<
						UserDto,
						Error,
						{ userId: string | number; user: UpdateUserRequest; },
						unknown>(
						{ isError: true, error });

				// Setup mutate to call onError callback
				errorMutation.mutate =
					vi
						.fn()
						.mockImplementation(
							(variables, options) =>
							{
								if (options?.onError)
								{
									options.onError(error, variables, undefined);
								}
							});

				mockUserService.updateUser.mockReturnValue(errorMutation);

				// Use factory to create component with error mutation
				const { fixture: errorFixture, component: errorComponent } =
					createComponent();
				await errorFixture.whenStable();

				await errorComponent.onSubmit();

				expect(errorComponent.saveError())
					.toBe(
						"Failed to save user. Please try again.");
				expect(mockLogger.error)
					.toHaveBeenCalled();
			});

		it("should navigate back to users list on cancel",
			() =>
			{
				component.onCancel();

				expect(mockRouter.navigate)
					.toHaveBeenCalledWith(
						["/admin/users"]);
			});

		it("should compute page title with username",
			async () =>
			{
				await fixture.whenStable();

				expect(component.pageTitle())
					.toBe("Edit User: john_doe");
			});

		it("should center save icon inside page-actions",
			async () =>
			{
				await fixture.whenStable();
				fixture.detectChanges();

				const icon: HTMLElement | null =
					fixture.nativeElement.querySelector(
						".page-actions button mat-icon");

				expect(icon)
					.toBeTruthy();
				if (!icon) return;

				const style: CSSStyleDeclaration =
					window.getComputedStyle(icon);

				expect(style.display === "inline-flex" || style.display === "inline-block")
					.toBe(true);
				expect(style.alignItems === "center" || style.verticalAlign === "middle" || style.display === "inline-block")
					.toBe(true);
			});

		it("should mark form as pristine after successful save",
			async () =>
			{
				const updatedUser: UserDto =
					{ ...mockUser, fullName: "Updated Name" };
				const localMockMutationResult: MockUserMutation =
					createMockMutationResult<
						UserDto,
						Error,
						{ userId: string | number; user: UpdateUserRequest; },
						unknown>();
				localMockMutationResult.mutate =
					vi
						.fn()
						.mockImplementation(
							(variables, options) =>
							{
								if (options?.onSuccess)
								{
									options.onSuccess(updatedUser, variables, undefined);
								}
							});
				mockUserService.updateUser.mockReturnValue(localMockMutationResult);

				// Use factory to create component with new mutation
				const { fixture: pristineFixture, component: pristineComponent } =
					createComponent();
				await pristineFixture.whenStable();

				pristineComponent.userForm.patchValue(
					{ fullName: "Updated Name" });
				pristineComponent.userForm.markAsDirty();
				await pristineComponent.onSubmit();

				expect(pristineComponent.userForm.pristine)
					.toBe(true);
			});

		describe("UpdateUserRequest",
			() =>
			{
				it("should include all required fields in update request",
					async () =>
					{
						const updatedUser: UserDto =
							{ ...mockUser, fullName: "New Name" };
						const localMockMutationResult: MockUserMutation =
							createMockMutationResult<
								UserDto,
								Error,
								{ userId: string | number; user: UpdateUserRequest; },
								unknown>();
						localMockMutationResult.mutate =
							vi
								.fn()
								.mockImplementation(
									(variables, options) =>
									{
										if (options?.onSuccess)
										{
											options.onSuccess(updatedUser, variables, undefined);
										}
									});
						mockUserService.updateUser.mockReturnValue(localMockMutationResult);

						// Use factory to create component with new mutation
						const { fixture: fieldsFixture, component: fieldsComponent } =
							createComponent();
						await fieldsFixture.whenStable();

						fieldsComponent.userForm.patchValue(
							{ fullName: "New Name" });
						await fieldsComponent.onSubmit();

						expect(fieldsComponent.updateMutation.mutate)
							.toHaveBeenCalledWith(
								{
									userId: "1",
									user: expect.objectContaining(
										{
											id: 1,
											username: "john_doe"
										})
								},
								expect.any(Object));
					});
				it("should handle 409 conflict error with refresh action",
					async () =>
					{
						const conflictError: Error & { status: number; } =
							Object.assign(new Error("Concurrency conflict"),
								{
									status: 409
								});
						const errorMutation: MockUserMutation =
							createMockMutationResult<
								UserDto,
								Error,
								{ userId: string | number; user: UpdateUserRequest; },
								unknown>(
								{ isError: true, error: conflictError });

						errorMutation.mutate =
							vi
								.fn()
								.mockImplementation(
									(variables, options) =>
									{
										if (options?.onError)
										{
											options.onError(conflictError, variables, undefined);
										}
									});

						mockUserService.updateUser.mockReturnValue(errorMutation);

						// Use factory to create component with conflict error mutation
						const { fixture: conflictFixture, component: conflictComponent } =
							createComponent();
						await conflictFixture.whenStable();

						conflictComponent.userForm.patchValue(
							{ fullName: "Modified" });
						await conflictComponent.onSubmit();

						expect(mockNotificationService.warningWithAction)
							.toHaveBeenCalledWith(
								expect.stringContaining("User was modified by another user"),
								"REFRESH",
								expect.any(Function));
					});

				it("should not submit if user data not loaded",
					async () =>
					{
						mockUserService.getUserById.mockReturnValue(
							createMockQueryResult<UserDto, Error>(undefined,
								{
									isLoading: true
								}));

						// Use factory to create component with loading state
						const { fixture: loadingFixture, component: loadingComponent } =
							createComponent();
						await loadingFixture.whenStable();

						loadingComponent.userForm.patchValue(
							{ fullName: "New Name" });
						await loadingComponent.onSubmit();

						expect(
							loadingComponent.updateMutation.mutate)
							.not
							.toHaveBeenCalled();
					});

				it("should include all required fields in UpdateUserRequest",
					async () =>
					{
						const updatedUser: UserDto =
							{
								...mockUser,
								username: "new_username",
								email: "new@example.com",
								fullName: "New Full Name",
								isActive: false
							};
						const localMockMutationResult: MockUserMutation =
							createMockMutationResult<
								UserDto,
								Error,
								{ userId: string | number; user: UpdateUserRequest; },
								unknown>();
						localMockMutationResult.mutate =
							vi
								.fn()
								.mockImplementation(
									(variables, options) =>
									{
										if (options?.onSuccess)
										{
											options.onSuccess(updatedUser, variables, undefined);
										}
									});
						mockUserService.updateUser.mockReturnValue(localMockMutationResult);

						// Use factory to create component with new mutation
						const { fixture: allFieldsFixture, component: allFieldsComponent } =
							createComponent();
						await allFieldsFixture.whenStable();

						allFieldsComponent.userForm.patchValue(
							{
								username: "new_username",
								email: "new@example.com",
								fullName: "New Full Name",
								isActive: false
							});
						await allFieldsComponent.onSubmit();

						expect(allFieldsComponent.updateMutation.mutate)
							.toHaveBeenCalledWith(
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
								expect.any(Object));
					});
			});
	});
