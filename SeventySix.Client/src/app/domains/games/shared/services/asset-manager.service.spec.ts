import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AssetManagerService } from "@games/shared/services/asset-manager.service";

describe("AssetManagerService",
	() =>
	{
		let service: AssetManagerService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							AssetManagerService
						]
					});

				service =
					TestBed.inject(AssetManagerService);
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should start with empty loaded assets",
			() =>
			{
				expect(service.loadedAssetCount)
					.toBe(0);
			});

		it("should track a registered container",
			() =>
			{
				const mockContainer: { dispose: ReturnType<typeof vi.fn>; } =
					{ dispose: vi.fn() };

				service.registerContainer("test-url", mockContainer as never);

				expect(service.loadedAssetCount)
					.toBe(1);
			});

		it("should return cached container for duplicate registration",
			() =>
			{
				const mockContainer: { dispose: ReturnType<typeof vi.fn>; } =
					{ dispose: vi.fn() };

				service.registerContainer("test-url", mockContainer as never);
				service.registerContainer("test-url", mockContainer as never);

				expect(service.loadedAssetCount)
					.toBe(1);
			});

		it("should return cached container by URL",
			() =>
			{
				const mockContainer: { dispose: ReturnType<typeof vi.fn>; } =
					{ dispose: vi.fn() };

				service.registerContainer("test-url", mockContainer as never);

				const result: unknown =
					service.getCached("test-url");

				expect(result)
					.toBe(mockContainer);
			});

		it("should return null for uncached URL",
			() =>
			{
				const result: unknown =
					service.getCached("nonexistent");

				expect(result)
					.toBeNull();
			});

		it("should dispose all containers on disposeAll",
			() =>
			{
				const mockContainer1: { dispose: ReturnType<typeof vi.fn>; } =
					{ dispose: vi.fn() };
				const mockContainer2: { dispose: ReturnType<typeof vi.fn>; } =
					{ dispose: vi.fn() };

				service.registerContainer("url-1", mockContainer1 as never);
				service.registerContainer("url-2", mockContainer2 as never);

				service.disposeAll();

				expect(mockContainer1.dispose)
					.toHaveBeenCalled();
				expect(mockContainer2.dispose)
					.toHaveBeenCalled();
				expect(service.loadedAssetCount)
					.toBe(0);
			});

		it("should not throw when disposing with no containers",
			() =>
			{
				expect(() => service.disposeAll())
					.not
					.toThrow();
			});
	});