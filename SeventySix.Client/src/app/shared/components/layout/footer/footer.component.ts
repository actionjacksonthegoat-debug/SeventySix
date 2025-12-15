import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";

/**
 * Application footer component
 * Displays copyright, version info, and footer links
 */
@Component(
	{
		selector: "app-footer",
		imports: [MatToolbarModule, MatIconModule],
		templateUrl: "./footer.component.html",
		styleUrl: "./footer.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class FooterComponent
{
	private readonly dateService: DateService =
		inject(DateService);
	protected readonly currentYear: number =
		this
		.dateService
		.parseUTC(this.dateService.now())
		.getFullYear();
	protected readonly version: string =
		environment.version;
}
