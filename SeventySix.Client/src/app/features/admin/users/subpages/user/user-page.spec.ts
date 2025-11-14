import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { of, throwError } from "rxjs";
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

		mockUserService.getUserById.and.returnValue(of(mockUser));

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
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should load user on initialization", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		expect(mockUserService.getUserById).toHaveBeenCalledWith("1");
		expect(component.user()).toEqual(mockUser);
		expect(component.isLoading()).toBe(false);
	});

	it("should initialize form with user data", async () =>
	{
		fixture.detectChanges();
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
		const error = new Error("Not found");
		mockUserService.getUserById.and.returnValue(throwError(() => error));

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.error()).toBe(
			"Failed to load user. Please try again."
		);
		expect(component.isLoading()).toBe(false);
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it("should validate required fields", async () =>
	{
		fixture.detectChanges();
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
		fixture.detectChanges();
		await fixture.whenStable();

		component.userForm.patchValue({
			email: "invalid-email"
		});

		expect(component.userForm.get("email")?.errors?.["email"]).toBe(true);
	});

	it("should update user on valid form submission", async () =>
	{
		const updatedUser = { ...mockUser, fullName: "Jane Doe" };
		mockUserService.updateUser.and.returnValue(of(updatedUser));

		fixture.detectChanges();
		await fixture.whenStable();

		component.userForm.patchValue({ fullName: "Jane Doe" });
		await component.onSubmit();

		expect(mockUserService.updateUser).toHaveBeenCalledWith("1", {
			username: "john_doe",
			email: "john@example.com",
			fullName: "Jane Doe",
			isActive: true
		});
		expect(component.isSaving()).toBe(false);
		expect(mockLogger.info).toHaveBeenCalled();
	});

	it("should not submit invalid form", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		component.userForm.patchValue({ username: "" });
		await component.onSubmit();

		expect(mockUserService.updateUser).not.toHaveBeenCalled();
	});

	it("should handle save error", async () =>
	{
		const error = new Error("Save failed");
		mockUserService.updateUser.and.returnValue(throwError(() => error));

		fixture.detectChanges();
		await fixture.whenStable();

		await component.onSubmit();

		expect(component.saveError()).toBe(
			"Failed to save user. Please try again."
		);
		expect(component.isSaving()).toBe(false);
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it("should navigate back to users list on cancel", () =>
	{
		component.onCancel();

		expect(mockRouter.navigate).toHaveBeenCalledWith(["/users"]);
	});

	it("should compute page title with username", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.pageTitle()).toBe("Edit User: john_doe");
	});

	it("should mark form as pristine after successful save", async () =>
	{
		const updatedUser = { ...mockUser };
		mockUserService.updateUser.and.returnValue(of(updatedUser));

		fixture.detectChanges();
		await fixture.whenStable();

		component.userForm.markAsDirty();
		await component.onSubmit();

		expect(component.userForm.pristine).toBe(true);
	});
});
