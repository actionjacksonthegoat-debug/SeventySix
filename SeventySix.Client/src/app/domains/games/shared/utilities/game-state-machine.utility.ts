/**
 * Game State Machine Utility.
 * Generic finite state machine with transition guards and change notification.
 * Used to enforce valid state transitions in game flow services.
 */

/** Callback signature for state transition notifications. */
export type TransitionCallback<TState> = (from: TState, to: TState) => void;

/**
 * Generic finite state machine that enforces valid transitions between game states.
 * Transition rules are defined declaratively via a Map of allowed target states per source state.
 * Supports listener registration, guard checks, and reset to initial state.
 * @template TState
 * The state enum or union type this machine operates on.
 */
export class GameStateMachine<TState>
{
	/** The initial state provided at construction (used by reset). */
	private readonly initialState: TState;

	/** Allowed transitions keyed by source state. */
	private readonly transitions: Map<TState, TState[]>;

	/** Current active state. */
	private state: TState;

	/** Registered transition listeners. */
	private readonly listeners: TransitionCallback<TState>[] = [];

	/**
	 * Creates a new state machine with the given initial state and transition rules.
	 * @param initialState
	 * The starting state of the machine.
	 * @param transitions
	 * A Map where each key is a source state and the value is an array
	 * of valid target states reachable from that source.
	 */
	constructor(
		initialState: TState,
		transitions: Map<TState, TState[]>)
	{
		this.initialState = initialState;
		this.transitions = transitions;
		this.state = initialState;
	}

	/**
	 * Current active state of the machine.
	 */
	get current(): TState
	{
		return this.state;
	}

	/**
	 * Checks whether a transition from the current state to the target state is allowed.
	 * @param target
	 * The desired target state.
	 * @returns
	 * True if the transition is defined in the transition map; false otherwise.
	 */
	canTransition(target: TState): boolean
	{
		const allowed: TState[] | undefined =
			this.transitions.get(this.state);

		if (allowed === undefined)
		{
			return false;
		}

		return allowed.includes(target);
	}

	/**
	 * Transitions to the target state if the transition is valid.
	 * Throws an error if the transition is not allowed.
	 * Notifies all registered listeners after a successful transition.
	 * @param target
	 * The target state to transition to.
	 * @throws Error
	 * If the transition from the current state to the target state is not allowed.
	 */
	transition(target: TState): void
	{
		if (!this.canTransition(target))
		{
			throw new Error(
				`Invalid state transition: ${String(this.state)} → ${String(target)}`);
		}

		const previous: TState =
			this.state;
		this.state = target;

		for (const listener of this.listeners)
		{
			listener(previous, target);
		}
	}

	/**
	 * Attempts a transition to the target state.
	 * Returns true if the transition succeeded, false if it was not allowed.
	 * Does not throw on invalid transitions.
	 * @param target
	 * The target state to attempt transitioning to.
	 * @returns
	 * True if the transition was valid and executed; false otherwise.
	 */
	tryTransition(target: TState): boolean
	{
		if (!this.canTransition(target))
		{
			return false;
		}

		this.transition(target);

		return true;
	}

	/**
	 * Registers a callback to be invoked on every successful state transition.
	 * @param callback
	 * A function receiving the previous and new state values.
	 */
	onTransition(callback: TransitionCallback<TState>): void
	{
		this.listeners.push(callback);
	}

	/**
	 * Resets the machine to its initial state without notifying listeners.
	 */
	reset(): void
	{
		this.state =
			this.initialState;
	}
}