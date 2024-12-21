export interface Deferred {
	promise: Promise<unknown>;
	resolve(value: unknown): void;
	reject(value: unknown): void;
}

export function createDeferred(): Deferred {
	let resolve: Deferred["resolve"];
	let reject: Deferred["reject"];
	return {
		promise: new Promise<unknown>((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve(value): void {
			resolve(value);
		},
		reject(value): void {
			reject(value);
		},
	};
}
