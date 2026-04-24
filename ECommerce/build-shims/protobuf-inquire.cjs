"use strict";

module.exports = inquire;

/**
 * Requires a module only if available.
 * Mirrors @protobufjs/inquire behavior without using direct eval,
 * which triggers Vite/Rolldown EVAL warnings during builds.
 * @param {string} moduleName
 * @returns {object | null}
 */
function inquire(moduleName) {
	try {
		var mod = require(moduleName);
		if (mod && (mod.length || Object.keys(mod).length)) {
			return mod;
		}
	} catch (error) {
		// Optional dependency is unavailable.
	}

	return null;
}