import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import { SandboxDashboardService } from "./sandbox-dashboard.service";

describe("SandboxDashboardService",
	() =>
	{
		let service: SandboxDashboardService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(),
							provideHttpClientTesting(),
							provideTanStackQuery(createTestQueryClient()),
							SandboxDashboardService
						]
					});

				service =
					TestBed.inject(SandboxDashboardService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should return SvelteKit warnings query result",
			() =>
			{
				const result: ReturnType<typeof service.getSvelteKitWarnings> =
					TestBed.runInInjectionContext(() =>
						service.getSvelteKitWarnings());

				expect(result)
					.toBeTruthy();
				expect(result.isLoading)
					.toBeDefined();
			});

		it("should return SvelteKit errors query result",
			() =>
			{
				const result: ReturnType<typeof service.getSvelteKitErrors> =
					TestBed.runInInjectionContext(() =>
						service.getSvelteKitErrors());

				expect(result)
					.toBeTruthy();
				expect(result.isLoading)
					.toBeDefined();
			});

		it("should return TanStack warnings query result",
			() =>
			{
				const result: ReturnType<typeof service.getTanStackWarnings> =
					TestBed.runInInjectionContext(() =>
						service.getTanStackWarnings());

				expect(result)
					.toBeTruthy();
				expect(result.isLoading)
					.toBeDefined();
			});

		it("should return TanStack errors query result",
			() =>
			{
				const result: ReturnType<typeof service.getTanStackErrors> =
					TestBed.runInInjectionContext(() =>
						service.getTanStackErrors());

				expect(result)
					.toBeTruthy();
				expect(result.isLoading)
					.toBeDefined();
			});
	});