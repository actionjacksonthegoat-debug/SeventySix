/**
 * Race State Service unit tests.
 * Tests race lifecycle state machine and driving state tracking.
 */

import { CharacterType, RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { setupSimpleServiceTest } from "@testing/test-bed-builders";

describe("RaceStateService",
	() =>
	{
		let service: RaceStateService;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(RaceStateService);
			});

		it("should initialize in Countdown state",
			() =>
			{
				expect(service.currentState())
					.toBe(RaceState.Countdown);
			});

		it("should transition from Countdown to Racing",
			() =>
			{
				service.transitionTo(RaceState.Racing);

				expect(service.currentState())
					.toBe(RaceState.Racing);
			});

		it("should transition from Racing to OctopusPhase",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);

				expect(service.currentState())
					.toBe(RaceState.OctopusPhase);
			});

		it("should transition from OctopusPhase to Rescue",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);

				expect(service.currentState())
					.toBe(RaceState.Rescue);
			});

		it("should transition from Rescue to Victory",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.Victory);

				expect(service.currentState())
					.toBe(RaceState.Victory);
			});

		it("should NOT allow invalid transitions (Racing → Victory directly)",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.Victory);

				expect(service.currentState())
					.toBe(RaceState.Racing);
			});

		it("should track elapsed race time during Racing state",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.updateElapsedTime(1.5);

				expect(service.elapsedTime())
					.toBe(1.5);
			});

		it("should expose current speed as signal",
			() =>
			{
				service.updateSpeed(15);

				expect(service.currentSpeed())
					.toBe(15);
			});

		it("should show rescue message during OctopusPhase",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);

				expect(service.rescueMessage())
					.toContain("Octopus");
			});

		it("should show drive to victory circle message during Rescue",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);

				expect(service.rescueMessage())
					.toContain("victory circle");
			});

		it("should allow restarting from Victory back to Countdown",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.Victory);
				service.transitionTo(RaceState.Countdown);

				expect(service.currentState())
					.toBe(RaceState.Countdown);
			});

		it("should show correct rescue character name (Prince when driving Princess)",
			() =>
			{
				service.setCharacterType(CharacterType.Princess);

				expect(service.rescueCharacterName())
					.toBe("Prince");
			});

		it("should show correct rescue character name (Princess when driving Prince)",
			() =>
			{
				service.setCharacterType(CharacterType.Prince);

				expect(service.rescueCharacterName())
					.toBe("Princess");
			});

		it("should format final time as M:SS",
			() =>
			{
				service.updateElapsedTime(92);

				expect(service.finalTime())
					.toBe("1:32");
			});

		it("should reset elapsed time and speed on reset",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.updateSpeed(20);
				service.updateElapsedTime(45);
				service.reset();

				expect(service.currentState())
					.toBe(RaceState.Countdown);
				expect(service.currentSpeed())
					.toBe(0);
				expect(service.elapsedTime())
					.toBe(0);
			});

		it("should display victory message with rescued character name",
			() =>
			{
				service.setCharacterType(CharacterType.Princess);
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.Victory);

				expect(service.rescueMessage())
					.toBe("Prince rescued! You win!");
			});

		it("should display princess victory message when driving Prince",
			() =>
			{
				service.setCharacterType(CharacterType.Prince);
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.Victory);

				expect(service.rescueMessage())
					.toBe("Princess rescued! You win!");
			});

		it("should transition from Rescue to GameOver",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.GameOver);

				expect(service.currentState())
					.toBe(RaceState.GameOver);
			});

		it("should transition from GameOver to Countdown",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.GameOver);
				service.transitionTo(RaceState.Countdown);

				expect(service.currentState())
					.toBe(RaceState.Countdown);
			});

		it("should transition from Racing to GameOver",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.GameOver);

				expect(service.currentState())
					.toBe(RaceState.GameOver);
			});

		it("should transition from OctopusPhase to GameOver",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.GameOver);

				expect(service.currentState())
					.toBe(RaceState.GameOver);
			});

		it("should transition from OctopusPhase to OctopusAttack",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.OctopusAttack);

				expect(service.currentState())
					.toBe(RaceState.OctopusAttack);
			});

		it("should transition from OctopusAttack to GameOver",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.OctopusAttack);
				service.transitionTo(RaceState.GameOver);

				expect(service.currentState())
					.toBe(RaceState.GameOver);
			});

		it("should return game over message for GameOver state",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.GameOver);

				expect(service.rescueMessage())
					.toContain("Game Over");
			});

		it("should reset from GameOver state",
			() =>
			{
				service.transitionTo(RaceState.Racing);
				service.transitionTo(RaceState.OctopusPhase);
				service.transitionTo(RaceState.Rescue);
				service.transitionTo(RaceState.GameOver);
				service.reset();

				expect(service.currentState())
					.toBe(RaceState.Countdown);
			});
	});