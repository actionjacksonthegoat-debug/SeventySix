import { RecurringJobStatusResponse } from "@admin/models";
import { HealthApiService } from "@admin/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { createMockQueryResult } from "@testing/tanstack-query-helpers";
import { vi } from "vitest";
import { ScheduledJobsTableComponent } from "./scheduled-jobs-table.component";

describe("ScheduledJobsTableComponent",
	() =>
	{
		let component: ScheduledJobsTableComponent;
		let fixture: ComponentFixture<ScheduledJobsTableComponent>;

		interface MockHealthApiService
		{
			getScheduledJobs: ReturnType<typeof vi.fn>;
		}

		let healthApiService: MockHealthApiService;

		const mockJobData: RecurringJobStatusResponse[] =
			[
				{
					jobName: "RefreshTokenCleanupJob",
					displayName: "Refresh Token Cleanup",
					lastExecutedAt: "2025-11-12T10:30:00Z",
					nextScheduledAt: "2025-11-13T10:30:00Z",
					lastExecutedBy: "System",
					status: "Healthy",
					interval: "Every 24 hours"
				},
				{
					jobName: "LogCleanupJob",
					displayName: "Log Cleanup",
					lastExecutedAt: null,
					nextScheduledAt: null,
					lastExecutedBy: null,
					status: "Unknown",
					interval: "Every 24 hours"
				}
			];

		beforeEach(
			async () =>
			{
				const healthApiServiceSpy: MockHealthApiService =
					{ getScheduledJobs: vi.fn() };

				await TestBed
					.configureTestingModule(
						{
							imports: [ScheduledJobsTableComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								{
									provide: HealthApiService,
									useValue: healthApiServiceSpy
								}
							]
						})
					.compileComponents();

				healthApiService =
					TestBed.inject(
						HealthApiService) as unknown as MockHealthApiService;
			});

		function createComponent(): void
		{
			fixture =
				TestBed.createComponent(ScheduledJobsTableComponent);
			component =
				fixture.componentInstance;
			fixture.detectChanges();
		}

		it("should create",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component)
					.toBeTruthy();
			});

		it("should load scheduled jobs on init",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(healthApiService.getScheduledJobs)
					.toHaveBeenCalled();
				expect(component.isLoading())
					.toBe(false);
				expect(component.dataSource().data.length)
					.toBe(2);
			});

		it("should display job names",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.dataSource().data[0].displayName)
					.toBe("Refresh Token Cleanup");
				expect(component.dataSource().data[1].displayName)
					.toBe("Log Cleanup");
			});

		it("should display status correctly",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.dataSource().data[0].status)
					.toBe("Healthy");
				expect(component.dataSource().data[1].status)
					.toBe("Unknown");
			});

		it("should handle loading state",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult<RecurringJobStatusResponse[]>(undefined,
						{
							isLoading: true
						}));

				createComponent();

				expect(component.isLoading())
					.toBe(true);
			});

		it("should display error message when query fails",
			() =>
			{
				const errorMessage: string = "Failed to load scheduled job data";
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult<RecurringJobStatusResponse[]>(undefined,
						{
							isError: true,
							error: new Error(errorMessage)
						}));

				createComponent();

				expect(component.isLoading())
					.toBe(false);
				expect(component.error())
					.toBeTruthy();
				expect(component.dataSource().data.length)
					.toBe(0);
			});

		it("should reload data when refresh is called",
			() =>
			{
				const mockQuery: ReturnType<typeof createMockQueryResult<RecurringJobStatusResponse[]>> =
					createMockQueryResult(
						mockJobData);
				healthApiService.getScheduledJobs.mockReturnValue(mockQuery);

				createComponent();
				expect(healthApiService.getScheduledJobs)
					.toHaveBeenCalledTimes(1);

				component.onRefresh();

				expect(mockQuery.refetch)
					.toHaveBeenCalled();
			});

		it("should display table with correct columns",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.displayedColumns())
					.toEqual(
						[
							"displayName",
							"status",
							"lastExecutedAt",
							"nextScheduledAt",
							"interval"
						]);
			});

		it("should return correct status icon for healthy status",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.getStatusIcon("Healthy"))
					.toBe("check_circle");
			});

		it("should return correct status icon for degraded status",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.getStatusIcon("Degraded"))
					.toBe("warning");
			});

		it("should return correct status icon for unknown status",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.getStatusIcon("Unknown"))
					.toBe("help_outline");
			});

		it("should return correct status class for healthy status",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.getStatusClass("Healthy"))
					.toBe("status-healthy");
			});

		it("should return correct status class for degraded status",
			() =>
			{
				healthApiService.getScheduledJobs.mockReturnValue(
					createMockQueryResult(mockJobData));

				createComponent();

				expect(component.getStatusClass("Degraded"))
					.toBe("status-degraded");
			});
	});