import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { UserList } from "@features/admin/users/components/user-list/user-list";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { User } from "@admin/users/models";
import { of } from "rxjs";
import { UsersComponent } from "./users.component";
import { ActivatedRoute } from "@angular/router";
import {
	createMockQueryResult,
	createMockMutationResult
} from "@core/testing/tanstack-query-helpers";

describe("UsersComponent", () =>
{
	let component: UsersComponent;
	let fixture: ComponentFixture<UsersComponent>;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", ["getAllUsers"]);
		mockLogger = jasmine.createSpyObj("LoggerService", ["info", "error"]);
		mockActivatedRoute = jasmine.createSpyObj("ActivatedRoute", [], {
			params: of({})
		});

		// Set default mock return value
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>([])
		);

		await TestBed.configureTestingModule({
			imports: [UsersComponent, UserList],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: ActivatedRoute, useValue: mockActivatedRoute },
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UsersComponent);
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

	it("should render page header with title", async () =>
	{
		fixture.detectChanges();
		await fixture.whenStable();

		const compiled = fixture.nativeElement;
		const title = compiled.querySelector("h1");
		expect(title).toBeTruthy();
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

	it("should have a title", () =>
	{
		fixture.detectChanges();
		const compiled = fixture.nativeElement;
		const title = compiled.querySelector("h1");
		expect(title).toBeTruthy();
	});
});
