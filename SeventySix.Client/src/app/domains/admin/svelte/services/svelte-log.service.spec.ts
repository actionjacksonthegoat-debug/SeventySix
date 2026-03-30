import { SvelteLogService } from "@admin/svelte/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import { vi } from "vitest";

describe("SvelteLogService",
	() =>
	{
		let service: SvelteLogService;

		beforeEach(
			() =>
			{
				TestBed
					.configureTestingModule(
						{
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideTanStackQuery(createTestQueryClient()),
								SvelteLogService
							]
						});

				service =
					TestBed.inject(SvelteLogService);
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should have default page of 1",
			() =>
			{
				expect(service.currentPage())
					.toBe(1);
			});

		it("should have default page size of 25",
			() =>
			{
				expect(service.pageSize())
					.toBe(25);
			});

		it("should have empty default log level filter",
			() =>
			{
				expect(service.logLevelFilter())
					.toBe("");
			});

		it("should navigate to specified page",
			() =>
			{
				service.goToPage(3);

				expect(service.currentPage())
					.toBe(3);
			});

		it("should set log level filter",
			() =>
			{
				service.setLevelFilter("Error");

				expect(service.logLevelFilter())
					.toBe("Error");
			});

		it("should reset to page 1 when changing level filter",
			() =>
			{
				service.goToPage(5);
				service.setLevelFilter("Warning");

				expect(service.currentPage())
					.toBe(1);
			});

		it("should create paged logs query result",
			() =>
			{
				const pagedLogs: ReturnType<typeof service.getPagedLogs> =
					TestBed.runInInjectionContext(() =>
						service.getPagedLogs());

				expect(pagedLogs)
					.toBeTruthy();
				expect(pagedLogs.isLoading)
					.toBeDefined();
			});

		it("should create paged logs query with level filter applied",
			() =>
			{
				service.setLevelFilter("Error");

				const pagedLogs: ReturnType<typeof service.getPagedLogs> =
					TestBed.runInInjectionContext(() =>
						service.getPagedLogs());

				expect(pagedLogs)
					.toBeTruthy();
				expect(service.logLevelFilter())
					.toBe("Error");
				expect(service.currentPage())
					.toBe(1);
			});

		it("should create paged logs query at custom page",
			() =>
			{
				service.goToPage(3);

				const pagedLogs: ReturnType<typeof service.getPagedLogs> =
					TestBed.runInInjectionContext(() =>
						service.getPagedLogs());

				expect(pagedLogs)
					.toBeTruthy();
				expect(service.currentPage())
					.toBe(3);
			});
	});