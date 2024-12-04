export const onIdle = (callback: () => void) => {
	if ("scheduler" in globalThis) {
		return globalThis.scheduler.postTask(callback, {
			priority: "background",
		});
	}
	if ("requestIdleCallback" in window) {
		return requestIdleCallback(callback);
	}
	return setTimeout(callback, 0);
};

export const throttle = <T extends (...args: Array<any>) => any>(
	callback: T,
	delay: number,
) => {
	let lastCall = 0;
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastCall >= delay) {
			lastCall = now;
			return callback(...args);
		}
	};
};

export const createElement = (htmlString: string): HTMLElement => {
	const template = document.createElement("template");
	template.innerHTML = htmlString.trim();
	return template.content.firstElementChild as HTMLElement;
};
