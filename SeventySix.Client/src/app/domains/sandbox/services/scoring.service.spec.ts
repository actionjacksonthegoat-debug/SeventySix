/**
 * Scoring Service unit tests.
 */

import { ScoringService } from "./scoring.service";

describe("ScoringService",
	() =>
	{
		let service: ScoringService;

		beforeEach(
			() =>
			{
				service =
					new ScoringService();
			});

		afterEach(
			() =>
			{
				service.resetFull();
				localStorage.clear();
			});

		it("should start with score 0",
			() =>
			{
				expect(service.score())
					.toBe(0);
			});

		it("should start with 3 lives",
			() =>
			{
				expect(service.lives())
					.toBe(3);
			});

		it("should add points for standard enemy kill",
			() =>
			{
				// Act
				service.addScore(100);

				// Assert
				expect(service.score())
					.toBe(100);
			});

		it("should add points for boss kill",
			() =>
			{
				// Act
				service.addScore(2000);

				// Assert
				expect(service.score())
					.toBe(2000);
			});

		it("should grant free life at 10000 points",
			() =>
			{
				// Act
				service.addScore(10000);

				// Assert — started with 3, gained 1
				expect(service.lives())
					.toBe(4);
			});

		it("should only grant one free life per 10000 threshold",
			() =>
			{
				// Act — add 10500 then add 500 more (still under 20000)
				service.addScore(10500);
				service.addScore(500);

				// Assert — only 1 free life (at 10K threshold)
				expect(service.lives())
					.toBe(4);
			});

		it("should decrement lives on player death",
			() =>
			{
				// Act
				service.loseLife();

				// Assert
				expect(service.lives())
					.toBe(2);
			});

		it("should detect game over when lives reach 0",
			() =>
			{
				// Act
				service.loseLife();
				service.loseLife();
				const isGameOver: boolean =
					service.loseLife();

				// Assert
				expect(isGameOver)
					.toBe(true);
				expect(service.lives())
					.toBe(0);
			});

		it("should persist high score in localStorage",
			() =>
			{
				// Act
				service.addScore(5000);
				service.saveHighScore();

				// Assert
				const stored: string | null =
					localStorage.getItem("galacticAssault_highScore");
				expect(stored)
					.toBe("5000");
			});

		it("should reset score but not high score on continue",
			() =>
			{
				// Arrange
				service.addScore(5000);
				service.saveHighScore();

				// Act
				service.resetForContinue();

				// Assert
				expect(service.score())
					.toBe(0);
				expect(service.highScore())
					.toBe(5000);
			});

		it("should allow continue with reset lives",
			() =>
			{
				// Arrange
				service.loseLife();
				service.loseLife();
				service.loseLife();

				// Act
				service.resetForContinue();

				// Assert
				expect(service.lives())
					.toBe(3);
				expect(service.score())
					.toBe(0);
			});

		it("should grant multiple free lives when crossing multiple thresholds at once",
			() =>
			{
				// Act — jump from 0 to 25000, crossing 10K and 20K
				service.addScore(25000);

				// Assert — started with 3, gained 2 (at 10K and 20K)
				expect(service.lives())
					.toBe(5);
			});

		it("should update high score immediately when exceeded",
			() =>
			{
				// Act
				service.addScore(5000);

				// Assert — high score tracks current
				expect(service.highScore())
					.toBe(5000);
			});

		it("should not decrease high score on continue",
			() =>
			{
				// Arrange
				service.addScore(15000);
				service.saveHighScore();

				// Act
				service.resetForContinue();
				service.addScore(2000);

				// Assert — high score stays at 15000
				expect(service.highScore())
					.toBe(15000);
			});

		it("should load high score from localStorage",
			() =>
			{
				// Arrange — persist a high score, then create new instance
				localStorage.setItem(
					"galacticAssault_highScore",
					"9999");

				const newService: ScoringService =
					new ScoringService();

				// Assert
				expect(newService.highScore())
					.toBe(9999);

				newService.resetFull();
			});

		it("should reset free life threshold counter on continue",
			() =>
			{
				// Arrange — cross 10K threshold
				service.addScore(10500);
				expect(service.lives())
					.toBe(4);

				// Act — continue resets score and threshold counter
				service.resetForContinue();
				service.addScore(10500);

				// Assert — should gain free life again at 10K
				expect(service.lives())
					.toBe(4);
			});
	});