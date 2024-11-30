import * as _ from '../instrumentation/placeholder';
import { UIManager } from 'react-native';
import { Fiber } from 'react-reconciler';
import { Measurement, MeasurementValue, ReactScanInternals } from '../..';
import { instrument, Render } from '../instrumentation';
import { getNearestHostFiber } from '../instrumentation/fiber';
import { getCopiedActiveOutlines, getLabelText } from '../utils';

import { genId, PendingOutline } from '../web/outline';

const measurementCache = new WeakMap<
  Fiber,
  { measurement: MeasurementValue; timestamp: number }
>();

// React native gives warnings if too many promises are pending
let pendingCount = 0;
const MAX_PENDING = 50;
const queue: Array<{
  fiber: Fiber;
  callback?: (coords: MeasurementValue | null) => void;
  resolve: (value: MeasurementValue | null) => void;
}> = [];

const processQueue = () => {
  if (pendingCount >= MAX_PENDING || queue.length === 0) {
    return;
  }

  const { fiber, callback, resolve } = queue.shift()!;
  pendingCount++;

  const handleMeasurement = (
    x: number,
    y: number,
    width: number,
    height: number,
    pageX: number,
    pageY: number,
  ) => {
    const coords: MeasurementValue = { width, height, pageX, pageY, x, y };
    measurementCache.set(fiber, {
      measurement: coords,
      timestamp: Date.now(),
    });
    if (fiber.alternate) {
      measurementCache.set(fiber.alternate, {
        measurement: coords,
        timestamp: Date.now(),
      });
    }
    callback?.(coords);
    resolve(coords);
    pendingCount--;
    processQueue();
  };

  const executeMeasurement = () => {
    const now = Date.now();
    const cached = measurementCache.get(fiber);

    // If last read was within 250ms, return cached measurement
    if (cached && now - cached.timestamp < 250) {
      callback?.(cached.measurement);
      resolve(cached.measurement);
      pendingCount--;
      processQueue();
      return;
    }

    let measurableNode: Fiber | null = fiber;
    while (measurableNode) {
      // valid for new architecture
      if (measurableNode.stateNode?.canonical?.nativeTag) {
        UIManager.measure(
          measurableNode.stateNode.canonical.nativeTag,
          handleMeasurement,
        );
        return;
      }
      // valid for legacy
      if (measurableNode.stateNode?._nativeTag) {
        UIManager.measure(
          measurableNode.stateNode._nativeTag,
          handleMeasurement,
        );
        return;
      }
      // _should_ be valid in both environments
      if (measurableNode.stateNode?.measureInWindow) {
        measurableNode.stateNode.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            // measureInWindow doesn't provide pageX/pageY, so they're same as x/y
            handleMeasurement(x, y, width, height, x, y);
          },
        );
        return;
      }

      // If no measurement method found, try the first child
      measurableNode = measurableNode.child;
    }

    // If we couldn't find any measurable node
    callback?.(null);
    resolve(null);
    pendingCount--;
    processQueue();
  };

  executeMeasurement();
};

export const measureFiber = (
  fiber: Fiber,
  callback?: (coords: MeasurementValue | null) => void,
): Promise<MeasurementValue | null> => {
  return new Promise((resolve) => {
    queue.push({ fiber, callback, resolve });
    processQueue();
  });
};

const getKey = (measurement: MeasurementValue) => {
  return `${measurement.pageX}-${measurement.pageY}-${measurement.width}-${measurement.height}`;
};
export const assertNative = (measurement: Measurement) => {
  if (measurement.kind !== 'native') {
    throw new Error('native invariant');
  }
  return measurement;
};

const updateOutlines = async (fiber: Fiber, render: Render) => {
  const hostFiber = getNearestHostFiber(fiber);
  if (!hostFiber) {
    return null;
  }
  const measurement = await measureFiber(fiber);
  if (!measurement) {
    return null;
  }

  // todo: remove this check, then test and verify its not needed
  if (!measurement.pageX) {
    return null;
  }

  try {
    const existingOutline = ReactScanInternals.activeOutlines.find(
      ({ outline }) => {
        return (
          getKey(assertNative(outline.latestMeasurement).value) ===
          getKey(measurement)
        );
      },
    );

    // if an outline exists we just update the renders
    if (existingOutline) {
      existingOutline.outline.renders.push(render);
      existingOutline.text = getLabelText(
        existingOutline.outline.renders,
        'native',
      );
      existingOutline.updatedAt = Date.now();
      ReactScanInternals.activeOutlines = getCopiedActiveOutlines();
    } else {
      const newOutline: PendingOutline = {
        latestMeasurement: {
          kind: 'native',
          value: measurement,
        },
        fiber,
        renders: [render],
      };
      ReactScanInternals.activeOutlines.push({
        outline: newOutline,
        id: genId(),
        resolve: () => {
          /* noop in native since we aren't "painting" lines like web does with canvas*/
        },
        text: getLabelText(newOutline.renders, 'native'),
        updatedAt: Date.now(),
        // these are not used/needed in native. We should make activeOutlines
        // a discriminated union to avoid this hack
        alpha: -1,
        frame: -1,
        totalFrames: -1,
      });
      // tell useSes there's new data, not done automatically since we did not mutate the top level property
      ReactScanInternals.activeOutlines = getCopiedActiveOutlines();
    }
  } catch (e) {
    console.log(e);
  }
};

export const instrumentNative = () => {
  const options = ReactScanInternals.options;
  instrument({
    onCommitStart() {
      options.onCommitStart?.();
    },
    async onRender(fiber, render) {
      options.onRender?.(fiber, render);
      updateOutlines(fiber, render);
    },
    onCommitFinish() {
      options.onCommitFinish?.();
    },
  });
};
