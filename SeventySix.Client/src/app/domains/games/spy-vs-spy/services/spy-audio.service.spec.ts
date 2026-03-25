/**
 * Spy Audio Service unit tests.
 * AudioContext is unavailable in NullEngine test environments, so soundtrack
 * methods degrade silently. Tests verify the methods are callable and idempotent.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SpyAudioService } from "./spy-audio.service";

describe("SpyAudioService",
	() =>
	{
		let service: SpyAudioService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyAudioService
						]
					});

				service =
					TestBed.inject(SpyAudioService);
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("playSoundtrack should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playSoundtrack();
					})
					.not
					.toThrow();
			});

		it("stopSoundtrack should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.stopSoundtrack();
					})
					.not
					.toThrow();
			});

		it("playSoundtrack should be idempotent",
			() =>
			{
				expect(
					() =>
					{
						service.playSoundtrack();
						service.playSoundtrack();
					})
					.not
					.toThrow();
			});

		it("stopSoundtrack should be idempotent",
			() =>
			{
				expect(
					() =>
					{
						service.stopSoundtrack();
						service.stopSoundtrack();
					})
					.not
					.toThrow();
			});

		it("dispose should stop soundtrack without error",
			() =>
			{
				service.playSoundtrack();

				expect(
					() =>
					{
						service.dispose();
					})
					.not
					.toThrow();

				/* Calling stop after dispose should not throw. */
				expect(
					() =>
					{
						service.stopSoundtrack();
					})
					.not
					.toThrow();
			});

		it("playItemCollected should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playItemCollected();
					})
					.not
					.toThrow();
			});

		it("playBombTriggered should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playBombTriggered();
					})
					.not
					.toThrow();
			});

		it("playSpringTriggered should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playSpringTriggered();
					})
					.not
					.toThrow();
			});

		it("playWon should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playWon();
					})
					.not
					.toThrow();
			});

		it("playLost should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playLost();
					})
					.not
					.toThrow();
			});

		it("playCombatHit should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playCombatHit();
					})
					.not
					.toThrow();
			});

		it("playSearch should be callable without error",
			() =>
			{
				expect(
					() =>
					{
						service.playSearch();
					})
					.not
					.toThrow();
			});
	});