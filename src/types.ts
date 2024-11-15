import type { FiberRoot } from 'react-reconciler';
import type { scan } from './index';

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      checkDCE: () => void;
      supportsFiber: boolean;
      renderers: Map<number, Renderer>;
      onScheduleFiberRoot: () => void;
      onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
      onCommitFiberUnmount: () => void;
      inject: (renderer: Renderer) => number;
    };
    reactScan: typeof scan;
  }
}

export type Renderer = any;

export interface Outline {
  rect: DOMRect;
  names: Set<string>;
  totalTime: number;
  selfTime: number;
  count: number;
  trigger: boolean;
  unstable?: boolean;
  forget?: boolean;
  prevChangedProps?: Record<string, any> | null;
  nextChangedProps?: Record<string, any> | null;
}

export interface OutlinePaintTask {
  outline: Outline;
  alpha: number;
  frame: number;
  totalFrames: number;
  resolve: () => void;
  text: string | null;
}

export interface OutlineLabel {
  alpha: number;
  outline: Outline;
  text: string | null;
}

export interface Change {
  name: string;
  prevValue: any;
  nextValue: any;
  unstable: boolean;
  value?: any;
}

export interface ScanOptions {
  /**
   * Enable or disable scanning
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Clear the console before logging
   *
   * @default true
   */
  clearLog?: boolean;
  /**
   * Log render results to the console
   *
   * @default true
   */
  log?: boolean;
  /**
   * Also run in production
   *
   * @default false
   */
  production?: boolean;
}

export interface WithScanOptions {
  /**
   * Include children of the component in the scan
   *
   * @default false
   */
  includeChildren?: boolean;
}
