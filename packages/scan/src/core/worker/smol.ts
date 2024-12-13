import { type Deferred, createDeferred } from "./deferred";

export type SmolWorkerCallback<T, R> = () => (arg: T) => Promise<R>;

function setupWorker<T, R>(setup: () => (arg: T) => R) {
	const callback = setup();

	function success(id: number, data: unknown) {
		self.postMessage([id, true, data]);
	}

	function failure(id: number, data: unknown) {
		self.postMessage([id, false, data]);
	}

	self.addEventListener("message", (event) => {
		const [id, data] = event.data;
		try {
			Promise.resolve(callback(data)).then(
				(res) => success(id, res),
				(res) => failure(id, res),
			);
		} catch (error) {
			failure(id, error);
		}
	});
}

function createWorker<T, R>(callback: SmolWorkerCallback<T, R>): Worker {
	const template = `(${setupWorker.toString()})(${callback.toString()})`;

	const url = URL.createObjectURL(new Blob([template]));

	const worker = new Worker(url, {
		type: "module",
	});

	return worker;
}

type SmolWorkerEventType = [id: number, flag: boolean, data: unknown];

export class SmolWorker<T, R> {
	private worker: Worker;

	private deferredMap = new Map<number, Deferred>();

	private count = 0;

	constructor(callback: SmolWorkerCallback<T, R>) {
		this.worker = createWorker(callback);

		this.worker.addEventListener(
			"message",
			(event: MessageEvent<SmolWorkerEventType>) => {
				const [id, flag, data] = event.data;

				const deferred = this.deferredMap.get(id);
				if (deferred) {
					if (flag) {
						deferred.resolve(data);
					} else {
						deferred.reject(data);
					}
					this.deferredMap.delete(id);
				}
			},
		);
	}

	async call(data: T, options?: StructuredSerializeOptions): Promise<R> {
		const deferred = createDeferred();
		this.deferredMap.set(this.count++, deferred);
		this.worker.postMessage(data, options);
		return deferred.promise as Promise<R>;
	}
}
