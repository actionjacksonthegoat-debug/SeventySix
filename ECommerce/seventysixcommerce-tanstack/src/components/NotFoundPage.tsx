import type { JSX } from "react";

/** Rendered when no route matches. */
export function NotFoundPage(): JSX.Element
{
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
			<h1 className="mb-4 text-4xl font-bold text-text-primary">404</h1>
			<p className="mb-8 text-text-muted">
				The page you&apos;re looking for doesn&apos;t exist.
			</p>
			<a
				href="/"
				className="text-text-primary underline hover:no-underline"
			>
				Return home
			</a>
		</div>);
}