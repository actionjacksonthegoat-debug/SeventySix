import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { IDisposable } from "@games/shared/models/game-service.interfaces";
import { DisposableRegistryService } from "@games/shared/services/disposable-registry.service";

describe("DisposableRegistryService",
	() =>
	{
		let service: DisposableRegistryService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							DisposableRegistryService
						]
					});

				service =
					TestBed.inject(DisposableRegistryService);
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should dispose a registered disposable on disposeAll",
			() =>
			{
				const disposable: IDisposable =
					{ dispose: vi.fn() };

				service.register(disposable);
				service.disposeAll();

				expect(disposable.dispose)
					.toHaveBeenCalledOnce();
			});

		it("should dispose multiple disposables in reverse order",
			() =>
			{
				const callOrder: number[] = [];
				const first: IDisposable =
					{ dispose: () => callOrder.push(1) };
				const second: IDisposable =
					{ dispose: () => callOrder.push(2) };
				const third: IDisposable =
					{ dispose: () => callOrder.push(3) };

				service.register(first);
				service.register(second);
				service.register(third);
				service.disposeAll();

				expect(callOrder)
					.toEqual(
						[3, 2, 1]);
			});

		it("should clear the registry after disposeAll",
			() =>
			{
				const disposable: IDisposable =
					{ dispose: vi.fn() };

				service.register(disposable);
				service.disposeAll();
				service.disposeAll();

				expect(disposable.dispose)
					.toHaveBeenCalledOnce();
			});

		it("should handle double disposeAll safely",
			() =>
			{
				expect(() => service.disposeAll())
					.not
					.toThrow();

				expect(() => service.disposeAll())
					.not
					.toThrow();
			});

		it("should continue disposing others when one throws",
			() =>
			{
				const first: IDisposable =
					{ dispose: vi.fn() };
				const throwing: IDisposable =
					{
						dispose: () =>
						{
							throw new Error("dispose error");
						}
					};
				const third: IDisposable =
					{ dispose: vi.fn() };

				service.register(first);
				service.register(throwing);
				service.register(third);

				expect(() => service.disposeAll())
					.not
					.toThrow();

				expect(third.dispose)
					.toHaveBeenCalledOnce();
				expect(first.dispose)
					.toHaveBeenCalledOnce();
			});
	});