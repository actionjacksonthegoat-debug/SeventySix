import { Component, signal, WritableSignal } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { ScrollRevealDirective } from "./scroll-reveal.directive";

@Component(
	{
		template: `<div appScrollReveal
			[revealThreshold]="threshold()"
			[revealDelay]="delay()">
			Content
		</div>`,
		imports: [ScrollRevealDirective]
	})
class TestHostComponent
{
	threshold: WritableSignal<number> =
		signal(0.15);
	delay: WritableSignal<number> =
		signal(0);
}

/** Captured IntersectionObserver callback for manual triggering in tests */
let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
let mockObserve: ReturnType<typeof vi.fn>;
let mockUnobserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

function setupMockIntersectionObserver(prefersReducedMotion: boolean = false): void
{
	mockObserve =
		vi.fn();
	mockUnobserve =
		vi.fn();
	mockDisconnect =
		vi.fn();

	vi.stubGlobal(
		"IntersectionObserver",
		class MockIntersectionObserver
		{
			constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit)
			{
				observerCallback =
					callback;
				observerOptions =
					options;
			}

			observe: ReturnType<typeof vi.fn> =
				mockObserve;
			unobserve: ReturnType<typeof vi.fn> =
				mockUnobserve;
			disconnect: ReturnType<typeof vi.fn> =
				mockDisconnect;
		});

	vi.stubGlobal(
		"matchMedia",
		vi.fn(
			() =>
				({ matches: prefersReducedMotion })));
}

describe("ScrollRevealDirective",
	() =>
	{
		let fixture: ComponentFixture<TestHostComponent>;
		let directiveElement: HTMLElement;

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		function createFixture(): void
		{
			TestBed.configureTestingModule(
				{
					imports: [TestHostComponent, ScrollRevealDirective],
					providers: [provideZonelessChangeDetection()]
				});

			fixture =
				TestBed.createComponent(TestHostComponent);
			fixture.detectChanges();
			directiveElement =
				fixture.nativeElement.querySelector("div");
		}

		it("should add scroll-reveal class on init",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				expect(directiveElement.classList.contains("scroll-reveal"))
					.toBe(true);
			});

		it("should NOT have revealed class initially",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				expect(directiveElement.classList.contains("revealed"))
					.toBe(false);
			});

		it("should add revealed class when intersection observed",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				observerCallback(
					[{ isIntersecting: true, target: directiveElement }] as unknown as IntersectionObserverEntry[],
					{} as IntersectionObserver);
				fixture.detectChanges();

				expect(directiveElement.classList.contains("revealed"))
					.toBe(true);
			});

		it("should unobserve after first intersection",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				observerCallback(
					[{ isIntersecting: true, target: directiveElement }] as unknown as IntersectionObserverEntry[],
					{} as IntersectionObserver);

				expect(mockUnobserve)
					.toHaveBeenCalledWith(directiveElement);
			});

		it("should immediately reveal when prefers-reduced-motion is reduce",
			() =>
			{
				setupMockIntersectionObserver(true);
				createFixture();

				expect(directiveElement.classList.contains("revealed"))
					.toBe(true);
				expect(mockObserve)
					.not.toHaveBeenCalled();
			});

		it("should create observer with configured threshold",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				expect(observerOptions?.threshold)
					.toBe(0.15);
			});

		it("should delay reveal when revealDelay is set",
			() =>
			{
				vi.useFakeTimers();
				setupMockIntersectionObserver();

				TestBed.configureTestingModule(
					{
						imports: [TestHostComponent, ScrollRevealDirective],
						providers: [provideZonelessChangeDetection()]
					});

				fixture =
					TestBed.createComponent(TestHostComponent);
				fixture.componentInstance.delay.set(200);
				fixture.detectChanges();
				directiveElement =
					fixture.nativeElement.querySelector("div");

				observerCallback(
					[{ isIntersecting: true, target: directiveElement }] as unknown as IntersectionObserverEntry[],
					{} as IntersectionObserver);
				fixture.detectChanges();

				expect(directiveElement.classList.contains("revealed"))
					.toBe(false);

				vi.advanceTimersByTime(200);
				fixture.detectChanges();

				expect(directiveElement.classList.contains("revealed"))
					.toBe(true);

				vi.useRealTimers();
			});

		it("should disconnect observer on destroy",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				fixture.destroy();

				expect(mockDisconnect)
					.toHaveBeenCalled();
			});
	});
