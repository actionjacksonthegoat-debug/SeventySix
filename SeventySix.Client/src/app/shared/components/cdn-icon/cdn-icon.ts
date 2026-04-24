import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	InputSignal,
	Signal
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { SafeHtml } from "@angular/platform-browser";
import { CdnIconService } from "@shared/services/cdn-icon.service";
import { switchMap } from "rxjs";

/**
 * CDN Icon Component — displays an SVG icon loaded from CDN.
 * Icons are cached after first load. Renders inline SVG with inherited CSS color.
 *
 * @example
 * <app-cdn-icon slug="angular" />
 */
@Component(
	{
		selector: "app-cdn-icon",
		changeDetection: ChangeDetectionStrategy.OnPush,
		template: `
			<span
				class="cdn-icon"
				[innerHTML]="iconHtml()"
				aria-hidden="true"
				role="img">
			</span>
		`,
		styleUrl: "./cdn-icon.scss"
	})
export class CdnIconComponent
{
	readonly slug: InputSignal<string> =
		input.required<string>();

	readonly source: InputSignal<string> =
		input<string>("simpleIcons");

	private readonly cdnIconService: CdnIconService =
		inject(CdnIconService);

	protected readonly iconHtml: Signal<SafeHtml | undefined> =
		toSignal(
			toObservable(this.slug)
				.pipe(
					switchMap(
						(slug: string) =>
							this.cdnIconService.loadIcon(
								slug,
								this.source()))));
}