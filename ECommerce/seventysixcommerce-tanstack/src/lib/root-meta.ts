/** Returns the base meta tags including optional Google and Bing Site Verification. */
export function buildRootMeta(): Array<Record<string, string>>
{
	const meta: Array<Record<string, string>> =
		[
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "SeventySixCommerce — Original Art on Everyday Things" },
			{
				name: "description",
				content: "Discover unique art merchandise — t-shirts, posters, mugs and more featuring original artwork."
			}
		];

	const siteVerification: string =
		import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? "";

	if (siteVerification.length > 0)
	{
		meta.push(
			{
				name: "google-site-verification",
				content: siteVerification
			});
	}

	const bingVerification: string =
		import.meta.env.VITE_BING_SITE_VERIFICATION ?? "";

	if (bingVerification.length > 0)
	{
		meta.push(
			{
				name: "msvalidate.01",
				content: bingVerification
			});
	}

	return meta;
}