import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

/**
 * Architecture Guide Page
 * Documentation for project architecture patterns and guidelines
 */
@Component(
	{
		selector: "app-architecture-guide",
		imports: [MatCardModule, MatIconModule],
		templateUrl: "./architecture-guide.html",
		styleUrl: "./architecture-guide.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ArchitectureGuideComponent
{
}
