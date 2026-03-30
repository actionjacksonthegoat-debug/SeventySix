import { TanStackDashboardService } from "@admin/tanstack/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import { vi } from "vitest";

describe("TanStackDashboardService",
	() =>
	{
		let service: TanStackDashboardService;

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
								TanStackDashboardService
							]
						});

				service =
					TestBed.inject(TanStackDashboardService);
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

		it("should return performance dashboard UID",
			() =>
			{
				const uid: string =
					service.getDashboardUid("performance");

				expect(uid)
					.toBeTruthy();
				expect(typeof uid)
					.toBe("string");
			});

		it("should return commerce dashboard UID",
			() =>
			{
				const uid: string =
					service.getDashboardUid("commerce");

				expect(uid)
					.toBeTruthy();
				expect(typeof uid)
					.toBe("string");
			});

		it("should return different UIDs for performance and commerce",
			() =>
			{
				const performanceUid: string =
					service.getDashboardUid("performance");
				const commerceUid: string =
					service.getDashboardUid("commerce");

				expect(performanceUid)
					.not
					.toBe(commerceUid);
			});

		it("should create warnings query result",
			() =>
			{
				const warnings: ReturnType<typeof service.getWarnings> =
					TestBed.runInInjectionContext(() =>
						service.getWarnings());

				expect(warnings)
					.toBeTruthy();
				expect(warnings.isLoading)
					.toBeDefined();
			});

		it("should create errors query result",
			() =>
			{
				const errors: ReturnType<typeof service.getErrors> =
					TestBed.runInInjectionContext(() => service.getErrors());

				expect(errors)
					.toBeTruthy();
				expect(errors.isLoading)
					.toBeDefined();
			});
	});