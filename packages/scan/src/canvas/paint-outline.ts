import { getLabelText } from "../core/utils";
import { fadeOutOutline } from "./fade-out-outline";
import { STORE } from "./store";
import type {
	ActiveOutline,
	FadeOutOutlineOptions,
	SerializablePendingOutline,
} from "./types";

function getActiveOutlines(
	outlines: Array<SerializablePendingOutline>,
	alpha: number,
	totalFrames: number,
): Array<ActiveOutline> {
	const activeOutlines: Array<ActiveOutline> = [];

	for (let i = 0, len = outlines.length; i < len; i++) {
		const outline = outlines[i];
		activeOutlines.push({
			outline,
			alpha,
			frame: 0,
			totalFrames,
			text: getLabelText(outline.renders),
		});
	}

	return activeOutlines;
}

export function paintOutlines(
	ctx: OffscreenCanvasRenderingContext2D,
	outlines: Array<SerializablePendingOutline>,
	options: Partial<FadeOutOutlineOptions>,
) {
	const totalFrames = options.alwaysShowLabels ? 60 : 30;
	const alpha = 0.8;

	// options.onPaintStart?.(outlines);
	const newActiveOutlines = getActiveOutlines(outlines, totalFrames, alpha);
	STORE.activeOutlines.push(...newActiveOutlines);
	fadeOutOutline(ctx, options);
}
