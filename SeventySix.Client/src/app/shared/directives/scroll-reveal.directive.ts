import {
	Directive,
	ElementRef,
	inject,
	input,
	InputSignal,
	OnDestroy,
	OnInit,
	signal,
	WritableSignal
} from "@angular/core";

/**
 * Scroll reveal directive - adds 'revealed' CSS class when element enters viewport.
 * Uses IntersectionObserver for performant scroll-triggered animations.
 * Respects prefers-reduced-motion by revealing immediately.
 *
 * @example
 * <div appScrollReveal [revealThreshold]="0.2">Content</div>
 */
@Directive(
	{
		selector: "[appScrollReveal]",
		host: {
			"[class.scroll-reveal]": "true",
			"[class.revealed]": "isRevealed()"
		}
	})
export class ScrollRevealDirective implements OnInit, OnDestroy
{
	/**
	 * IntersectionObserver visibility threshold (0-1). Default `0.15` = 15% visible.
	 * @type {InputSignal<number>}
	 * @readonly
	 */
	readonly revealThreshold: InputSignal<number> =
		input<number>(0.15);

	/**
	 * Delay (ms) before revealing after the element enters the viewport. 0 = immediate.
	 * @type {InputSignal<number>}
	 * @readonly
	 */
	readonly revealDelay: InputSignal<number> =
		input<number>(0);

	/**
	 * Reference to the host element for IntersectionObserver targeting.
	 * @type {ElementRef<HTMLElement>}
	 * @private
	 * @readonly
	 */
	private readonly elementRef: ElementRef<HTMLElement> =
		inject(ElementRef);

	/**
	 * Active IntersectionObserver instance; `null` when destroyed or reduced-motion is active.
	 * @type {IntersectionObserver | null}
	 * @private
	 */
	private observer: IntersectionObserver | null = null;

	/**
	 * Whether the host element has been revealed (drives the `revealed` CSS class binding).
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isRevealed: WritableSignal<boolean> =
		signal<boolean>(false);

	ngOnInit(): void
	{
		const prefersReducedMotion: boolean =
			globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
				?? false;

		if (prefersReducedMotion)
		{
			this.isRevealed.set(true);
			return;
		}

		this.observer =
			new IntersectionObserver(
				(entries: IntersectionObserverEntry[]) =>
				{
					for (const entry of entries)
					{
						if (entry.isIntersecting)
						{
							const delay: number =
								this.revealDelay();

							if (delay > 0)
							{
								setTimeout(
									(): void =>
									{
										this.isRevealed.set(true);
									},
									delay);
							}
							else
							{
								this.isRevealed.set(true);
							}

							this.observer?.unobserve(entry.target);
						}
					}
				},
				{ threshold: this.revealThreshold() });

		this.observer.observe(this.elementRef.nativeElement);
	}

	ngOnDestroy(): void
	{
		this.observer?.disconnect();
		this.observer = null;
	}
}