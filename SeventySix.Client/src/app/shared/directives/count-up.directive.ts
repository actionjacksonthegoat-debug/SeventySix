import {
	Directive,
	ElementRef,
	OnDestroy,
	OnInit,
	inject,
	input,
	InputSignal
} from "@angular/core";

/**
 * Count-up animation directive — animates a number from 0 to target on scroll-in.
 * Uses requestAnimationFrame for smooth animation.
 * Respects prefers-reduced-motion by showing final value immediately.
 *
 * @example
 * <span appCountUp [countTarget]="1400" [countSuffix]="'+'">0</span>
 */
@Directive(
	{
		selector: "[appCountUp]"
	})
export class CountUpDirective implements OnInit, OnDestroy
{
	readonly countTarget: InputSignal<number> =
		input.required<number>();

	readonly countDuration: InputSignal<number> =
		input<number>(1500);

	readonly countSuffix: InputSignal<string> =
		input<string>("");

	private readonly elementRef: ElementRef<HTMLElement> =
		inject(ElementRef);

	private observer: IntersectionObserver | null = null;
	private animationFrameId: number | null = null;

	ngOnInit(): void
	{
		const prefersReducedMotion: boolean =
			globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

		if (prefersReducedMotion)
		{
			this.setFinalValue();
			return;
		}

		this.elementRef.nativeElement.textContent =
			"0" + this.countSuffix();

		this.observer =
			new IntersectionObserver(
				(entries: IntersectionObserverEntry[]) =>
				{
					for (const entry of entries)
					{
						if (entry.isIntersecting)
						{
							this.startAnimation();
							this.observer?.unobserve(entry.target);
						}
					}
				},
				{ threshold: 0.5 });

		this.observer.observe(this.elementRef.nativeElement);
	}

	ngOnDestroy(): void
	{
		this.observer?.disconnect();
		this.observer = null;

		if (this.animationFrameId !== null)
		{
			cancelAnimationFrame(this.animationFrameId);
		}
	}

	private startAnimation(): void
	{
		const startTime: number =
			performance.now();
		const duration: number =
			this.countDuration();
		const target: number =
			this.countTarget();
		const suffix: string =
			this.countSuffix();

		const animate: (currentTime: number) => void =
			(currentTime: number): void =>
			{
				const elapsed: number =
					currentTime - startTime;
				const progress: number =
					Math.min(elapsed / duration, 1);
				const eased: number =
					1 - Math.pow(1 - progress, 3);
				const current: number =
					Math.round(eased * target);

				this.elementRef.nativeElement.textContent =
					current.toLocaleString() + suffix;

				if (progress < 1)
				{
					this.animationFrameId =
						requestAnimationFrame(animate);
				}
			};

		this.animationFrameId =
			requestAnimationFrame(animate);
	}

	private setFinalValue(): void
	{
		this.elementRef.nativeElement.textContent =
			this.countTarget()
				.toLocaleString() + this.countSuffix();
	}
}
