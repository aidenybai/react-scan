import type { Render } from "../core/instrumentation";

export interface SerializablePendingOutline {
	x: number;
	y: number;
	width: number;
	height: number;
	renders: Array<Render>;
}

export interface ActiveOutline {
	outline: SerializablePendingOutline;
	alpha: number;
	frame: number;
	totalFrames: number;
	text: string | null;
}

export interface SerializableOutlineLabel {
	alpha: number;
	outline: SerializablePendingOutline;
	text: string | null;
	color: { r: number; g: number; b: number };
}

export interface FadeOutOutlineOptions {
	dpi: number;
	renderCountThreshold: number;
	maxRenders: number;
	alwaysShowLabels: boolean;
}

export const enum PaintEventType {
	PaintOutlines = 1,
}

export interface PaintOutlinePaintEvent {
	type: PaintEventType;
	payload: {
		canvas: OffscreenCanvas;
		outlines: Array<SerializablePendingOutline>;
		options: Partial<FadeOutOutlineOptions>;
	};
}

export type PaintEvent = PaintOutlinePaintEvent;
