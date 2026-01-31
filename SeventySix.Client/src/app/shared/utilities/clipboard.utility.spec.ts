// <copyright file="clipboard.utility.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Clipboard } from "@angular/cdk/clipboard";
import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyWithFeedback } from "./clipboard.utility";

describe("clipboard.utility",
	() =>
	{
		describe("copyWithFeedback",
			() =>
			{
				beforeEach(
					() =>
					{
						vi.useFakeTimers();
					});

				afterEach(
					() =>
					{
						vi.useRealTimers();
					});

				it("should return true and set signal when copy succeeds",
					() =>
					{
						TestBed.runInInjectionContext(
							() =>
							{
								const mockClipboard: Clipboard =
									{
										copy: vi
											.fn()
											.mockReturnValue(true)
									} as unknown as Clipboard;
								const copiedSignal: WritableSignal<boolean> =
									signal<boolean>(false);

								const result: boolean =
									copyWithFeedback(
										mockClipboard,
										"test text",
										copiedSignal,
										3000);

								expect(result)
									.toBe(true);
								expect(copiedSignal())
									.toBe(true);
								expect(mockClipboard.copy)
									.toHaveBeenCalledWith("test text");
							});
					});

				it("should return false and not set signal when copy fails",
					() =>
					{
						TestBed.runInInjectionContext(
							() =>
							{
								const mockClipboard: Clipboard =
									{
										copy: vi
											.fn()
											.mockReturnValue(false)
									} as unknown as Clipboard;
								const copiedSignal: WritableSignal<boolean> =
									signal<boolean>(false);

								const result: boolean =
									copyWithFeedback(
										mockClipboard,
										"test text",
										copiedSignal,
										3000);

								expect(result)
									.toBe(false);
								expect(copiedSignal())
									.toBe(false);
							});
					});

				it("should reset signal after delay when copy succeeds",
					() =>
					{
						TestBed.runInInjectionContext(
							() =>
							{
								const mockClipboard: Clipboard =
									{
										copy: vi
											.fn()
											.mockReturnValue(true)
									} as unknown as Clipboard;
								const copiedSignal: WritableSignal<boolean> =
									signal<boolean>(false);
								const resetDelayMs: number = 3000;

								copyWithFeedback(
									mockClipboard,
									"test text",
									copiedSignal,
									resetDelayMs);

								expect(copiedSignal())
									.toBe(true);

								vi.advanceTimersByTime(resetDelayMs);

								expect(copiedSignal())
									.toBe(false);
							});
					});

				it("should not reset signal when copy fails",
					() =>
					{
						TestBed.runInInjectionContext(
							() =>
							{
								const mockClipboard: Clipboard =
									{
										copy: vi
											.fn()
											.mockReturnValue(false)
									} as unknown as Clipboard;
								const copiedSignal: WritableSignal<boolean> =
									signal<boolean>(false);

								copyWithFeedback(
									mockClipboard,
									"test text",
									copiedSignal,
									3000);

								expect(copiedSignal())
									.toBe(false);

								vi.advanceTimersByTime(3000);

								expect(copiedSignal())
									.toBe(false);
							});
					});
			});
	});
