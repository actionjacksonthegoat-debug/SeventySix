/**
 * Car-a-Lot Automated Driving Script
 * ====================================
 * Paste this into the Chrome DevTools console (F12) while on the Car-a-Lot game page
 * (https://localhost:4200/sandbox/car-a-lot) to auto-drive the kart through the entire
 * course and rescue the Prince/Princess.
 *
 * Dynamically reads track segments so the script adapts to any track layout.
 * Uses ArrowUp, ArrowLeft, ArrowRight — same keys as manual keyboard play.
 *
 * Physics: 75 mph max, 24-unit wide roads, 20 boost pads, 200-unit tentacles,
 *          mouse left-click also accelerates.
 *
 * Reusable: just paste and run again after any restart.
 */
(async () =>
{
	// ── Access Angular component and services ──────────────────────────
	const comp = ng.getComponent(document.querySelector("app-car-a-lot-game"));

	if (!comp)
	{
		console.error("Could not find CarALotGameComponent. Are you on the Car-a-Lot page?");
		return;
	}

	const input = comp.inputService;
	const physics = comp.drivingPhysics;
	const raceState = comp.raceState;
	const trackBuilder = comp.trackBuilder;

	// ── Helpers ────────────────────────────────────────────────────────

	/** Set active keys (clears all others). Uses arrow keys matching keyboard play. */
	const setKeys = (...keys) =>
	{
		for (const k of Object.keys(input.keys))
		{
			input.keys[k] = false;
		}

		for (const k of keys)
		{
			input.keys[k] = true;
		}
	};

	/** Clear all keys. */
	const clearKeys = () =>
	{
		for (const k of Object.keys(input.keys))
		{
			input.keys[k] = false;
		}
	};

	/** Sleep for ms milliseconds. */
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	/** Get current kart position, heading, speed, and state. */
	const getState = () => ({
		x: physics.positionX,
		z: physics.positionZ,
		y: physics.positionY,
		heading: physics.headingRadians,
		speed: physics.currentSpeedMps,
		grounded: physics.grounded,
		state: raceState.currentState()
	});

	/**
	 * Navigate toward a target position using ArrowUp + ArrowLeft/ArrowRight.
	 * Skips steering when airborne (jumps/fling) to avoid mid-air course changes.
	 *
	 * @param {number} targetX - Target X coordinate.
	 * @param {number} targetZ - Target Z coordinate.
	 * @param {number} arriveRadius - Distance to consider "arrived" (default 8).
	 * @param {number} maxTime - Safety timeout in ms (default 30000).
	 */
	const navigateTo = async (targetX, targetZ, arriveRadius = 8, maxTime = 30000) =>
	{
		const start = Date.now();

		while (Date.now() - start < maxTime)
		{
			const s = getState();
			const dx = targetX - s.x;
			const dz = targetZ - s.z;
			const dist = Math.sqrt(dx * dx + dz * dz);

			if (dist < arriveRadius)
			{
				return true;
			}

			// When airborne (jump ramps or octopus fling), just hold forward
			if (!s.grounded)
			{
				setKeys("ArrowUp");
				await sleep(50);
				continue;
			}

			// Desired heading: atan2(dx, dz) matches sin(h)*X + cos(h)*Z movement
			const targetHeading = Math.atan2(dx, dz);
			let headingDiff = targetHeading - s.heading;

			// Normalize to [-PI, PI]
			while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
			while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;

			const keys = ["ArrowUp"];

			if (headingDiff > 0.08)
			{
				keys.push("ArrowRight");
			}
			else if (headingDiff < -0.08)
			{
				keys.push("ArrowLeft");
			}

			setKeys(...keys);
			await sleep(50);
		}

		console.warn(`Timeout navigating to (${targetX}, ${targetZ})`);
		return false;
	};

	/**
	 * Wait for a race state change.
	 * @param {string} targetState - State name to wait for.
	 * @param {number} maxTime - Timeout in ms.
	 */
	const waitForState = async (targetState, maxTime = 30000) =>
	{
		const start = Date.now();

		while (Date.now() - start < maxTime)
		{
			if (raceState.currentState() === targetState)
			{
				return true;
			}

			await sleep(100);
		}

		console.warn(`Timeout waiting for state: ${targetState}`);
		return false;
	};

	// ── Start the game ────────────────────────────────────────────────
	console.log("🏁 Starting Car-a-Lot...");
	comp.onStartGame();
	await sleep(300);

	// ── Dynamic waypoints from track segments ─────────────────────────
	const segments = trackBuilder.getSegments();

	if (!segments || segments.length === 0)
	{
		console.error("No track segments found. Is the track built?");
		return;
	}

	console.log(`📐 Track has ${segments.length} segments. Generating waypoints...`);

	// Pick every 5th segment as a waypoint (gives ~48 waypoints for ~240 segments)
	const waypointSpacing = 5;

	for (let segIdx = waypointSpacing; segIdx < segments.length; segIdx += waypointSpacing)
	{
		const seg = segments[segIdx];
		const arrived = await navigateTo(seg.positionX, seg.positionZ, 8, 30000);
		const s = getState();

		// Log every 5th waypoint (every 25th segment) to reduce noise
		if (segIdx % 25 === 0)
		{
			console.log(
				`📍 Seg ${segIdx}/${segments.length}: ` +
				`pos=(${s.x.toFixed(0)}, ${s.z.toFixed(0)}) ` +
				`speed=${(s.speed / 0.44704).toFixed(0)}mph ` +
				`state=${s.state}`
			);
		}

		if (!arrived)
		{
			console.error(`Failed at segment ${segIdx}. Position: (${s.x.toFixed(1)}, ${s.z.toFixed(1)})`);
			clearKeys();
			return;
		}

		// If race state changed unexpectedly, break out of track driving
		if (s.state !== "Racing")
		{
			console.log(`State changed to ${s.state} at segment ${segIdx}, leaving track loop.`);
			break;
		}
	}

	// ── Navigate to end of track ──────────────────────────────────────
	const lastSeg = segments[segments.length - 1];
	console.log("🏁 Heading to end of track...");
	await navigateTo(lastSeg.positionX, lastSeg.positionZ, 8, 15000);

	// ── Octopus approach ──────────────────────────────────────────────
	// Octopus body is OCTOPUS_SPAWN_OFFSET_Z (50) units past the last segment.
	// Tentacles extend 200 units back from body toward the track.
	// Drive time ~15 seconds at speed across tentacles.
	const octopusX = lastSeg.positionX;
	const octopusZ = lastSeg.positionZ + 50;

	console.log("🐙 Driving onto tentacles toward octopus (200-unit tentacles)...");
	setKeys("ArrowUp");

	// Drive toward octopus and wait for Rescue state (fling happens automatically)
	// Extended timeout for 200-unit tentacles (~15s drive time + margin)
	const flingStart = Date.now();

	while (Date.now() - flingStart < 40000)
	{
		const s = getState();

		if (s.state === "Rescue" || s.state === "GameOver")
		{
			break;
		}

		// Keep steering toward octopus center
		if (s.grounded)
		{
			const dx = octopusX - s.x;
			const dz = octopusZ - s.z;
			const targetHeading = Math.atan2(dx, dz);
			let headingDiff = targetHeading - s.heading;

			while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
			while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;

			const keys = ["ArrowUp"];

			if (headingDiff > 0.08) keys.push("ArrowRight");
			else if (headingDiff < -0.08) keys.push("ArrowLeft");
			setKeys(...keys);
		}
		else
		{
			setKeys("ArrowUp");
		}

		await sleep(50);
	}

	const postFlingState = getState();
	console.log(`🚀 Post-fling state: ${postFlingState.state} at (${postFlingState.x.toFixed(1)}, ${postFlingState.z.toFixed(1)})`);

	if (postFlingState.state === "GameOver")
	{
		console.warn("💥 Missed the landing road! Game Over.");
		clearKeys();
		return;
	}

	if (postFlingState.state !== "Rescue")
	{
		console.warn(`Unexpected state: ${postFlingState.state}. Waiting for Rescue...`);
		await waitForState("Rescue", 10000);
	}

	console.log("🚀 Flung past octopus! Navigating to rescue platform...");

	// ── Navigate to landing road center, then rescue platform ─────────
	// Landing road is 60 units long, 24 units wide past the octopus.
	// Rescue platform is RESCUE_PLATFORM_OFFSET_Z (60) units past octopus.
	const rescueX = octopusX;
	const rescueZ = octopusZ + 60;

	const rescueReached = await navigateTo(rescueX, rescueZ, 5, 20000);

	if (rescueReached)
	{
		console.log("🏰 At rescue platform — waiting for victory...");
		setKeys("ArrowUp");

		await waitForState("Victory", 15000);
		clearKeys();

		const finalState = getState();
		console.log(`🎉 VICTORY! Rescued the ${raceState.rescueCharacterName()}!`);
		console.log(`⏱️ Final time: ${raceState.finalTime()}`);
		console.log(`📍 Final position: (${finalState.x.toFixed(1)}, ${finalState.z.toFixed(1)})`);
	}
	else
	{
		clearKeys();
		const s = getState();
		console.warn(`Could not reach rescue platform. Position: (${s.x.toFixed(1)}, ${s.z.toFixed(1)}) State: ${s.state}`);
	}
})();
