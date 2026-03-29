import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	provideAngularQuery,
	QueryClient
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
							provideAngularQuery(new QueryClient()),
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

		it("should have getSvelteKitWarnings method",
			() =>
			{
				expect(service.getSvelteKitWarnings)
					.toBeDefined();
			});

		it("should have getSvelteKitErrors method",
			() =>
			{
				expect(service.getSvelteKitErrors)
					.toBeDefined();
			});

		it("should have getTanStackWarnings method",
			() =>
			{
				expect(service.getTanStackWarnings)
					.toBeDefined();
			});

		it("should have getTanStackErrors method",
			() =>
			{
				expect(service.getTanStackErrors)
					.toBeDefined();
			});
	});