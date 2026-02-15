import { Component, signal, WritableSignal } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { CountUpDirective } from "./count-up.directive";

@Component(
	{
		template: `<span appCountUp
			[countTarget]="target()"
			[countSuffix]="suffix()">0</span>`,
		imports: [CountUpDirective]
	})
class TestHostComponent
{
	target: WritableSignal<number> =
		signal(1400);
	suffix: WritableSignal<string> =
		signal("+");
}

let observerCallback: IntersectionObserverCallback;
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
			constructor(callback: IntersectionObserverCallback)
			{
				observerCallback =
					callback;
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

describe("CountUpDirective",
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
					imports: [TestHostComponent, CountUpDirective],
					providers: [provideZonelessChangeDetection()]
				});

			fixture =
				TestBed.createComponent(TestHostComponent);
			fixture.detectChanges();
			directiveElement =
				fixture.nativeElement.querySelector("span");
		}

		it("should show 0 with suffix before intersection",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				expect(directiveElement.textContent)
					.toBe("0+");
			});

		it("should show final value immediately with reduced motion",
			() =>
			{
				setupMockIntersectionObserver(true);
				createFixture();

				expect(directiveElement.textContent)
					.toContain("1,400");
				expect(directiveElement.textContent)
					.toContain("+");
			});

		it("should apply suffix to final value",
			() =>
			{
				setupMockIntersectionObserver(true);
				createFixture();

				expect(directiveElement.textContent)
					.toBe("1,400+");
			});

		it("should unobserve after first trigger",
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

		it("should disconnect observer on destroy",
			() =>
			{
				setupMockIntersectionObserver();
				createFixture();

				fixture.destroy();

				expect(mockDisconnect)
					.toHaveBeenCalled();
			});

		it("should not set up observer when prefers-reduced-motion",
			() =>
			{
				setupMockIntersectionObserver(true);
				createFixture();

				expect(mockObserve)
					.not.toHaveBeenCalled();
			});
	});
