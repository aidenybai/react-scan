import { ReactScanInternals } from "../core";
import { type PendingOutline } from "../core/web/outline";
import {
	PaintEventType,
	type PaintOutlinePaintEvent,
	type SerializablePendingOutline,
} from "./types";

function serializePendingOutlines(
	outlines: Array<PendingOutline>,
): Array<SerializablePendingOutline> {
	const serializables: Array<SerializablePendingOutline> = [];
	for (let i = 0, len = outlines.length; i < len; i++) {
		const outline = outlines[i];
		serializables.push({
			x: outline.rect.x,
			y: outline.rect.y,
			width: outline.rect.width,
			height: outline.rect.height,
			renders: outline.renders,
		});
	}
	return serializables;
}

export function clientPaintOutlines(
	worker: Worker,
	canvas: OffscreenCanvas,
	outlines: Array<PendingOutline>,
): void {
	worker.postMessage(
		{
			type: PaintEventType.PaintOutlines,
			payload: {
				canvas,
				outlines: serializePendingOutlines(outlines),
				options: {
					dpi: window.devicePixelRatio,
					renderCountThreshold: ReactScanInternals.options.renderCountThreshold,
					maxRenders: ReactScanInternals.options.maxRenders,
					alwaysShowLabels: ReactScanInternals.options.alwaysShowLabels,
				},
			},
		} satisfies PaintOutlinePaintEvent,
		[canvas],
	);
}
