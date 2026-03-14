/**
 * Input Service unit tests.
 * Tests keyboard state tracking for game controls.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { InputService } from "./input.service";

describe("InputService",
	() =>
	{
		let service: InputService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							InputService
						]
					});

				service =
					TestBed.inject(InputService);
				service.initialize();
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

		it("should track key down state for WASD keys",
			() =>
			{
				// Arrange & Act
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "w" }));

				// Assert
				expect(service.isKeyPressed("w"))
					.toBe(true);
			});

		it("should track key up state",
			() =>
			{
				// Arrange
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "w" }));

				// Act
				window.dispatchEvent(
					new KeyboardEvent(
						"keyup",
						{ key: "w" }));

				// Assert
				expect(service.isKeyPressed("w"))
					.toBe(false);
			});

		it("should track Enter key as fire input",
			() =>
			{
				// Arrange & Act
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "Enter" }));

				// Assert
				expect(service.isKeyPressed("Enter"))
					.toBe(true);
			});

		it("should track Escape as pause toggle",
			() =>
			{
				// Arrange & Act
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "Escape" }));

				// Assert
				expect(service.isKeyPressed("Escape"))
					.toBe(true);
			});

		it("should reset all states on blur",
			() =>
			{
				// Arrange
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "w" }));
				window.dispatchEvent(
					new KeyboardEvent(
						"keydown",
						{ key: "a" }));

				// Act
				window.dispatchEvent(
					new Event("blur"));

				// Assert
				expect(service.isKeyPressed("w"))
					.toBe(false);
				expect(service.isKeyPressed("a"))
					.toBe(false);
			});

		it("should return false for keys never pressed",
			() =>
			{
				// Act & Assert
				expect(service.isKeyPressed("q"))
					.toBe(false);
			});
	});