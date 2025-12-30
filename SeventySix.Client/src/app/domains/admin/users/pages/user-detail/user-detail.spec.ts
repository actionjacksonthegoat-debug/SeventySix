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

describe("UserDetailPage",
	() =>
	{
		let component: UserDetailPage;
		let fixture: ComponentFixture<UserDetailPage>;

		interface MockUserService
		{
			getUserById: ReturnType<typeof vi.fn>;
			updateUser: ReturnType<typeof vi.fn>;
			getUserRoles: ReturnType<typeof vi.fn>;
			addRole: ReturnType<typeof vi.fn>;
			removeRole: ReturnType<typeof vi.fn>;
		}

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
				needsPendingEmail: false,
				createdBy: "admin",
				modifyDate: "2024-01-02T00:00:00Z",
				modifiedBy: "admin",
				lastLoginAt: "2024-01-03T00:00:00Z",
				isDeleted: false,
				deletedAt: null,
				deletedBy: null
			};

		beforeEach(
			async () =>
			{
				mockUserService =
					{
						getUserById: vi.fn(),
						updateUser: vi.fn(),
						getUserRoles: vi.fn(),
						addRole: vi.fn(),
						removeRole: vi.fn()
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

				fixture =
					TestBed.createComponent(UserDetailPage);
				component =
					fixture.componentInstance;

				// Run initial detectChanges in injection context to handle effect()
				TestBed.runInInjectionContext(
					() =>
					{
						fixture.detectChanges();
					});
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

				// Recreate component with error mock
				const errorFixture: ComponentFixture<UserDetailPage> =
					TestBed.createComponent(UserDetailPage);
				const errorComponent: UserDetailPage =
					errorFixture.componentInstance;
				TestBed.runInInjectionContext(
					() =>
					{
						errorFixture.detectChanges();
					});
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

				// Recreate component to get new mutation instance
				fixture =
					TestBed.createComponent(UserDetailPage);
				component =
					fixture.componentInstance;
				TestBed.runInInjectionContext(
					() =>
					{
						fixture.detectChanges();
					});

				await fixture.whenStable();

				component.userForm.patchValue(
					{ fullName: "Jane Doe" });
				await component.onSubmit();

				expect(component.updateMutation.mutate)
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

				// Recreate component to get new mutation
				fixture =
					TestBed.createComponent(UserDetailPage);
				component =
					fixture.componentInstance;
				TestBed.runInInjectionContext(
					() =>
					{
						fixture.detectChanges();
					});

				await fixture.whenStable();

				await component.onSubmit();

				expect(component.saveError())
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
				expect(style.alignItems === "center" || style.verticalAlign === "middle")
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

				// Recreate component to get new mutation instance
				fixture =
					TestBed.createComponent(UserDetailPage);
				component =
					fixture.componentInstance;
				TestBed.runInInjectionContext(
					() =>
					{
						fixture.detectChanges();
					});

				await fixture.whenStable();

				component.userForm.patchValue(
					{ fullName: "Updated Name" });
				component.userForm.markAsDirty();
				await component.onSubmit();

				expect(component.userForm.pristine)
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

						// Recreate component to get new mutation instance
						fixture =
							TestBed.createComponent(UserDetailPage);
						component =
							fixture.componentInstance;
						TestBed.runInInjectionContext(
							() =>
							{
								fixture.detectChanges();
							});

						await fixture.whenStable();

						component.userForm.patchValue(
							{ fullName: "New Name" });
						await component.onSubmit();

						expect(component.updateMutation.mutate)
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

						// Recreate component to get new mutation
						fixture =
							TestBed.createComponent(UserDetailPage);
						component =
							fixture.componentInstance;

						TestBed.runInInjectionContext(
							() =>
							{
								fixture.detectChanges();
							});

						await fixture.whenStable();

						component.userForm.patchValue(
							{ fullName: "Modified" });
						await component.onSubmit();

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

						// Recreate component with loading state
						const loadingFixture: ComponentFixture<UserDetailPage> =
							TestBed.createComponent(UserDetailPage);
						const loadingComponent: UserDetailPage =
							loadingFixture.componentInstance;
						TestBed.runInInjectionContext(
							() =>
							{
								loadingFixture.detectChanges();
							});
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

						// Recreate component to get new mutation instance
						fixture =
							TestBed.createComponent(UserDetailPage);
						component =
							fixture.componentInstance;
						TestBed.runInInjectionContext(
							() =>
							{
								fixture.detectChanges();
							});

						await fixture.whenStable();

						component.userForm.patchValue(
							{
								username: "new_username",
								email: "new@example.com",
								fullName: "New Full Name",
								isActive: false
							});
						await component.onSubmit();

						expect(component.updateMutation.mutate)
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
