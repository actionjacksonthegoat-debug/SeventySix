// <copyright file="clipboard.utility.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Clipboard } from "@angular/cdk/clipboard";
import { WritableSignal } from "@angular/core";

/**
 * Copies text to clipboard with visual feedback support.
 * Handles the common pattern of showing "Copied!" state and resetting after delay.
 *
 * @param clipboard
 * The Angular CDK Clipboard service instance.
 *
 * @param text
 * The text to copy to the clipboard.
 *
 * @param copiedSignal
 * A writable signal to set to true on success and false after delay.
 *
 * @param resetDelayMs
 * Milliseconds before resetting the copied state.
 *
 * @returns
 * True if copy succeeded, false otherwise.
 */
export function copyWithFeedback(
	clipboard: Clipboard,
	text: string,
	copiedSignal: WritableSignal<boolean>,
	resetDelayMs: number): boolean
{
	const success: boolean =
		clipboard.copy(text);

	if (success)
	{
		copiedSignal.set(true);
		setTimeout(
			() => copiedSignal.set(false),
			resetDelayMs);
	}

	return success;
}