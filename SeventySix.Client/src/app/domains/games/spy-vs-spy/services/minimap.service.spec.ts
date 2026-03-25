import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { MinimapService } from "./minimap.service";

describe("MinimapService",
	() =>
	{
		let service: MinimapService;
		let mockCanvas: HTMLCanvasElement;
		let mockCtx: CanvasRenderingContext2D;

		beforeEach(
			() =>
			{
				mockCtx =
					{
						clearRect: vi.fn(),
						fillRect: vi.fn(),
						strokeRect: vi.fn(),
						beginPath: vi.fn(),
						arc: vi.fn(),
						fill: vi.fn(),
						stroke: vi.fn(),
						closePath: vi.fn(),
						save: vi.fn(),
						restore: vi.fn(),
						fillStyle: "",
						strokeStyle: "",
						lineWidth: 1,
						globalAlpha: 1
					} as unknown as CanvasRenderingContext2D;

				mockCanvas =
					{
						getContext: vi
							.fn()
							.mockReturnValue(mockCtx),
						width: 160,
						height: 160
					} as unknown as HTMLCanvasElement;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							MinimapService
						]
					});

				service =
					TestBed.inject(MinimapService);
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should initialize with a canvas element",
			() =>
			{
				// Act
				service.initialize(mockCanvas);

				// Assert
				expect(mockCanvas.getContext)
					.toHaveBeenCalledWith("2d");
			});

		it("should clear canvas on update",
			() =>
			{
				// Arrange
				service.initialize(mockCanvas);

				// Act
				service.update(0, 0);

				// Assert
				expect(mockCtx.clearRect)
					.toHaveBeenCalledWith(
						0,
						0,
						160,
						160);
			});

		it("should draw room rectangles on update",
			() =>
			{
				// Arrange
				service.initialize(mockCanvas);

				// Act
				service.update(0, 0);

				// Assert — 6 rooms drawn as stroked rectangles
				expect(mockCtx.strokeRect)
					.toHaveBeenCalled();
				const strokeRectCalls: number =
					(mockCtx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length;
				expect(strokeRectCalls)
					.toBeGreaterThanOrEqual(6);
			});

		it("should draw player dot at scaled position",
			() =>
			{
				// Arrange
				service.initialize(mockCanvas);

				// Act
				service.update(10, -20);

				// Assert — arc was called to draw the player dot
				expect(mockCtx.beginPath)
					.toHaveBeenCalled();
				expect(mockCtx.arc)
					.toHaveBeenCalled();
				expect(mockCtx.fill)
					.toHaveBeenCalled();
			});

		it("should draw airstrip rectangle on update",
			() =>
			{
				// Arrange
				service.initialize(mockCanvas);

				// Act
				service.update(0, 0);

				// Assert — fillRect called for airstrip (at least 1 fill for airstrip + rooms)
				expect(mockCtx.fillRect)
					.toHaveBeenCalled();
			});

		it("should clear references on dispose",
			() =>
			{
				// Arrange
				service.initialize(mockCanvas);

				// Act
				service.dispose();

				// Assert — subsequent update should not draw
				service.update(0, 0);
				expect(mockCtx.clearRect)
					.not
					.toHaveBeenCalled();
			});
	});