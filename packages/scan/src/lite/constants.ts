export const DEFAULT_LOCATION = 'ReactScanLite';
export const DEFAULT_MAX_FIBERS_PER_COMMIT = 5000;
export const DEFAULT_MIN_FIBER_ACTUAL_DURATION_MS = 0;

// Total number of React fiber lanes. Lanes are encoded as a 31-bit bitmask;
// each bit represents one scheduling lane. Bumped in 18.x but stable since.
export const REACT_TOTAL_NUM_LANES = 31;

// Scheduler priority levels. Source:
// https://github.com/facebook/react/blob/main/packages/scheduler/src/SchedulerPriorities.js
export const SCHEDULER_PRIORITY_NAMES: Record<number, string> = {
  0: 'NoPriority',
  1: 'Immediate',
  2: 'UserBlocking',
  3: 'Normal',
  4: 'Low',
  5: 'Idle',
};
