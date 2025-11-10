import { Component, ChangeDetectionStrategy } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";

/**
 * Application footer component
 * Displays copyright, version info, and footer links
 */
@Component({
	selector: "app-footer",
	imports: [MatToolbarModule, MatIconModule],
	templateUrl: "./footer.component.html",
	styleUrl: "./footer.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent
{
	protected readonly currentYear = new Date().getFullYear();
	protected readonly version = "1.0.0"; // TODO: Pull from package.json or environment
}
