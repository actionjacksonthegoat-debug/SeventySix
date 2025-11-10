import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { UserList } from "@shared/components/user-list/user-list";
import { UserService } from "@core/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { of } from "rxjs";
import { UsersPage } from "./users-page";

describe("UsersPage", () =>
{
	let component: UsersPage;
	let fixture: ComponentFixture<UsersPage>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", ["getAllUsers"]);
		mockLogger = jasmine.createSpyObj("LoggerService", ["info", "error"]);

		// Set default mock return value
		mockUserService.getAllUsers.and.returnValue(of([]));

		await TestBed.configureTestingModule({
			imports: [UsersPage, UserList],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UsersPage);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display correct page title", () =>
	{
		expect(component.pageTitle()).toBe("User Management");
	});

	it("should show header actions by default", () =>
	{
		expect(component.showHeaderActions()).toBe(true);
	});

	it("should render page header with title", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		const compiled = fixture.nativeElement;
		const title = compiled.querySelector(".page-title");
		expect(title.textContent).toContain("User Management");
	});

	it("should embed UserList component", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		const compiled = fixture.nativeElement;
		const userList = compiled.querySelector("app-user-list");
		expect(userList).toBeTruthy();
	});

	it("should compute breadcrumbs correctly", () =>
	{
		const breadcrumbs = component.breadcrumbs();
		expect(breadcrumbs.length).toBe(2);
		expect(breadcrumbs[0]).toEqual({ label: "Home", route: "/" });
		expect(breadcrumbs[1]).toEqual({ label: "Users", route: "/users" });
	});
});
