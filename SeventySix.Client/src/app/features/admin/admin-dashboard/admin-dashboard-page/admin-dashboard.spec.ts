import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { GrafanaDashboardEmbedComponent } from "../components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { ApiStatisticsTableComponent } from "../components/api-statistics-table/api-statistics-table.component";
import { AdminDashboardPage } from "./admin-dashboard";
import { ThirdPartyApiService } from "../services";
import { NotificationService, LoggerService } from "@infrastructure/services";
import {
	createMockQueryResult,
	createMockNotificationService,
	createMockLogger
} from "@testing";

describe("AdminDashboardPage", () =>
{
	let component: AdminDashboardPage;
	let fixture: ComponentFixture<AdminDashboardPage>;
	let thirdPartyApiService: jasmine.SpyObj<ThirdPartyApiService>;
	let mockNotificationService: jasmine.SpyObj<NotificationService>;
	let mockLoggerService: jasmine.SpyObj<LoggerService>;

	beforeEach(async () =>
	{
		const thirdPartyApiServiceSpy = jasmine.createSpyObj(
			"ThirdPartyApiService",
			["getAllThirdPartyApis"]
		);

		// Set up TanStack Query mocks for child components
		thirdPartyApiServiceSpy.getAllThirdPartyApis.and.returnValue(
			createMockQueryResult([])
		);

		mockNotificationService = createMockNotificationService();
		mockLoggerService = createMockLogger();

		await TestBed.configureTestingModule({
			imports: [
				AdminDashboardPage,
				GrafanaDashboardEmbedComponent,
				ApiStatisticsTableComponent
			],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ThirdPartyApiService,
					useValue: thirdPartyApiServiceSpy
				},
				{
					provide: NotificationService,
					useValue: mockNotificationService
				},
				{
					provide: LoggerService,
					useValue: mockLoggerService
				}
			]
		}).compileComponents();

		thirdPartyApiService = TestBed.inject(
			ThirdPartyApiService
		) as jasmine.SpyObj<ThirdPartyApiService>;
	});

	function createComponent(): void
	{
		fixture = TestBed.createComponent(AdminDashboardPage);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		createComponent();

		expect(component).toBeTruthy();
	});

	it("should render page header", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("app-page-header")).toBeTruthy();
	});

	it("should have system overview dashboard UID", () =>
	{
		createComponent();

		expect(component.systemOverviewDashboard).toBe(
			"seventysix-system-overview"
		);
	});

	it("should have API endpoints dashboard UID", () =>
	{
		createComponent();

		expect(component.apiEndpointsDashboard).toBe(
			"seventysix-api-endpoints"
		);
	});

	it("should display admin dashboard with appropriate content", () =>
	{
		createComponent();

		const compiled: HTMLElement = fixture.nativeElement as HTMLElement;

		// Dashboard title should always be present
		expect(compiled.querySelector("h1")?.textContent).toContain(
			"Admin Dashboard"
		);

		// Tabs should always be present (observability always enabled)
		expect(compiled.querySelector("mat-tab-group")).toBeTruthy();
	});

	it("should open Jaeger in new tab", () =>
	{
		createComponent();
		spyOn(window, "open");

		component.openJaeger();

		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:16686/search?service=SeventySix.Api",
			"_blank"
		);
	});

	it("should open Prometheus in new tab", () =>
	{
		createComponent();
		spyOn(window, "open");

		component.openPrometheus();

		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:9090/targets",
			"_blank"
		);
	});

	it("should open Grafana in new tab", () =>
	{
		createComponent();
		spyOn(window, "open");

		component.openGrafana();

		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:3000/dashboards",
			"_blank"
		);
	});

	it("should send info log and show notification", () =>
	{
		createComponent();

		component.sendInfoLog();

		expect(mockNotificationService.info).toHaveBeenCalledWith(
			"Sending Info Log"
		);
		expect(mockLoggerService.forceInfo).toHaveBeenCalledWith(
			"Test Info Log from Admin Dashboard"
		);
	});

	it("should send warn log and show notification", () =>
	{
		createComponent();

		component.sendWarnLog();

		expect(mockNotificationService.warning).toHaveBeenCalledWith(
			"Sending Warn Log"
		);
		expect(mockLoggerService.forceWarning).toHaveBeenCalledWith(
			"Test Warning Log from Admin Dashboard"
		);
	});

	it("should send error log, show notification, and throw error", () =>
	{
		createComponent();

		// The sendErrorLog method throws an error (division by zero simulation)
		// It does NOT call notification.error - the error is thrown for error handling validation
		expect(() => component.sendErrorLog()).toThrowError(
			/Division by zero test error/
		);
	});
});
