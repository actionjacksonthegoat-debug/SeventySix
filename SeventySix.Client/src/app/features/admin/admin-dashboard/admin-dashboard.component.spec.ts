import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { GrafanaDashboardEmbedComponent } from "./components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { ApiStatisticsTableComponent } from "./components/api-statistics-table/api-statistics-table.component";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import { ThirdPartyApiService } from "./services";
import { NotificationService } from "@infrastructure/services/notification.service";
import { LoggerService } from "@infrastructure/services/logger.service";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";
import { createMockNotificationService, createMockLogger } from "@testing";

describe("AdminDashboardComponent", () =>
{
	let component: AdminDashboardComponent;
	let fixture: ComponentFixture<AdminDashboardComponent>;
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
				AdminDashboardComponent,
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
		fixture = TestBed.createComponent(AdminDashboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it("should create", () =>
	{
		createComponent();

		expect(component).toBeTruthy();
	});

	it("should render dashboard title", () =>
	{
		createComponent();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector("h1")?.textContent).toContain(
			"Admin Dashboard"
		);
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

		const compiled = fixture.nativeElement as HTMLElement;

		// Dashboard title should always be present
		expect(compiled.querySelector("h1")?.textContent).toContain(
			"Admin Dashboard"
		);

		// In test environment, observability is disabled
		// Verify the component correctly reads the environment configuration
		expect(component.isObservabilityEnabled).toBe(false);

		// When disabled, fallback message should be shown instead of tabs
		const fallbackMessage = compiled.textContent;
		expect(fallbackMessage).toContain("Observability stack is not enabled");
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

		expect(() => component.sendErrorLog()).toThrowError(
			/Division by zero test error/
		);
		expect(mockNotificationService.error).toHaveBeenCalledWith(
			"Sending Error Log"
		);
	});
});
