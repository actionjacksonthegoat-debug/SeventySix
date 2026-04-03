import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/** Redirects legacy /products path to /shop. */
export const load: PageServerLoad =
	async () =>
	{
		redirect(301, "/shop");
	};