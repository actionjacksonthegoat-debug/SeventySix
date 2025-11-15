import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { UserCreatePage } from "./user-create";
import { UserService } from "@features/admin/users/services/user.service";
import { Router } from "@angular/router";
import { NotificationService } from "@core/services/notification.service";
import { createMockMutationResult } from "@core/testing";
import { User } from "@admin/users/models";

describe("UserCreatePage", () =>
{
	let component: UserCreatePage;
	let fixture: ComponentFixture<UserCreatePage>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockRouter: jasmine.SpyObj<Router>;
	let mockNotification: jasmine.SpyObj<NotificationService>;

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", ["createUser"]);
		mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
		mockNotification = jasmine.createSpyObj("NotificationService", [
			"success",
			"error"
		]);

		const mockUser: User = {
			id: 1,
			username: "test",
			email: "test@test.com",
			fullName: "Test User",
			createdAt: "2024-01-01T00:00:00Z",
			isActive: true
		};
		mockUserService.createUser.and.returnValue(
			createMockMutationResult<User, Error, Partial<User>, unknown>({
				data: mockUser,
				isSuccess: true
			})
		);

		await TestBed.configureTestingModule({
			imports: [UserCreatePage],
			providers: [
				provideHttpClient(withFetch()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: UserService, useValue: mockUserService },
				{ provide: Router, useValue: mockRouter },
				{ provide: NotificationService, useValue: mockNotification }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserCreatePage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});
});
