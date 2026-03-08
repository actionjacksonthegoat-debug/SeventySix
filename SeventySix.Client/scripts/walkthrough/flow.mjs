export const DOMAIN_SECTION_ORDER = [
	"public",
	"authentication",
	"developer",
	"admin",
	"account",
];

export function hasVerticalOverflow({ viewportHeight, scrollHeight }) {
	return scrollHeight - viewportHeight > 80;
}

export function resolveDwellDuration({ viewportHeight, scrollHeight }) {
	const ratio = scrollHeight / Math.max(viewportHeight, 1);
	if (ratio >= 2.2) {
		return 2400;
	}
	if (ratio >= 1.35) {
		return 1600;
	}
	return 900;
}

export function shouldAvoidDirectNavigation(currentUrl, targetPath) {
	if (currentUrl.includes(targetPath)) {
		return true;
	}
	if (targetPath.startsWith("/admin") && currentUrl.includes("/admin")) {
		return true;
	}
	if (targetPath.startsWith("/account") && currentUrl.includes("/account")) {
		return true;
	}
	return false;
}
