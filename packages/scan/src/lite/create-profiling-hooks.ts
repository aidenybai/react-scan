import { type Fiber, getDisplayName } from 'bippy';
import type { Emitter } from './create-emitter';
import type { ProfilingHooks } from './types';

const componentNameOf = (fiber: Fiber): string =>
  getDisplayName(fiber.type) ?? 'Anonymous';

export const createProfilingHooks = (emitter: Emitter): ProfilingHooks => ({
  markCommitStarted: (lanes) => emitter.emit('commit-start', { lanes }),
  markCommitStopped: () => emitter.emit('commit-stop'),
  markRenderStarted: (lanes) => emitter.emit('render-start', { lanes }),
  markRenderYielded: () => emitter.emit('render-yield'),
  markRenderStopped: () => emitter.emit('render-stop'),
  markRenderScheduled: (lane) => emitter.emit('render-scheduled', { lanes: lane }),
  markLayoutEffectsStarted: (lanes) => emitter.emit('layout-effects-start', { lanes }),
  markLayoutEffectsStopped: () => emitter.emit('layout-effects-stop'),
  markPassiveEffectsStarted: (lanes) =>
    emitter.emit('passive-effects-start', { lanes }),
  markPassiveEffectsStopped: () => emitter.emit('passive-effects-stop'),
  markComponentRenderStarted: (fiber) =>
    emitter.emit('component-render-start', { componentName: componentNameOf(fiber) }),
  markComponentRenderStopped: () => emitter.emit('component-render-stop'),
  markComponentLayoutEffectMountStarted: (fiber) =>
    emitter.emit('component-layout-effect-mount-start', {
      componentName: componentNameOf(fiber),
    }),
  markComponentLayoutEffectMountStopped: () =>
    emitter.emit('component-layout-effect-mount-stop'),
  markComponentLayoutEffectUnmountStarted: (fiber) =>
    emitter.emit('component-layout-effect-unmount-start', {
      componentName: componentNameOf(fiber),
    }),
  markComponentLayoutEffectUnmountStopped: () =>
    emitter.emit('component-layout-effect-unmount-stop'),
  markComponentPassiveEffectMountStarted: (fiber) =>
    emitter.emit('component-passive-effect-mount-start', {
      componentName: componentNameOf(fiber),
    }),
  markComponentPassiveEffectMountStopped: () =>
    emitter.emit('component-passive-effect-mount-stop'),
  markComponentPassiveEffectUnmountStarted: (fiber) =>
    emitter.emit('component-passive-effect-unmount-start', {
      componentName: componentNameOf(fiber),
    }),
  markComponentPassiveEffectUnmountStopped: () =>
    emitter.emit('component-passive-effect-unmount-stop'),
  markStateUpdateScheduled: (fiber, lane) =>
    emitter.emit('state-update', { componentName: componentNameOf(fiber), lanes: lane }),
  markForceUpdateScheduled: (fiber, lane) =>
    emitter.emit('force-update', { componentName: componentNameOf(fiber), lanes: lane }),
  markComponentSuspended: (fiber, _wakeable, lanes) =>
    emitter.emit('component-suspended', {
      componentName: componentNameOf(fiber),
      lanes,
    }),
  markComponentErrored: (fiber, thrownValue, lanes) => {
    const message =
      thrownValue && typeof thrownValue === 'object' && 'message' in thrownValue
        ? String((thrownValue as { message: unknown }).message)
        : String(thrownValue);
    emitter.emit('component-errored', {
      componentName: componentNameOf(fiber),
      lanes,
      message,
    });
  },
});
