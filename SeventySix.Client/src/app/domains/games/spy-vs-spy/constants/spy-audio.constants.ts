// <copyright file="spy-audio.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Audio constants for the Spy vs Spy spy theme soundtrack.
 * Timing, volume, note frequencies, and pattern arrays.
 */

// ─── Timing ────────────────────────────────────────────────────────────────

/** Duration of one beat at 140 BPM in seconds. */
export const BEAT_DURATION: number =
	60 / 140;

/** Total bars in the loop. */
export const LOOP_BARS: number = 8;

/** Beats per bar (4/4 time). */
export const BEATS_PER_BAR: number = 4;

/** Total loop duration in seconds. */
export const LOOP_DURATION: number =
	LOOP_BARS * BEATS_PER_BAR * BEAT_DURATION;

// ─── Volume ────────────────────────────────────────────────────────────────

/** Soundtrack master volume. */
export const SOUNDTRACK_VOLUME: number = 0.10;

/** SFX master volume. */
export const SFX_VOLUME: number = 0.20;

// ─── Note Frequencies ──────────────────────────────────────────────────────

/**
 * Note frequencies for the spy theme (E minor, octave variants).
 * Named constants avoid magic numbers in melody/bass arrays and SFX methods.
 */

/** E2 note frequency in Hz. */
const NOTE_E2: number = 82.41;

/** G2 note frequency in Hz. */
const NOTE_G2: number = 98.00;

/** A2 note frequency in Hz. */
const NOTE_A2: number = 110.00;

/** B2 note frequency in Hz. */
const NOTE_B2: number = 123.47;

/** D3 note frequency in Hz. */
const NOTE_D3: number = 146.83;

/** A3 note frequency in Hz — used in bass pattern and defeat SFX. */
export const NOTE_A3: number = 220.00;

/** B3 note frequency in Hz — used in melody pattern and defeat SFX. */
export const NOTE_B3: number = 246.94;

/** D4 note frequency in Hz — used in melody pattern and defeat SFX. */
export const NOTE_D4: number = 293.66;

/** E4 note frequency in Hz — used in melody pattern and item/win/lose SFX. */
export const NOTE_E4: number = 329.63;

/** G4 note frequency in Hz — used in melody pattern and item collection SFX. */
export const NOTE_G4: number = 392.00;

/** A4 note frequency in Hz — used in melody pattern. */
const NOTE_A4: number = 440.00;

/** B4 note frequency in Hz — used in melody pattern and item/win SFX. */
export const NOTE_B4: number = 493.88;

// ─── Patterns ──────────────────────────────────────────────────────────────

/**
 * Bass line pattern — 1 note per beat, 32 beats total (8 bars × 4 beats).
 * E minor groove with chromatic spy tension.
 */
export const BASS_PATTERN: ReadonlyArray<number> =
	[
		NOTE_E2,
		NOTE_E2,
		NOTE_G2,
		NOTE_A2,
		NOTE_B2,
		NOTE_B2,
		NOTE_A2,
		NOTE_G2,
		NOTE_E2,
		NOTE_E2,
		NOTE_G2,
		NOTE_B2,
		NOTE_D3,
		NOTE_D3,
		NOTE_B2,
		NOTE_A2,
		NOTE_E2,
		NOTE_E2,
		NOTE_G2,
		NOTE_A2,
		NOTE_B2,
		NOTE_D3,
		NOTE_B2,
		NOTE_A2,
		NOTE_G2,
		NOTE_G2,
		NOTE_A2,
		NOTE_B2,
		NOTE_E2,
		NOTE_E2,
		NOTE_B2,
		NOTE_E2
	];

/**
 * Melody pattern — 1 note per beat (0 = rest).
 * Staccato spy theme over the bass.
 */
export const MELODY_PATTERN: ReadonlyArray<number> =
	[
		NOTE_E4,
		0,
		NOTE_G4,
		NOTE_E4,
		NOTE_B3,
		NOTE_D4,
		0,
		0,
		NOTE_E4,
		NOTE_G4,
		NOTE_A4,
		NOTE_G4,
		NOTE_E4,
		NOTE_D4,
		0,
		NOTE_B3,
		NOTE_E4,
		0,
		NOTE_B4,
		NOTE_A4,
		NOTE_G4,
		NOTE_E4,
		NOTE_D4,
		0,
		NOTE_B3,
		NOTE_D4,
		NOTE_E4,
		NOTE_G4,
		NOTE_E4,
		0,
		0,
		NOTE_B3
	];