import { HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import type { RegisteredRouter } from "@tanstack/react-router";
import type { JSX, ReactNode } from "react";
import { ThemeProvider } from "~/context/theme-context";
import { FOUC_SCRIPT } from "~/lib/fouc-script";

/** Props for the RootDocument component. */
interface RootDocumentProps
{
	/** The server-resolved theme ("dark" or "light"). */
	readonly serverTheme: string;
	/** Page content rendered inside the body. */
	readonly children: ReactNode;
}

/** HTML document wrapper providing `<html>`, `<head>`, and `<body>` with FOUC prevention. */
export function RootDocument({
	serverTheme,
	children
}: Readonly<RootDocumentProps>): JSX.Element
{
	const router: RegisteredRouter =
		useRouter();
	const cspNonce: string | undefined =
		router.options.ssr?.nonce;

	return (
		<html
			lang="en"
			className={serverTheme === "dark" ? "dark" : undefined}
			suppressHydrationWarning
		>
			<head>
				<script nonce={cspNonce} dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					{children}
				</ThemeProvider>
				<Scripts />
			</body>
		</html>);
}