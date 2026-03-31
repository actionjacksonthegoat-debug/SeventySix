import { NavItem, NavSection } from "@shared/models";
import {
	EXACT_MATCH_ROUTES,
	NAV_SECTIONS
} from "./navigation.constants";

describe("NAV_SECTIONS",
	() =>
	{
		it("should have 5 sections",
			() =>
			{
				expect(NAV_SECTIONS.length)
					.toBe(5);
			});

		it("should have sections in correct order",
			() =>
			{
				const titles: string[] =
					NAV_SECTIONS.map(
						(section: NavSection) => section.title);

				expect(titles)
					.toEqual(
						["Main", "Developer", "Management", "SvelteKit", "TanStack"]);
			});

		describe("Main section",
			() =>
			{
				it("should have 3 items",
					() =>
					{
						const main: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "Main");

						expect(main?.items.length)
							.toBe(3);
					});

				it("should require no roles",
					() =>
					{
						const main: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "Main");

						expect(main?.requiredRoles)
							.toEqual([]);
					});
			});

		describe("Management section",
			() =>
			{
				it("should have 4 items (without SvelteKit and TanStack)",
					() =>
					{
						const management: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "Management");

						expect(management?.items.length)
							.toBe(4);
					});

				it("should not contain SvelteKit item",
					() =>
					{
						const management: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "Management");
						const labels: string[] =
							management?.items.map(
								(item) => item.label) ?? [];

						expect(labels)
							.not
							.toContain("SvelteKit");
					});

				it("should not contain TanStack item",
					() =>
					{
						const management: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "Management");
						const labels: string[] =
							management?.items.map(
								(item) => item.label) ?? [];

						expect(labels)
							.not
							.toContain("TanStack");
					});
			});

		describe("SvelteKit section",
			() =>
			{
				it("should have 2 items",
					() =>
					{
						const svelteKit: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "SvelteKit");

						expect(svelteKit?.items.length)
							.toBe(2);
					});

				it("should have Dashboard item with route /admin/svelte",
					() =>
					{
						const svelteKit: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "SvelteKit");
						const dashboard: NavItem | undefined =
							svelteKit?.items.find(
								(item) => item.label === "Dashboard");

						expect(dashboard?.route)
							.toBe("/admin/svelte");
					});

				it("should have Logs item with route /admin/svelte/logs",
					() =>
					{
						const svelteKit: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "SvelteKit");
						const logs: NavItem | undefined =
							svelteKit?.items.find(
								(item) => item.label === "Logs");

						expect(logs?.route)
							.toBe("/admin/svelte/logs");
					});

				it("should require ROLE_ADMIN",
					() =>
					{
						const svelteKit: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "SvelteKit");

						expect(svelteKit?.requiredRoles)
							.toContain("Admin");
					});
			});

		describe("TanStack section",
			() =>
			{
				it("should have 2 items",
					() =>
					{
						const tanStack: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "TanStack");

						expect(tanStack?.items.length)
							.toBe(2);
					});

				it("should have Dashboard item with route /admin/tanstack",
					() =>
					{
						const tanStack: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "TanStack");
						const dashboard: NavItem | undefined =
							tanStack?.items.find(
								(item) => item.label === "Dashboard");

						expect(dashboard?.route)
							.toBe("/admin/tanstack");
					});

				it("should have Logs item with route /admin/tanstack/logs",
					() =>
					{
						const tanStack: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "TanStack");
						const logs: NavItem | undefined =
							tanStack?.items.find(
								(item) => item.label === "Logs");

						expect(logs?.route)
							.toBe("/admin/tanstack/logs");
					});

				it("should require ROLE_ADMIN",
					() =>
					{
						const tanStack: NavSection | undefined =
							NAV_SECTIONS.find(
								(section: NavSection) =>
									section.title === "TanStack");

						expect(tanStack?.requiredRoles)
							.toContain("Admin");
					});
			});
	});

describe("EXACT_MATCH_ROUTES",
	() =>
	{
		it("should contain root route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/"))
					.toBe(true);
			});

		it("should contain /admin route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/admin"))
					.toBe(true);
			});

		it("should contain /admin/svelte route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/admin/svelte"))
					.toBe(true);
			});

		it("should contain /admin/tanstack route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/admin/tanstack"))
					.toBe(true);
			});

		it("should not contain /admin/svelte/logs route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/admin/svelte/logs"))
					.toBe(false);
			});

		it("should not contain /admin/tanstack/logs route",
			() =>
			{
				expect(EXACT_MATCH_ROUTES.has("/admin/tanstack/logs"))
					.toBe(false);
			});
	});