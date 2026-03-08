function sleep(durationMs) {
	return new Promise((resolve) => {
		setTimeout(resolve, durationMs);
	});
}

export async function retryAsync(operation, options = {}) {
	const retries = options.retries ?? 2;
	const delayMs = options.delayMs ?? 250;
	let lastError = null;
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (attempt < retries) {
				await sleep(delayMs);
			}
		}
	}
	throw lastError;
}

export async function resolveFirstVisibleCandidate(candidates) {
	for (const createCandidate of candidates) {
		const locator = createCandidate();
		if (await locator.count() > 0) {
			const first = locator.first();
			if (await first.isVisible()) {
				return first;
			}
		}
	}
	return null;
}
