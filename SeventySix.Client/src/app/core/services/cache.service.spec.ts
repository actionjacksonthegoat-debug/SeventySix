import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { of, throwError } from "rxjs";
import { CacheService } from "./cache.service";

describe("CacheService", () =>
{
	let service: CacheService;
	let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
	let mockCache: jasmine.SpyObj<Cache>;

	beforeEach(() =>
	{
		const swSpy = jasmine.createSpyObj("SwUpdate", ["checkForUpdate"], {
			isEnabled: true
		});

		// Mock the Cache API to prevent "app-cache scheme unsupported" errors
		mockCache = jasmine.createSpyObj<Cache>("Cache", [
			"put",
			"delete",
			"keys",
			"match"
		]);
		mockCache.put.and.returnValue(Promise.resolve());
		mockCache.delete.and.returnValue(Promise.resolve(true));
		mockCache.keys.and.returnValue(Promise.resolve([]));
		mockCache.match.and.returnValue(Promise.resolve(undefined));

		// Mock the global caches API
		spyOn(window.caches, "open").and.returnValue(
			Promise.resolve(mockCache)
		);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				CacheService,
				{ provide: SwUpdate, useValue: swSpy }
			]
		});

		service = TestBed.inject(CacheService);
		swUpdateSpy = TestBed.inject(SwUpdate) as jasmine.SpyObj<SwUpdate>;
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("get", () =>
	{
		it("should cache and return data from source observable", (done) =>
		{
			const testData = { value: "test" };
			const source$ = of(testData);

			service.get("test-key", source$).subscribe((data) =>
			{
				expect(data).toEqual(testData);
				done();
			});
		});

		it("should return cached data on second call", (done) =>
		{
			const testData = { value: "test" };
			let callCount = 0;
			const source$ = of(testData).pipe(tap(() => callCount++));

			// First call
			service.get("test-key", source$).subscribe(() =>
			{
				// Second call should use cache
				service.get("test-key", of(testData)).subscribe((data) =>
				{
					expect(data).toEqual(testData);
					expect(callCount).toBe(1); // Source called only once
					done();
				});
			});
		});

		it("should deduplicate inflight requests", (done) =>
		{
			const testData = { value: "test" };
			let callCount = 0;
			const source$ = of(testData).pipe(tap(() => callCount++));

			// Make two simultaneous requests
			const sub1 = service.get("inflight-key", source$);
			const sub2 = service.get("inflight-key", source$);

			Promise.all([sub1.toPromise(), sub2.toPromise()]).then(() =>
			{
				expect(callCount).toBe(1); // Source called only once
				done();
			});
		});

		it("should bypass cache when forceRefresh is true", (done) =>
		{
			const testData1 = { value: "test1" };
			const testData2 = { value: "test2" };

			// First call
			service.get("refresh-key", of(testData1)).subscribe(() =>
			{
				// Second call with forceRefresh
				service
					.get("refresh-key", of(testData2), { forceRefresh: true })
					.subscribe((data) =>
					{
						expect(data).toEqual(testData2);
						done();
					});
			});
		});

		it("should handle errors correctly", (done) =>
		{
			const error = new Error("Test error");
			const source$ = throwError(() => error);

			service.get("error-key", source$).subscribe({
				error: (err) =>
				{
					expect(err).toEqual(error);
					done();
				}
			});
		});
	});

	describe("set", () =>
	{
		it("should store data in cache", (done) =>
		{
			const testData = { value: "test" };

			service.set("manual-key", testData);

			// Verify data is cached
			service.get("manual-key", of(testData)).subscribe((data) =>
			{
				expect(data).toEqual(testData);
				done();
			});
		});

		it("should use custom TTL", (done) =>
		{
			const testData = { value: "test" };

			service.set("ttl-key", testData, { ttl: 1 });

			// Wait for expiration
			setTimeout(() =>
			{
				// Cache should be expired, source should be called
				service
					.get("ttl-key", of({ value: "new" }))
					.subscribe((data) =>
					{
						expect(data.value).toBe("new");
						done();
					});
			}, 10);
		});
	});

	describe("delete", () =>
	{
		it("should remove cache entry", (done) =>
		{
			const testData = { value: "test" };

			service.set("delete-key", testData);
			service.delete("delete-key").subscribe(() =>
			{
				// Verify cache is empty
				let sourceCalled = false;
				service
					.get(
						"delete-key",
						of({ value: "new" }).pipe(
							tap(() => (sourceCalled = true))
						)
					)
					.subscribe(() =>
					{
						expect(sourceCalled).toBe(true);
						done();
					});
			});
		});
	});

	describe("clearPattern", () =>
	{
		it("should clear entries matching pattern", (done) =>
		{
			service.set("api/users/1", { id: 1 });
			service.set("api/users/2", { id: 2 });
			service.set("api/posts/1", { id: 3 });

			service.clearPattern("users").subscribe(() =>
			{
				const stats = service.getStats();
				// Only posts entry should remain
				expect(stats.memoryEntries).toBe(1);
				done();
			});
		});
	});

	describe("clearAll", () =>
	{
		it("should clear all cache entries", (done) =>
		{
			service.set("key1", { value: 1 });
			service.set("key2", { value: 2 });

			service.clearAll().subscribe(() =>
			{
				const stats = service.getStats();
				expect(stats.memoryEntries).toBe(0);
				done();
			});
		});
	});

	describe("getStats", () =>
	{
		it("should return cache statistics", () =>
		{
			service.set("key1", { value: 1 });
			service.set("key2", { value: 2 });

			const stats = service.getStats();

			expect(stats.memoryEntries).toBe(2);
			expect(stats.inflightRequests).toBe(0);
			expect(stats.serviceWorkerEnabled).toBe(true);
		});
	});

	describe("isServiceWorkerEnabled", () =>
	{
		it("should return true when SW is enabled", () =>
		{
			expect(service.isServiceWorkerEnabled()).toBe(true);
		});

		it("should return false when SW is disabled", () =>
		{
			const swDisabledSpy = jasmine.createSpyObj(
				"SwUpdate",
				["checkForUpdate"],
				{
					isEnabled: false
				}
			);

			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideZonelessChangeDetection(),
					CacheService,
					{ provide: SwUpdate, useValue: swDisabledSpy }
				]
			});

			const serviceWithDisabledSw = TestBed.inject(CacheService);
			expect(serviceWithDisabledSw.isServiceWorkerEnabled()).toBe(false);
		});
	});
});

// Helper function for tap operator
function tap<T>(fn: (value: T) => void): (source$: any) => any
{
	return (source$) =>
		new (source$.constructor as any)((observer: any) =>
			source$.subscribe({
				next: (value: T) =>
				{
					fn(value);
					observer.next(value);
				},
				error: (err: any) => observer.error(err),
				complete: () => observer.complete()
			})
		);
}
