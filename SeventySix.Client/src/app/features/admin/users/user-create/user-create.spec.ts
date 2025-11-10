import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { UserCreatePage } from "./user-create";
import { UserService } from "@core/services/user.service";
import { Router } from "@angular/router";
import { NotificationService } from "@core/services/notification.service";

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

		mockUserService.createUser.and.returnValue(
			of({
				id: 1,
				username: "test",
				email: "test@test.com",
				fullName: "Test User",
				createdAt: "",
				isActive: true
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
