import { Routes } from "@angular/router";
import { WorldMap } from "./modules/game/world-map/world-map";

export const routes: Routes = [
	{
		path: "sandbox",
		children: []
	},
	{
		path: "game",
		component: WorldMap
	}
];
