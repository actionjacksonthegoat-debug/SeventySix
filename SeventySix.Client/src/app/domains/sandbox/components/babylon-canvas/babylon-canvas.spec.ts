/**
 * Babylon Canvas Wrapper Component unit tests.
 * Tests canvas initialization and scene lifecycle.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BABYLON_ENGINE_OPTIONS } from "@sandbox/constants/game.constants";
import { BabylonEngineService } from "@sandbox/services/babylon-engine.service";
import { BabylonCanvasComponent } from "./babylon-canvas";

describe("BabylonCanvasComponent",
	() =>
	{
		let component: BabylonCanvasComponent;
		let fixture: ComponentFixture<BabylonCanvasComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [BabylonCanvasComponent],
							providers: [
								provideZonelessChangeDetection(),
								BabylonEngineService,
								{
									provide: BABYLON_ENGINE_OPTIONS,
									useValue: { useNullEngine: true }
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(BabylonCanvasComponent);
				component =
					fixture.componentInstance;
			});

		afterEach(
			() =>
			{
				fixture.destroy();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should contain a canvas element",
			() =>
			{
				// Arrange & Act
				fixture.detectChanges();
				const canvas: HTMLCanvasElement | null =
					fixture.nativeElement.querySelector("canvas");

				// Assert
				expect(canvas)
					.toBeTruthy();
			});

		it("should emit sceneReady event after initialization",
			async () =>
			{
				// Arrange
				let emittedScene: unknown = null;
				component.sceneReady.subscribe(
					(scene: unknown) =>
					{
						emittedScene = scene;
					});

				// Act
				fixture.detectChanges();
				await fixture.whenStable();

				// Assert
				expect(emittedScene)
					.toBeTruthy();
			});
	});