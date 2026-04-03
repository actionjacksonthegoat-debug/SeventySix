import { describe, expect, it } from "vitest";

import {
	GameStateMachine,
	TransitionCallback
} from "./game-state-machine.utility";

enum TestState
{
	Idle = "Idle",
	Loading = "Loading",
	Playing = "Playing",
	Won = "Won",
	Lost = "Lost"
}

function createTestMachine(): GameStateMachine<TestState>
{
	const transitions: Map<TestState, TestState[]> =
		new Map<TestState, TestState[]>(
			[
				[TestState.Idle, [TestState.Loading]],
				[TestState.Loading, [TestState.Playing]],
				[TestState.Playing, [TestState.Won, TestState.Lost]],
				[TestState.Won, [TestState.Idle]],
				[TestState.Lost, [TestState.Idle]]
			]);

	return new GameStateMachine<TestState>(
		TestState.Idle,
		transitions);
}

describe("GameStateMachine",
	() =>
	{
		describe("initial state",
			() =>
			{
				it("should start in the initial state",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						expect(machine.current)
							.toBe(TestState.Idle);
					});
			});

		describe("canTransition",
			() =>
			{
				it("should return true for a valid transition",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						expect(machine.canTransition(TestState.Loading))
							.toBe(true);
					});

				it("should return false for an invalid transition",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						expect(machine.canTransition(TestState.Playing))
							.toBe(false);
					});

				it("should return false when current state has no transitions defined",
					() =>
					{
						const transitions: Map<TestState, TestState[]> =
							new Map<TestState, TestState[]>();

						const machine: GameStateMachine<TestState> =
							new GameStateMachine<TestState>(
								TestState.Idle,
								transitions);

						expect(machine.canTransition(TestState.Loading))
							.toBe(false);
					});
			});

		describe("transition",
			() =>
			{
				it("should transition to a valid target state",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						machine.transition(TestState.Loading);

						expect(machine.current)
							.toBe(TestState.Loading);
					});

				it("should throw on an invalid transition",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						expect(() => machine.transition(TestState.Won))
							.toThrowError("Invalid state transition: Idle → Won");
					});

				it("should support multi-step transition chains",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						machine.transition(TestState.Loading);
						machine.transition(TestState.Playing);
						machine.transition(TestState.Won);

						expect(machine.current)
							.toBe(TestState.Won);
					});

				it("should notify listeners on successful transition",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();
						const transitions: Array<{ from: TestState; to: TestState; }> = [];

						machine.onTransition(
							(from: TestState, to: TestState) =>
							{
								transitions.push(
									{ from, to });
							});

						machine.transition(TestState.Loading);
						machine.transition(TestState.Playing);

						expect(transitions)
							.toHaveLength(2);
						expect(transitions[0])
							.toEqual(
								{ from: TestState.Idle, to: TestState.Loading });
						expect(transitions[1])
							.toEqual(
								{ from: TestState.Loading, to: TestState.Playing });
					});

				it("should not notify listeners on failed transition",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();
						let callCount: number = 0;

						const callback: TransitionCallback<TestState> =
							() =>
							{
								callCount++;
							};

						machine.onTransition(callback);

						try
						{
							machine.transition(TestState.Won);
						}
						catch
						{
							// Expected
						}

						expect(callCount)
							.toBe(0);
					});
			});

		describe("tryTransition",
			() =>
			{
				it("should return true and transition for a valid target",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						const result: boolean =
							machine.tryTransition(TestState.Loading);

						expect(result)
							.toBe(true);
						expect(machine.current)
							.toBe(TestState.Loading);
					});

				it("should return false and not change state for an invalid target",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						const result: boolean =
							machine.tryTransition(TestState.Won);

						expect(result)
							.toBe(false);
						expect(machine.current)
							.toBe(TestState.Idle);
					});

				it("should notify listeners when tryTransition succeeds",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();
						let notified: boolean = false;

						machine.onTransition(
							() =>
							{
								notified = true;
							});

						machine.tryTransition(TestState.Loading);

						expect(notified)
							.toBe(true);
					});
			});

		describe("onTransition",
			() =>
			{
				it("should support multiple listeners",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();
						let countA: number = 0;
						let countB: number = 0;

						machine.onTransition(
							() =>
							{
								countA++;
							});
						machine.onTransition(
							() =>
							{
								countB++;
							});

						machine.transition(TestState.Loading);

						expect(countA)
							.toBe(1);
						expect(countB)
							.toBe(1);
					});
			});

		describe("reset",
			() =>
			{
				it("should reset to the initial state",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						machine.transition(TestState.Loading);
						machine.transition(TestState.Playing);
						machine.reset();

						expect(machine.current)
							.toBe(TestState.Idle);
					});

				it("should not notify listeners on reset",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();
						let callCount: number = 0;

						machine.onTransition(
							() =>
							{
								callCount++;
							});

						machine.transition(TestState.Loading);
						callCount = 0;

						machine.reset();

						expect(callCount)
							.toBe(0);
					});

				it("should allow valid transitions after reset",
					() =>
					{
						const machine: GameStateMachine<TestState> =
							createTestMachine();

						machine.transition(TestState.Loading);
						machine.transition(TestState.Playing);
						machine.transition(TestState.Won);
						machine.reset();

						expect(machine.canTransition(TestState.Loading))
							.toBe(true);

						machine.transition(TestState.Loading);

						expect(machine.current)
							.toBe(TestState.Loading);
					});
			});
	});