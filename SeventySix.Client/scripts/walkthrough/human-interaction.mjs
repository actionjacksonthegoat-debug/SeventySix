function hashSeed(seedText) {
	let hash = 2166136261;
	for (let index = 0; index < seedText.length; index += 1) {
		hash ^= seedText.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function createSeededRandom(seedText) {
	let state = hashSeed(seedText);
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function randInt(randomFn, minValue, maxValue) {
	return Math.floor(randomFn() * (maxValue - minValue + 1)) + minValue;
}

function clamp(value, minValue, maxValue) {
	return Math.max(minValue, Math.min(value, maxValue));
}

function easeInOut(progress) {
	if (progress < 0.5) {
		return 2 * progress * progress;
	}
	return 1 - ((-2 * progress + 2) ** 2) / 2;
}

export function computeStepCount(distance) {
	if (distance <= 50) {
		return 6;
	}
	if (distance <= 150) {
		return 12;
	}
	if (distance <= 400) {
		return 20;
	}
	return 30;
}

export function buildNaturalMousePath(startPoint, endPoint, options = {}) {
	const steps = options.steps ?? 24;
	const route = [];
	for (let stepIndex = 0; stepIndex <= steps; stepIndex += 1) {
		const progress = stepIndex / steps;
		const easedProgress = easeInOut(progress);
		const x = startPoint.x + (endPoint.x - startPoint.x) * easedProgress;
		const y = startPoint.y + (endPoint.y - startPoint.y) * easedProgress;
		route.push({ x: Math.round(x), y: Math.round(y) });
	}
	return route;
}

export function buildTypingDelays(characterCount, options = {}) {
	const minDelay = options.minDelay ?? 42;
	const maxDelay = options.maxDelay ?? 126;
	const randomFn = options.randomFn ?? Math.random;
	const delays = [];
	for (let index = 0; index < characterCount; index += 1) {
		delays.push(randInt(randomFn, minDelay, maxDelay));
	}
	return delays;
}

export function pickTargetPoint(box, randomFn) {
	const x = clamp(
		Math.round(box.x + box.width * 0.4 + randInt(randomFn, -12, 12)),
		Math.round(box.x),
		Math.round(box.x + box.width),
	);
	const y = clamp(
		Math.round(box.y + box.height * 0.5 + randInt(randomFn, -10, 10)),
		Math.round(box.y),
		Math.round(box.y + box.height),
	);
	return { x, y };
}
