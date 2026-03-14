/**
 * Game HUD Overlay Component unit tests.
 * Tests HUD rendering for score, lives, weapon, game state overlays.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import {
	ComponentFixture,
	TestBed
} from "@angular/core/testing";
import { GameState, WeaponType } from "@sandbox/models/game.models";
import { GameStateService } from "@sandbox/services/game-state.service";
import { ScoringService } from "@sandbox/services/scoring.service";
import { GameHudComponent } from "./game-hud";

describe("GameHudComponent",
	() =>
	{
		let component: GameHudComponent;
		let fixture: ComponentFixture<GameHudComponent>;
		let scoringService: ScoringService;
		let gameStateService: GameStateService;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [GameHudComponent],
							providers: [
								provideZonelessChangeDetection(),
								ScoringService,
								GameStateService
							]
						})
					.compileComponents();

				scoringService =
					TestBed.inject(ScoringService);
				gameStateService =
					TestBed.inject(GameStateService);

				fixture =
					TestBed.createComponent(GameHudComponent);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should display score from scoring service",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				scoringService.score.set(12500);
				fixture.detectChanges();

				const scoreElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='score-value']");

				expect(scoreElement?.textContent?.trim())
					.toContain("12500");
			});

		it("should display lives count",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				scoringService.lives.set(4);
				fixture.detectChanges();

				const livesElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='lives-value']");

				expect(livesElement?.textContent?.trim())
					.toContain("4");
			});

		it("should show title overlay when state is Title",
			() =>
			{
				gameStateService.currentState.set(GameState.Title);
				fixture.detectChanges();

				const titleOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='title-overlay']");

				expect(titleOverlay)
					.toBeTruthy();
			});

		it("should show game over overlay when state is GameOver",
			() =>
			{
				gameStateService.currentState.set(GameState.GameOver);
				fixture.detectChanges();

				const gameOverOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='gameover-overlay']");

				expect(gameOverOverlay)
					.toBeTruthy();
			});

		it("should hide overlays during Playing state",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				fixture.detectChanges();

				const titleOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='title-overlay']");
				const gameOverOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='gameover-overlay']");
				const pauseOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='pause-overlay']");

				expect(titleOverlay)
					.toBeNull();
				expect(gameOverOverlay)
					.toBeNull();
				expect(pauseOverlay)
					.toBeNull();
			});

		it("should display weapon type",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				component.currentWeapon.set(WeaponType.SpreadGun);
				fixture.detectChanges();

				const weaponElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='weapon-value']");

				expect(weaponElement?.textContent?.trim())
					.toContain("SPREAD");
			});

		it("should show nuke indicator when has nuke",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				component.hasNuke.set(true);
				fixture.detectChanges();

				const nukeElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='nuke-indicator']");

				expect(nukeElement)
					.toBeTruthy();
			});

		it("should show boss health bar when boss is active",
			() =>
			{
				gameStateService.currentState.set(GameState.Playing);
				component.bossActive.set(true);
				component.bossEyesRemaining.set(7);
				component.bossEyesTotal.set(10);
				fixture.detectChanges();

				const bossBar: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='boss-health-bar']");

				expect(bossBar)
					.toBeTruthy();
			});

		it("should show pause overlay when state is Paused",
			() =>
			{
				gameStateService.currentState.set(GameState.Paused);
				fixture.detectChanges();

				const pauseOverlay: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='pause-overlay']");

				expect(pauseOverlay)
					.toBeTruthy();
			});
	});