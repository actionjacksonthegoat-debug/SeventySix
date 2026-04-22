/**
 * Pre-hydration theme initialization script. Runs synchronously inline
 * in the document head to prevent Flash of Unstyled Content (FOUC).
 *
 * Reads the user's persisted theme preference from localStorage,
 * falls back to the system-level `prefers-color-scheme` media query,
 * and toggles the `dark` class on `<html>` before the first paint.
 * Always writes a `ssxc-theme` cookie so the next SSR request can
 * render the correct theme class server-side.
 *
 * SECURITY: This is a static, compile-time string — it never embeds
 * runtime user input. Safe for `dangerouslySetInnerHTML`.
 */
export const FOUC_SCRIPT: string =
	`(function(){var d=document.documentElement;var t=localStorage.getItem("SeventySixCommerce-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}var hasDark=d.classList.contains("dark");var wantDark=t==="dark";if(hasDark!==wantDark){d.classList.add("no-transition");if(wantDark){d.classList.add("dark")}else{d.classList.remove("dark")}requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.remove("no-transition")})})}document.cookie="ssxc-theme="+t+";path=/;max-age=31536000;SameSite=Lax"})();`;