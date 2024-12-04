import { paintOutlines } from "./paint-outline";
import { type PaintEvent, PaintEventType } from "./types";

export function setupCanvasWorker(): void {
	self.addEventListener("message", (event: MessageEvent<PaintEvent>) => {
		const { type, payload } = event.data;
		switch (type) {
			case PaintEventType.PaintOutlines:
				{
					const ctx = payload.canvas.getContext("2d");
					if (ctx) {
						paintOutlines(ctx, payload.outlines, payload.options);
					}
				}
				break;
		}
	});
}
