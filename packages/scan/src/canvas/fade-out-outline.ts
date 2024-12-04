import type { Change } from "../core/instrumentation";
import { getLabelText } from "../core/utils";
import { STORE } from "./store";
import type {
	ActiveOutline,
	FadeOutOutlineOptions,
	SerializableOutlineLabel,
	SerializablePendingOutline,
} from "./types";

const DEFAULT_OPTIONS: FadeOutOutlineOptions = {
	dpi: 1,
	renderCountThreshold: 0,
	maxRenders: 100,
	alwaysShowLabels: true,
};

const START_COLOR = { r: 115, g: 97, b: 230 };
const END_COLOR = { r: 185, g: 49, b: 115 };

export const MONO_FONT =
	"Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";

const isRenderChangesUnstable = (changes: Change[]) => {
	for (let j = 0, len2 = changes.length; j < len2; j++) {
		const change = changes[j];
		if (change.unstable) {
			return true;
		}
	}
	return false;
};

const isOutlineUnstable = (outline: SerializablePendingOutline) => {
	for (let i = 0, len = outline.renders.length; i < len; i++) {
		const render = outline.renders[i];
		if (render.changes && isRenderChangesUnstable(render.changes)) {
			return true;
		}
	}
	return false;
};

function drawActiveOutline(
	ctx: OffscreenCanvasRenderingContext2D,
	activeOutline: ActiveOutline,
	options: FadeOutOutlineOptions,
): SerializableOutlineLabel | undefined {
	const { outline, frame, totalFrames } = activeOutline;

	let count = 0;
	let time = 0;
	for (let i = 0, len = outline.renders.length; i < len; i++) {
		const render = outline.renders[i];
		count += render.count;
		time += render.time;
	}

	const maxRenders = options.maxRenders ?? 100;
	const t = Math.min((count * (time || 1)) / maxRenders, 1);

	const r = Math.round(START_COLOR.r + t * (END_COLOR.r - START_COLOR.r));
	const g = Math.round(START_COLOR.g + t * (END_COLOR.g - START_COLOR.g));
	const b = Math.round(START_COLOR.b + t * (END_COLOR.b - START_COLOR.b));

	const color = { r, g, b };

	// const _totalTime = getMainThreadTaskTime();
	// if (totalTime) {
	//   console.log(totalTime);
	//   let divideBy = 1;
	//   for (let i = 0; i < Math.floor(totalTime / 50); i++) {
	//     divideBy += 0.1;
	//   }
	//   activeOutline.totalFrames = Math.floor(
	//     Math.max(1, totalFrames / divideBy),
	//   );
	// }
	const unstable = isOutlineUnstable(outline);

	if (options.renderCountThreshold > 0) {
		let count = 0;
		for (let i = 0, len = outline.renders.length; i < len; i++) {
			const render = outline.renders[i];
			count += render.count;
		}
		if (count < options.renderCountThreshold) {
			return;
		}
	}

	const isImportant = unstable || options.alwaysShowLabels;

	const alphaScalar = isImportant ? 0.8 : 0.2;
	activeOutline.alpha = alphaScalar * (1 - frame / totalFrames);

	const alpha = activeOutline.alpha;
	const fillAlpha = isImportant ? activeOutline.alpha * 0.1 : 0;

	const rgb = `${color.r},${color.g},${color.b}`;
	ctx.strokeStyle = `rgba(${rgb},${alpha})`;
	ctx.lineWidth = 1;
	ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;

	ctx.beginPath();
	ctx.rect(
		activeOutline.outline.x,
		activeOutline.outline.y,
		activeOutline.outline.width,
		activeOutline.outline.height,
	);
	ctx.stroke();
	ctx.fill();

	if (isImportant) {
		const text = getLabelText(outline.renders);
		return {
			alpha,
			outline,
			text,
			color,
		};
	}
	return undefined;
}

