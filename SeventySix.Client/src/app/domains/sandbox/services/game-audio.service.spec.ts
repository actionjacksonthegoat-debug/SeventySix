/**
 * Game Audio Service unit tests.
 * Tests public API: mute toggle, dispose, and muted playback guard.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { GameAudioService } from "./game-audio.service";

describe("GameAudioService",
	() =>
	{
		let service: GameAudioService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							GameAudioService
						]
					});

				service =
					TestBed.inject(GameAudioService);
			});

		afterEach(
			() =>
			{
				service.dispose();
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should toggle mute state",
			() =>
			{
				// Arrange
				const initialMuted: boolean =
					service.isMuted();

				// Act
				service.toggleMute();

				// Assert
				expect(service.isMuted())
					.toBe(!initialMuted);

				// Act — toggle back
				service.toggleMute();

				// Assert
				expect(service.isMuted())
					.toBe(initialMuted);
			});

		it("should dispose audio resources cleanly",
			() =>
			{
				// Act & Assert — should not throw
				expect(
					() => service.dispose())
					.not
					.toThrow();
			});

		it("should not play sounds when muted",
			() =>
			{
				// Arrange — mute the service
				service.toggleMute();

				// Act & Assert — playShot should not throw when muted
				expect(
					() => service.playShot("MachineGun"))
					.not
					.toThrow();
			});
	});