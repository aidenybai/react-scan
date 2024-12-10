import { type Fiber } from 'react-reconciler';

export enum Device {
  DESKTOP = 0,
  TABLET = 1,
  MOBILE = 2,
}


export interface Session {
  id: string;
  device: Device;
  agent: string;
  wifi: string;
  cpu: number;
  gpu: string | null;
  mem: number;
}

export interface Interaction {
  id: string; // a hashed unique id for interaction (groupable across sessions)
  name: string; // name of interaction (i.e nav#top-menu.sc-601d0142-19.gHiJkL) or something useful
  type: string; // type of interaction i.e pointer
  time: number; // time of interaction in ms
  timestamp: number;
  route: string | null; // the computed route that handles dynamic params
  url: string;
  // clickhouse + ingest specific types
  projectId?: string;
  sessionId?: string;
  uniqueInteractionId: string;
}

export interface Component {
  interactionId: string; // grouping components by interaction
  name: string;
  renders: number; // how many times it re-rendered / instances (normalized)
  instances: number; // instances which will be used to get number of total renders by * by renders
  totalTime?: number;
  selfTime?: number;
}

export interface IngestRequest {
  interactions: Array<Interaction>;
  components: Array<Component>;
  session: Session;
}

// used internally in runtime for interaction tracking. converted to Interaction when flushed
export interface InternalInteraction {
  componentName: string;
  url: string;
  route: string | null;
  uniqueInteractionId: string;
  componentPath: string;
  performanceEntry: PerformanceInteraction;
  components: Map<string, InternalComponentCollection>;
}
interface InternalComponentCollection {
  uniqueInteractionId: string;
  name: string;
  renders: number; // re-renders associated with the set of components in this collection
  totalTime?: number;
  selfTime?: number;
  fibers: Set<Fiber>; // no references will exist to this once array is cleared after flush, so we don't have to worry about memory leaks
  retiresAllowed: number; // if our server is down and we can't collect fibers/ user has no network, it will memory leak. We need to only allow a set amount of retries before it gets gcd
}

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
  target: Element;
  type: 'pointer' | 'keyboard';
  startTime: number;
  processingStart: number;
  processingEnd: number;
  duration: number;
  inputDelay: number;
  processingDuration: number;
  presentationDelay: number;
  timestamp: number;
}