function drawActiveOutlines(
	ctx: OffscreenCanvasRenderingContext2D,
	groupedOutlines: Map<string, ActiveOutline>,
	options: FadeOutOutlineOptions,
): Array<SerializableOutlineLabel> {
	const pendingLabeledOutlines: Array<SerializableOutlineLabel> = [];

	ctx.save();

	for (const activeOutline of groupedOutlines.values()) {
		const result = drawActiveOutline(ctx, activeOutline, options);
		if (result) {
			pendingLabeledOutlines.push(result);
		}
	}

	ctx.restore();

	return pendingLabeledOutlines;
}

function drawPendingLabeledOutline(
	ctx: OffscreenCanvasRenderingContext2D,
	// Alexis: Destructuring is slow, but I'll be forgiving
	{ alpha, outline, text, color }: SerializableOutlineLabel,
) {
	ctx.save();

	if (text) {
		ctx.font = `11px ${MONO_FONT}`;
		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 11;

		const labelX: number = outline.x;
		const labelY: number = outline.y - textHeight - 4;

		ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
		ctx.fillRect(labelX, labelY, textWidth + 4, textHeight + 4);

		ctx.fillStyle = `rgba(255,255,255,${alpha})`;
		ctx.fillText(text, labelX + 2, labelY + textHeight);
	}

	ctx.restore();
}

function drawPendingLabeledOutlines(
	ctx: OffscreenCanvasRenderingContext2D,
	pendingLabeledOutlines: Array<SerializableOutlineLabel>,
) {
	for (let i = 0, len = pendingLabeledOutlines.length; i < len; i++) {
		drawPendingLabeledOutline(ctx, pendingLabeledOutlines[i]);
	}
}

function groupActiveOutlines(
	options: FadeOutOutlineOptions,
): Map<string, ActiveOutline> {
	const groupedOutlines = new Map<string, ActiveOutline>();

	for (let i = STORE.activeOutlines.length - 1; i >= 0; i--) {
		const activeOutline = STORE.activeOutlines[i];
		if (!activeOutline) continue;
		const { outline } = activeOutline;

		const key = `${activeOutline.outline.x}-${activeOutline.outline.y}`;

		if (!groupedOutlines.has(key)) {
			groupedOutlines.set(key, activeOutline);
		} else {
			const group = groupedOutlines.get(key)!;

			if (group.outline.renders !== outline.renders) {
				group.outline.renders = [...group.outline.renders, ...outline.renders];
			}

			group.alpha = Math.max(group.alpha, activeOutline.alpha);
			group.frame = Math.min(group.frame, activeOutline.frame);
			group.totalFrames = Math.max(
				group.totalFrames,
				activeOutline.totalFrames,
			);

			STORE.activeOutlines.splice(i, 1);
		}

		activeOutline.frame++;

		const progress = activeOutline.frame / activeOutline.totalFrames;
		const isImportant =
			isOutlineUnstable(activeOutline.outline) || options.alwaysShowLabels;

		const alphaScalar = isImportant ? 0.8 : 0.2;
		activeOutline.alpha = alphaScalar * (1 - progress);

		if (activeOutline.frame >= activeOutline.totalFrames) {
			// activeOutline.resolve();
			STORE.activeOutlines.splice(i, 1);
		}
	}
	return groupedOutlines;
}

export const fadeOutOutline = (
	ctx: OffscreenCanvasRenderingContext2D,
	options: Partial<FadeOutOutlineOptions>,
) => {
	const current = Object.assign({}, DEFAULT_OPTIONS, options);

	ctx.clearRect(
		0,
		0,
		ctx.canvas.width / current.dpi,
		ctx.canvas.height / current.dpi,
	);

	const pendingLabeledOutlines = drawActiveOutlines(
		ctx,
		groupActiveOutlines(current),
		current,
	);

	drawPendingLabeledOutlines(ctx, pendingLabeledOutlines);

	if (STORE.activeOutlines.length) {
		requestAnimationFrame(fadeOutOutline.bind(null, ctx, options));
	}
};
