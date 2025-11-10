import { TestBed } from "@angular/core/testing";
import { HttpRequest, HttpHandler, HttpResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { of } from "rxjs";
import { cacheInterceptor } from "./cache.interceptor";
import { CacheService } from "@core/services/cache.service";
import { CacheConfigService } from "@core/services/cache-config.service";

describe("cacheInterceptor", () =>
{
	let mockCacheService: jasmine.SpyObj<CacheService>;
	let mockCacheConfigService: jasmine.SpyObj<CacheConfigService>;
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockCacheService = jasmine.createSpyObj("CacheService", [
			"get",
			"clearAll",
			"clearPattern"
		]);
		mockCacheConfigService = jasmine.createSpyObj("CacheConfigService", [
			"getTtl"
		]);
		mockHandler = jasmine.createSpyObj("HttpHandler", ["handle"]);

		mockCacheConfigService.getTtl.and.returnValue(60000);
		mockHandler.handle.and.returnValue(
			of(new HttpResponse({ status: 200, body: {} }))
		);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: CacheService, useValue: mockCacheService },
				{
					provide: CacheConfigService,
					useValue: mockCacheConfigService
				}
			]
		});
	});

	it("should skip caching for non-GET requests", () =>
	{
		const req = new HttpRequest("POST", "/api/data", {});

		TestBed.runInInjectionContext(() =>
		{
			cacheInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		expect(mockHandler.handle).toHaveBeenCalled();
	});

	it("should skip caching for auth endpoints", () =>
	{
		const req = new HttpRequest("GET", "/auth/login");

		TestBed.runInInjectionContext(() =>
		{
			cacheInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		expect(mockHandler.handle).toHaveBeenCalled();
	});
});
