// Synchronous theme initialization — prevents FOUC (Flash of Unstyled Content).
// Must load render-blocking (no async/defer) before Angular bootstraps.
(function () {
	var brightness = localStorage.getItem('seventysix-theme-brightness');
	var isDark = brightness === null || brightness === 'dark';
	var colorScheme = localStorage.getItem('seventysix-color-scheme');
	var isBlue = colorScheme === 'blue';
	var html = document.documentElement;
	var head = document.head;

	// Apply theme classes synchronously to avoid FOUC
	html.classList.add(isDark ? 'dark-theme' : 'light-theme');
	html.classList.add(isBlue ? 'blue-scheme' : 'cyan-orange-scheme');

	if (isDark) {
		// dark-data-stream — responsive srcset
		var ds = document.createElement('link');
		ds.rel = 'preload';
		ds.as = 'image';
		ds.type = 'image/webp';
		ds.fetchPriority = 'high';
		ds.setAttribute(
			'imagesrcset',
			'/images/landing-page/dark-data-stream-mobile.webp 480w, ' +
			'/images/landing-page/dark-data-stream-tablet.webp 768w, ' +
			'/images/landing-page/dark-data-stream.webp 1920w'
		);
		ds.setAttribute('imagesizes', '100vw');
		ds.href = '/images/landing-page/dark-data-stream.webp';
		head.appendChild(ds);

		// dark-grid-texture
		var gt = document.createElement('link');
		gt.rel = 'preload';
		gt.as = 'image';
		gt.type = 'image/webp';
		gt.href = '/images/landing-page/dark-grid-texture.webp';
		head.appendChild(gt);
	} else {
		// light-crystal — responsive srcset
		var lc = document.createElement('link');
		lc.rel = 'preload';
		lc.as = 'image';
		lc.type = 'image/webp';
		lc.fetchPriority = 'high';
		lc.setAttribute(
			'imagesrcset',
			'/images/landing-page/light-crystal-mobile.webp 480w, ' +
			'/images/landing-page/light-crystal-tablet.webp 768w, ' +
			'/images/landing-page/light-crystal.webp 1920w'
		);
		lc.setAttribute('imagesizes', '100vw');
		lc.href = '/images/landing-page/light-crystal.webp';
		head.appendChild(lc);
	}
})();
