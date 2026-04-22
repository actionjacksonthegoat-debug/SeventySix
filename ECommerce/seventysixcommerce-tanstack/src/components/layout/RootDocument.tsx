import { HeadContent, Scripts } from "@tanstack/react-router";
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
	return (
		<html
			lang="en"
			className={serverTheme === "dark" ? "dark" : undefined}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
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