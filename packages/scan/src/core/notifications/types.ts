export interface PerformanceInteractionEntry extends PerformanceEntry {
  interactionId: string;
  target: Element;
  name: string;
  duration: number;
  startTime: number;
  processingStart: number;
  processingEnd: number;
  entryType: string;
}
export interface PerformanceInteraction {
  id: string;
  latency: number;
  entries: Array<PerformanceInteractionEntry>;
  target: Element | null;
  type: 'pointer' | 'keyboard';
  startTime: number;
  endTime: number;
  processingStart: number;
  processingEnd: number;
  duration: number;
  inputDelay: number;
  processingDuration: number;
  presentationDelay: number;
  timestamp: number;
  timeSinceTabInactive: number | 'never-hidden';
  visibilityState: DocumentVisibilityState;
  timeOrigin: number;
  referrer: string;
  detailedTiming?: {
    jsHandlersTime: number; // pointerup -> click
    prePaintTime: number; // click -> RAF
    paintTime: number; // RAF -> setTimeout
    compositorTime: number; // remaining duration
  };
}
