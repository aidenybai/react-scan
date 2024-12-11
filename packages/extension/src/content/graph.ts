console.log("graph.ts");
// Types first
type Operation = {
  type: 'add' | 'remove';
  count: number;
  timestamp?: number;
};
type HistoryPoint = { x: number; y: number; operationType: Operation['type'] | null };
type ExcludeConfig = { excludeChildNodes: boolean };

// Add performance measurement types
type PerformanceMetrics = {
  lastLCP: number | null;
  lastCLS: number | null;
  lastINP: number | null;
  script: number;
};

// Add arrays to store metrics
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_SAMPLES = 30;

// Add load state tracking
let isPageLoaded = false;

// Add tracking for max values
let maxMetrics = {
  lastLCP: null as number | null,
  lastCLS: 0,
  lastINP: null as number | null,
  script: 0
};

// Add LCP collection state
let lcpEntries: { size: number, startTime: number }[] = [];
const LCP_COLLECTION_TIME = 8000; // 8 seconds to collect LCP data
let lcpCollectionTimeout: number | null = null;

// Add LCP state tracking
let lcpFinalized = false;

// Add debug logging
const debugLCP = (msg: string, data?: any) => {
  console.log(`[LCP Debug] ${msg}`, data || '');
};

// Add valid LCP element types
const VALID_LCP_ELEMENTS = new Set([
  'IMG',
  'SVG',
  'VIDEO',
  'CANVAS',
  'PICTURE'
]);

// Add helper to check if element is visible
const isElementVisible = (element: Element): boolean => {
  if (!element.getBoundingClientRect) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden' &&
    window.getComputedStyle(element).display !== 'none'
  );
};

// Separate observers for each metric
const lcpObserver = new PerformanceObserver((list) => {
  if (lcpFinalized) return;

  const entries = list.getEntries();
  entries.forEach(entry => {
    const lcp = entry as PerformanceEntry & {
      element?: Element,
      size: number,
      renderTime?: number,
      loadTime: number,
      startTime: number
    };

    if (lcp.element && lcp.size > 0) {
      const time = lcp.renderTime || lcp.loadTime || lcp.startTime;

      // Update if this is a larger contentful paint
      if (!maxMetrics.lastLCP || time > maxMetrics.lastLCP) {
        maxMetrics.lastLCP = time;
        performanceMetrics[0] = { ...maxMetrics };
        debugLCP('New LCP:', { time, size: lcp.size });
      }
    }
  });
});

const clsObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    if (!(entry as LayoutShift).hadRecentInput) {
      maxMetrics.lastCLS = (maxMetrics.lastCLS || 0) + (entry as LayoutShift).value;
      performanceMetrics[0] = { ...maxMetrics };
    }
  });
});

// Update INP tracking state
let inpScores: number[] = [];
const INP_PERCENTILE = 0.75; // 75th percentile for INP

// Update INP observer
const inpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    debugLCP('INP Entry:', {
      duration: entry.duration,
      type: entry.entryType,
      name: (entry as any).name
    });

    // Track all valid interactions
    if (entry.duration > 0) {
      inpScores.push(entry.duration);

      // Calculate INP as the 98th percentile
      const sortedScores = [...inpScores].sort((a, b) => b - a);
      const percentileIndex = Math.floor(sortedScores.length * 0.98);
      const newINP = sortedScores[percentileIndex] || sortedScores[0];

      maxMetrics.lastINP = newINP;
      performanceMetrics[0] = { ...maxMetrics };
    }
  });
});

// Update observer registration to handle both first-input and event
try {
  // Register for first-input
  inpObserver.observe({
    entryTypes: ['first-input'],
    buffered: true
  } as PerformanceObserverInit);

  // Register for event timing
  const eventObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (entry.duration > 0) {
        inpScores.push(entry.duration);
        const maxDuration = Math.max(...inpScores);
        maxMetrics.lastINP = maxDuration;
        performanceMetrics[0] = { ...maxMetrics };
      }
    });
  });

  eventObserver.observe({
    entryTypes: ['event'],
    buffered: true
  } as PerformanceObserverInit);
} catch (e) {
  console.warn('Failed to register performance observers:', e);
}

// Keep only this observer initialization in the load event
window.addEventListener('load', () => {
  // Initialize metrics array
  performanceMetrics[0] = maxMetrics;

  // Start observers
  lcpObserver.observe({
    entryTypes: ['largest-contentful-paint'],
    buffered: true
  });

  clsObserver.observe({
    entryTypes: ['layout-shift'],
    buffered: true
  });

  inpObserver.observe({
    entryTypes: ['first-input', 'interaction'],
    buffered: true
  } as PerformanceObserverInit);

  // Set timeout to finalize LCP
  setTimeout(() => {
    lcpFinalized = true;
    lcpObserver.disconnect();
  }, LCP_COLLECTION_TIME);
});

// Add measurement function
const measurePerformance = () => {
  const now = performance.now();

  // Create performance marks
  performance.mark('measure-start');

  // Force layout calculation
  document.body.offsetHeight;

  // Measure paint and layout
  const metrics: PerformanceMetrics = {
    lastLCP: null,
    lastCLS: null,
    lastINP: null,
    script: 0
  };

  performance.mark('measure-end');
  const measure = performance.measure('total', 'measure-start', 'measure-end');
  metrics.script = measure.duration;

  performanceMetrics.push(metrics);
  if (performanceMetrics.length > MAX_METRICS_SAMPLES) {
    performanceMetrics.shift();
  }

  // Clear marks and measures
  performance.clearMarks();
  performance.clearMeasures();
};

// Add type definition for LayoutShift
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Visual Configuration first
const VISUAL = {
  CANVAS: {
    WIDTH_RATIO: 0.25,
    HEIGHT_RATIO: 0.20,
    MIN_WIDTH: 400,
    MIN_HEIGHT: 200,
  } as {
    WIDTH_RATIO: number,
    HEIGHT_RATIO: number,
    MIN_WIDTH: number,
    MIN_HEIGHT: number
  },
  STYLE: {
    COLORS: {
      GRID: "rgba(75, 75, 106, 0.4)",
      LINE: "#b975f9",
      GLOW: "rgba(185, 117, 249, 0.8)",
      BACKGROUND: "#0f0f17",
      STATUS: {
        ACTIVE: "rgba(185, 117, 249, 0.8)",
        INACTIVE: "rgba(185, 117, 249, 1)",
      },
    },
    DOT: {
      RADIUS: 4,
      MARGIN: 16,
    },
  },
} as const;

// Animation Configuration second
const ANIMATION = {
  DURATION: {
    SPIKE: 1000,
    RETURN: 800,
    DELAY: 300,
  },
  GRID: {
    SPEED: 2,
    SIZE: 32,
  },
  LINE: {
    SPEED: 2,
  },
  SPIKE: {
    MIN_HEIGHT: 4,
    MAX_HEIGHT: 200,
    MULTIPLIER: 2,
    SCALE_FACTOR: 0.8
  },
  BATCH_SIZE: 1,
  EASE: {
    OPERATION: 0.05,
    RETURN: 0.02,
    IDLE: 0.02
  }
} as const;

// Performance Configuration
const PERFORMANCE = {
  SCROLL: {
    VELOCITY_THRESHOLD: 30,
    SUSPEND_DELAY: 150,
    BATCH_SIZE: 100,
    FPS_LIMIT: 1000 / 30,
    DETECTION_THRESHOLD: 5,
    COOLDOWN: 100,
    MIN_DELTA: 50,
    FAST_SCROLL_FPS: 1000 / 10,
  },
  FRAME: {
    BUDGET: 16.67,
    SKIP_THRESHOLD: 20,
    MAX_SKIP_COUNT: 3,
    THROTTLE_DELAY: 16,
    SCROLL_THROTTLE: 32,
  },
};

// Configuration for exclusions
const EXCLUDED_IDS: Record<string, ExcludeConfig> = {
  "react-scan-backdrop": { excludeChildNodes: true },
  "react-scan-toast": { excludeChildNodes: true },
  "react-scan-toolbar-root": { excludeChildNodes: true },
  "react-scan-inspect-canvas": { excludeChildNodes: true },
  "react-scan-extension-button": { excludeChildNodes: true },
  "react-scan-graph": { excludeChildNodes: true },
};

const EXCLUDED_CLASSNAMES: Record<string, ExcludeConfig> = {
  "exclude-class": { excludeChildNodes: true },
  "partial-exclude-class": { excludeChildNodes: false },
};

const EXCLUDED_DATA_ATTRS: Record<string, ExcludeConfig> = {
  "data-exclude": { excludeChildNodes: true },
  "data-partial-exclude": { excludeChildNodes: false },
};

const EXCLUDED_TAGS: Record<string, ExcludeConfig> = {
  SCRIPT: { excludeChildNodes: true },
  STYLE: { excludeChildNodes: true },
  HEAD: { excludeChildNodes: true },
  HTML: { excludeChildNodes: false }, // Include child nodes
};

const isExcluded = (el: Element): boolean => {
  // Check if the element matches exclusion by ID
  if (EXCLUDED_IDS[el.id]?.excludeChildNodes) return true;

  // Check if the element matches exclusion by class name
  if (Array.from(el.classList).some((cls) => EXCLUDED_CLASSNAMES[cls]?.excludeChildNodes)) return true;

  // Check if the element matches exclusion by tag name
  if (EXCLUDED_TAGS[el.tagName]?.excludeChildNodes) return true;

  // Check if the element matches exclusion by data attributes
  if (Array.from(el.attributes).some((attr) => EXCLUDED_DATA_ATTRS[attr.name]?.excludeChildNodes)) return true;

  return false;
};

let rafId: number | null = null;
let lastDrawTime = performance.now();

let gridOffset = 0;
let currentY = VISUAL.CANVAS.MIN_HEIGHT / 2;
let targetY = VISUAL.CANVAS.MIN_HEIGHT / 2;
let isTracking = false;
let isAnimating = false;
let lastSpikeTime = 0;
let currentOperation: 'add' | 'remove' | null = null;
let lastFrameTime = performance.now();
let isStatusActive = false;
let pendingOperations: Operation[] = [];
let lastElementCount = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// History arrays
const paintTimes: number[] = [];
const positionHistory: HistoryPoint[] = [];
let MAX_HISTORY = Math.floor(VISUAL.CANVAS.MIN_WIDTH / ANIMATION.GRID.SPEED);

// Storage and position
const STORAGE_KEY = 'react-scan-graph-position';
let initialX: number;
let initialY: number;

// State variables
let scrollState = {
  timer: null as number | null,
  minimalMode: false,
  mutationBuffer: [] as MutationRecord[],
  lastScrollTime: performance.now()
};

// Add near other state variables
let elementCache: Element[] = [];
let lastCacheTime = 0;

// Add debounce for mutation processing
const MUTATION_DEBOUNCE = 32; // Faster response to changes

// Add near other state variables
const MAX_PENDING_OPERATIONS = 50;
const MAX_PAINT_TIMES = 30;

// Add these constants
const MUTATION_BATCH = {
  WINDOW: 100,  // Batch mutations within 100ms window
  MAX_DELAY: 500, // Maximum time to wait before processing
} as const;

// Add near other state variables
let mutationTimeout: number | null = null;

// Add max limits to prevent memory leaks
const MAX_BUFFER_SIZE = 1000;
const MAX_PENDING_OPS = 100;

// Cache DOM queries
let lastQueryTime = 0;
const QUERY_CACHE_DURATION = 100; // ms

// Add visual dimensions storage
const VISUAL_STORAGE_KEY = 'react-scan-graph-dimensions';

// Function to save visual dimensions
const saveVisualDimensions = (width: number, height: number) => {
  try {
    localStorage.setItem(VISUAL_STORAGE_KEY, JSON.stringify({ width, height }));
  } catch (e) {
    console.warn('Failed to save graph dimensions:', e);
  }
};

// Function to load visual dimensions
const loadVisualDimensions = () => {
  try {
    const saved = localStorage.getItem(VISUAL_STORAGE_KEY);
    if (saved) {
      const { width, height } = JSON.parse(saved);
      return {
        width: Math.max(VISUAL.CANVAS.MIN_WIDTH, width),
        height: Math.max(VISUAL.CANVAS.MIN_HEIGHT, height)
      };
    }
  } catch (e) {
    console.warn('Failed to load graph dimensions:', e);
  }
  return {
    width: VISUAL.CANVAS.MIN_WIDTH,
    height: VISUAL.CANVAS.MIN_HEIGHT
  };
};

// Utility functions
const savePosition = (x: number, y: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch (e) {
    console.warn('Failed to save graph position:', e);
  }
};

const loadPosition = (canvasWidth: number, canvasHeight: number): { x: number, y: number } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { x, y } = JSON.parse(saved);
      return {
        x: Math.min(Math.max(0, x), window.innerWidth - canvasWidth),
        y: Math.min(Math.max(0, y), window.innerHeight - canvasHeight)
      };
    }
  } catch (e) {
    console.warn('Failed to load graph position:', e);
  }
  return {
    x: 16,
    y: window.innerHeight - canvasHeight - 16
  };
};

// Canvas initialization
const canvas = document.createElement("canvas");
canvas.id = "react-scan-graph";

// Add near other state variables at the top
let currentDimensions = {
  width: VISUAL.CANVAS.MIN_WIDTH,
  height: VISUAL.CANVAS.MIN_HEIGHT
};

// Initialize with loaded dimensions
const initialDimensions = loadVisualDimensions();
currentDimensions = {
  width: initialDimensions.width,
  height: initialDimensions.height
};

canvas.width = currentDimensions.width;
canvas.height = currentDimensions.height;
canvas.style.width = `${currentDimensions.width}px`;
canvas.style.height = `${currentDimensions.height}px`;

// Load initial position after canvas creation
const savedPosition = loadPosition(canvas.width, canvas.height);
initialX = savedPosition.x;
initialY = savedPosition.y;

// Set canvas position and styles
canvas.style.position = "fixed";
canvas.style.top = `${initialY}px`;
canvas.style.left = `${initialX}px`;
canvas.style.borderRadius = "8px";
canvas.style.backgroundColor = VISUAL.STYLE.COLORS.BACKGROUND;
canvas.style.boxShadow = "0 0 50px rgba(185, 117, 249, 0.15)";
canvas.style.border = "1px solid rgba(185, 117, 249, 0.4)";
canvas.style.zIndex = "2147483646";
canvas.style.cursor = "move";
canvas.style.opacity = "0";
canvas.style.transition = "opacity 0.5s ease";

// Add fade-in effect
setTimeout(() => {
  canvas.style.opacity = "1";
}, 100);

// Ensure document.documentElement exists before appending
if (document.documentElement) {
  document.documentElement.appendChild(canvas);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.appendChild(canvas);
  });
}

const ctx = canvas.getContext("2d")!;
ctx.font = `11px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace`;

// Create gradient
const backgroundGradient = (() => {
  const gradient = ctx.createLinearGradient(0, 0, 0, VISUAL.CANVAS.MIN_HEIGHT);
  gradient.addColorStop(0, "rgba(185, 117, 249, 0.15)");
  gradient.addColorStop(1, "rgba(185, 117, 249, 0)");
  return gradient;
})();

// Optimize gradient creation
const createGradients = () => {
  const lineGradient = ctx.createLinearGradient(0, 0, 0, VISUAL.CANVAS.MIN_HEIGHT);
  lineGradient.addColorStop(0, VISUAL.STYLE.COLORS.LINE);
  lineGradient.addColorStop(1, "rgba(185, 117, 249, 0.6)");
  return { lineGradient };
};

const { lineGradient } = createGradients();

// Add path caching
let cachedLinePath: Path2D | null = null;
let shouldUpdatePath = true;

// Optimize line drawing with path caching
const updateLinePath = () => {
  if (!shouldUpdatePath) return;

  const path = new Path2D();
  path.moveTo(currentDimensions.width / 2, currentY);

  positionHistory.forEach((point, i) => {
    const x = currentDimensions.width / 2 - (i * ANIMATION.GRID.SPEED);
    if (x < 0) return;
    path.lineTo(x, point.y);
  });

  cachedLinePath = path;
  shouldUpdatePath = false;
};

// Drawing functions
const drawGrid = () => {
  ctx.strokeStyle = VISUAL.STYLE.COLORS.GRID;
  ctx.lineWidth = 1;
  ctx.setLineDash([1, 2]);

  for (let x = currentDimensions.width + (gridOffset % ANIMATION.GRID.SIZE); x >= 0; x -= ANIMATION.GRID.SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, currentDimensions.height);
    ctx.stroke();
  }

  for (let y = 0; y <= currentDimensions.height; y += ANIMATION.GRID.SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(currentDimensions.width, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
};

// Add these constants
const FRAME_SAMPLE_SIZE = 60; // 1 second worth of frames at 60fps
const MAX_FPS = 60;

// Add helper function near other utility functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Update drawStats function
const drawStats = () => {
  const LEFT_MARGIN = 18;
  const TOP_MARGIN = 32;
  const LINE_SPACING = 24;

  ctx.shadowBlur = 0;
  ctx.font = `400 13px Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

  // Elements count with formatting
  ctx.fillText(`Total DOM Elements: ${formatNumber(lastElementCount)}`, LEFT_MARGIN, TOP_MARGIN);

  // Frame time and FPS
  const avgFrameTime = paintTimes.length > 0
    ? paintTimes.reduce((sum, time) => sum + time, 0) / paintTimes.length
    : 16.67;
  const fps = Math.round(1000 / avgFrameTime);
  const clampedFps = Math.min(60, Math.max(0, fps));
  const roundedTime = Math.round(avgFrameTime * 100) / 100;
  ctx.fillText(`Frame Time: ${roundedTime}ms (${clampedFps} FPS)`, LEFT_MARGIN, TOP_MARGIN + LINE_SPACING);

  // Text length counter with formatting
  const textLength = Array.from(document.documentElement.querySelectorAll('*'))
    .reduce((sum, el) => sum + (el.textContent?.length || 0), 0);
  ctx.fillText(`Characters: ${formatNumber(textLength)}`, LEFT_MARGIN, currentDimensions.height - LINE_SPACING);

  // Calculate averages
  const avgMetrics = performanceMetrics.length > 0
    ? {
      lastLCP: performanceMetrics[performanceMetrics.length - 1]?.lastLCP || 0,
      lastCLS: performanceMetrics[performanceMetrics.length - 1]?.lastCLS || 0,
      lastINP: performanceMetrics[performanceMetrics.length - 1]?.lastINP || 0,
      script: performanceMetrics[performanceMetrics.length - 1]?.script || 0,
    }
    : { lastLCP: 0, lastCLS: 0, lastINP: 0, script: 0 };

  // Show performance metrics
  const latestMetrics = performanceMetrics[performanceMetrics.length - 1];
  ctx.fillText(
    `LCP: ${formatMetric(latestMetrics?.lastLCP)}  CLS: ${formatMetric(latestMetrics?.lastCLS)}  INP: ${formatMetric(latestMetrics?.lastINP)}`,
    LEFT_MARGIN,
    currentDimensions.height - LINE_SPACING * 2
  );
};

const drawStatusDot = () => {
  ctx.save();
  ctx.beginPath();
  ctx.shadowBlur = scrollState.minimalMode ? 0 : 15;
  ctx.shadowColor = VISUAL.STYLE.COLORS.STATUS.ACTIVE;
  ctx.fillStyle = scrollState.minimalMode ? VISUAL.STYLE.COLORS.STATUS.INACTIVE : VISUAL.STYLE.COLORS.STATUS.ACTIVE;
  ctx.arc(
    currentDimensions.width - VISUAL.STYLE.DOT.MARGIN,
    VISUAL.STYLE.DOT.MARGIN,
    VISUAL.STYLE.DOT.RADIUS,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
};

// Update the position history handling
const updatePositionHistory = () => {
  // Always add a new point, even without DOM changes
  positionHistory.unshift({
    x: currentDimensions.width / 2,
    y: currentY,
    operationType: currentOperation
  });

  // Remove points that are off-screen
  if (positionHistory.length > MAX_HISTORY) {
    positionHistory.pop();
  }

  shouldUpdatePath = true;
};

// Update drawLines function
const drawLines = () => {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = lineGradient;
  ctx.shadowColor = VISUAL.STYLE.COLORS.GLOW;
  ctx.shadowBlur = 15;

  // Draw the main line
  updateLinePath();
  if (cachedLinePath) {
    ctx.translate(-(performance.now() % ANIMATION.LINE.SPEED), 0);
    ctx.stroke(cachedLinePath);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.fillStyle = VISUAL.STYLE.COLORS.LINE;
  ctx.shadowColor = VISUAL.STYLE.COLORS.GLOW;
  ctx.shadowBlur = 15;
  ctx.arc(currentDimensions.width / 2, currentY, 3, 0, Math.PI * 2);
  ctx.fill();
};

// Simplify drawChart to maintain constant animation
const drawChart = () => {
  performance.mark('frame-start');
  if (!ctx) return;

  // Request next frame first
  const now = performance.now();
  const actualFrameTime = now - lastFrameTime;

  // Track real frame time
  if (actualFrameTime > 0) {  // Only track valid frame times
    paintTimes.push(actualFrameTime);
    if (paintTimes.length > 30) {
      paintTimes.shift();
    }
  }

  lastFrameTime = now;
  rafId = requestAnimationFrame(drawChart);

  // Skip if too soon
  if (actualFrameTime < 16) return;

  // Drawing operations
  ctx.save();


  ctx.clearRect(0, 0, currentDimensions.width, currentDimensions.height);
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, currentDimensions.width, currentDimensions.height);

  drawGrid();
  gridOffset -= ANIMATION.GRID.SPEED;

  const ease = currentOperation ? ANIMATION.EASE.OPERATION
    : targetY === currentDimensions.height / 2 ? ANIMATION.EASE.RETURN
      : ANIMATION.EASE.IDLE;
  const distance = targetY - currentY;
  currentY += distance * ease;

  updatePositionHistory();
  drawLines();
  drawStats();
  drawStatusDot();
  ctx.restore();

  performance.measure('frame', 'frame-start');
};

// Simplify scroll handler
const handleScroll = () => {
  if (scrollState.timer !== null) {
    clearTimeout(scrollState.timer);
  }

  scrollState.minimalMode = true;

  scrollState.timer = window.setTimeout(() => {
    scrollState.minimalMode = false;
    if (scrollState.mutationBuffer.length > 0) {
      processMutationBatch(scrollState.mutationBuffer);
      scrollState.mutationBuffer = [];
    }
  }, 150);
};

// DOM observation
const countElements = () => {
  const now = performance.now();
  if (now - lastQueryTime < QUERY_CACHE_DURATION) {
    return lastElementCount;
  }
  lastQueryTime = now;
  try {
    const elements = document.documentElement.querySelectorAll('*');
    let count = 0;

    elements.forEach(el => {
      if (el.nodeType === Node.ELEMENT_NODE && !isExcluded(el)) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.warn('Error counting elements:', error);
    return lastElementCount; // Return last known count on error
  }
};

const initializeElementCount = () => {
  if (document.documentElement) {
    lastElementCount = countElements();
  }
};

// Update processNextOperation to handle batches better
const processNextOperation = () => {
  if (pendingOperations.length === 0 || isAnimating) return;

  isAnimating = true;
  const operation = pendingOperations.shift()!;
  currentOperation = operation.type;

  // Calculate height with better scaling and bounds
  const maxAllowedHeight = currentDimensions.height / 2 - 16; // Leave margin
  const baseHeight = Math.min(
    maxAllowedHeight,
    Math.log(operation.count + 1) * ANIMATION.SPIKE.MULTIPLIER * 8
  );

  const spikeHeight = Math.max(
    ANIMATION.SPIKE.MIN_HEIGHT,
    Math.min(maxAllowedHeight, baseHeight)
  );

  // Set position relative to canvas center
  const centerY = currentDimensions.height / 2;
  currentY = operation.type === 'add'
    ? centerY - spikeHeight
    : centerY + spikeHeight;
  targetY = currentY;

  // Record position
  updatePositionHistory();

  // Reset after fixed duration
  setTimeout(() => {
    currentOperation = null;
    currentY = currentDimensions.height / 2;
    targetY = currentY;
    updatePositionHistory();

    setTimeout(() => {
      isAnimating = false;
      if (pendingOperations.length > 0) {
        processNextOperation();
      }
    }, 16); // Minimal delay between operations
  }, 32); // Short duration for each spike
};

// Event handlers
const handleDragStart = (e: MouseEvent) => {
  isDragging = true;
  dragStartX = e.clientX - initialX;
  dragStartY = e.clientY - initialY;
  canvas.style.transition = 'none';
};

const handleDragMove = (e: MouseEvent) => {
  if (!isDragging) return;

  const newX = Math.max(0, Math.min(window.innerWidth - canvas.width, e.clientX - dragStartX));
  const newY = Math.max(0, Math.min(window.innerHeight - canvas.height, e.clientY - dragStartY));

  canvas.style.left = `${newX}px`;
  canvas.style.top = `${newY}px`;
  initialX = newX;
  initialY = newY;

  // Save position immediately during drag
  savePosition(newX, newY);
};

const handleDragEnd = () => {
  isDragging = false;
  canvas.style.transition = 'box-shadow 0.3s ease';
  savePosition(initialX, initialY);
};

const handleResize = () => {
  // Calculate new dimensions
  const maxWidth = Math.floor(window.innerWidth * VISUAL.CANVAS.WIDTH_RATIO);
  const maxHeight = Math.floor(window.innerHeight * VISUAL.CANVAS.HEIGHT_RATIO);

  currentDimensions = {
    width: Math.max(VISUAL.CANVAS.MIN_WIDTH, maxWidth),
    height: Math.max(VISUAL.CANVAS.MIN_HEIGHT, maxHeight)
  };

  // Update canvas
  canvas.width = currentDimensions.width;
  canvas.height = currentDimensions.height;
  canvas.style.width = `${currentDimensions.width}px`;
  canvas.style.height = `${currentDimensions.height}px`;

  // Update history size based on actual width
  MAX_HISTORY = Math.floor(currentDimensions.width / ANIMATION.GRID.SPEED);

  // Clear and rebuild path cache
  cachedLinePath = null;
  shouldUpdatePath = true;

  // Calculate new position based on current position
  initialX = Math.min(initialX, window.innerWidth - currentDimensions.width);
  initialY = Math.min(initialY, window.innerHeight - currentDimensions.height);

  // Update canvas position
  canvas.style.left = `${initialX}px`;
  canvas.style.top = `${initialY}px`;

  // Save new position immediately
  savePosition(initialX, initialY);

  // Recreate gradients with new dimensions
  const gradient = ctx.createLinearGradient(0, 0, 0, currentDimensions.height);
  gradient.addColorStop(0, "rgba(185, 117, 249, 0.15)");
  gradient.addColorStop(1, "rgba(185, 117, 249, 0)");
  Object.assign(backgroundGradient, gradient);

  const { lineGradient: newLineGradient } = createGradients();
  Object.assign(lineGradient, newLineGradient);

  // Force a full redraw
  shouldUpdatePath = true;
  drawChart();
};

// Event listeners
canvas.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);
window.addEventListener('resize', handleResize);

// Initialize observers
const mutationObserver = new MutationObserver((mutations) => {
  if (scrollState.minimalMode) {
    scrollState.mutationBuffer.push(...mutations);
    return;
  }

  if (mutationTimeout) clearTimeout(mutationTimeout);
  mutationTimeout = window.setTimeout(() => {
    processMutationBatch(mutations);
  }, MUTATION_DEBOUNCE);
});

// Clean up on window events
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', handleResize);

// Update initialization order
const initializeGraph = () => {
  // Create and setup canvas first
  if (document.documentElement) {
    document.documentElement.appendChild(canvas);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.appendChild(canvas);
    });
  }

  // Start animation
  rafId = requestAnimationFrame(drawChart);

  // Delay observer initialization to avoid initial DOM noise
  setTimeout(() => {
    // Get initial count before starting observation
    lastElementCount = countElements();

    // Start observing after getting initial count
    if (document.documentElement) {
      mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: true,
        characterDataOldValue: true
      });
    }
  }, 10); // Give the page time to settle
};

// Clear any existing initialization
if (rafId !== null) {
  cancelAnimationFrame(rafId);
}

// Update processMutationBatch function
const processMutationBatch = (mutations: MutationRecord[]) => {
  if (isTracking) return;
  isTracking = true;

  try {
    const now = performance.now();
    performance.mark('mutation-start');

    // Process mutations...
    let changes = {
      elementsRemoved: 0,
      elementsAdded: 0,
      hasInnerHTMLClear: false,
      hasInnerHTMLAdd: false,
      textChanges: 0
    };

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        const target = mutation.target as Element;
        const removedNodes = Array.from(mutation.removedNodes)
          .filter(node => node.nodeType === Node.ELEMENT_NODE && !isExcluded(node as Element));
        const addedNodes = Array.from(mutation.addedNodes)
          .filter(node => node.nodeType === Node.ELEMENT_NODE && !isExcluded(node as Element));

        // Check for innerHTML clear
        if (removedNodes.length > 0 && target.childNodes.length === 0) {
          changes.hasInnerHTMLClear = true;
        }
        // Check for innerHTML add
        else if (addedNodes.length > 0 && mutation.previousSibling === null && mutation.nextSibling === null) {
          changes.hasInnerHTMLAdd = true;
        }

        changes.elementsRemoved += removedNodes.length;
        changes.elementsAdded += addedNodes.length;
      }
      else if (mutation.type === 'characterData') {
        const oldText = mutation.oldValue || '';
        const newText = mutation.target.textContent || '';

        if (oldText.trim() !== newText.trim()) {
          // Compare lengths to determine if characters were added or removed
          if (newText.length > oldText.length) {
            // Characters were added
            pendingOperations.push({
              type: 'add',
              count: 1, // Small spike for text addition
              timestamp: now
            });
          } else if (newText.length < oldText.length) {
            // Characters were removed
            pendingOperations.push({
              type: 'remove',
              count: 1, // Small spike for text removal
              timestamp: now
            });
          }
        }
      }
    });

    // Create operations in sequence
    if (changes.hasInnerHTMLClear || changes.elementsRemoved > 0) {
      pendingOperations.push({
        type: 'remove',
        count: changes.elementsRemoved,
        timestamp: now
      });
    }

    // Add text changes as small spikes
    if (changes.textChanges > 0) {
      pendingOperations.push({
        type: 'add',
        count: 1, // Use minimum height for text
        timestamp: now
      });
    }

    if (changes.hasInnerHTMLAdd || changes.elementsAdded > 0) {
      pendingOperations.push({
        type: 'add',
        count: changes.elementsAdded,
        timestamp: now
      });
    }

    if (!isAnimating && pendingOperations.length > 0) {
      processNextOperation();
    }

    lastElementCount = countElements();

    // Measure performance after DOM changes
    performance.mark('mutation-end');
    const measure = performance.measure('mutation', 'mutation-start', 'mutation-end');

    // Create new metrics while preserving web vitals
    const metrics: PerformanceMetrics = {
      lastLCP: maxMetrics.lastLCP,  // Preserve LCP
      lastCLS: maxMetrics.lastCLS,  // Preserve CLS
      lastINP: maxMetrics.lastINP,  // Preserve INP
      script: measure.duration
    };

    // Add metrics only if there were actual DOM changes
    if (changes.elementsAdded > 0 || changes.elementsRemoved > 0 || changes.textChanges > 0) {
      performanceMetrics[0] = metrics;  // Update instead of push
    }
  } finally {
    isTracking = false;
    performance.clearMarks();
    performance.clearMeasures();
  }
};

// Start fresh
initializeGraph();

const cleanup = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  mutationObserver.disconnect();
  resizeObserver.disconnect();
  if (scrollState.timer) {
    clearTimeout(scrollState.timer);
    scrollState.timer = null;
  }
  if (mutationTimeout) {
    clearTimeout(mutationTimeout);
    mutationTimeout = null;
  }
  canvas.remove();

  // Reset all state
  positionHistory.length = 0;
  paintTimes.length = 0;
  pendingOperations.length = 0;
  lcpObserver.disconnect();
  clsObserver.disconnect();
  inpObserver.disconnect();
};

window.addEventListener('unload', cleanup);

// Add resize observer for more reliable size updates
const resizeObserver = new ResizeObserver(() => {
  handleResize();
});
resizeObserver.observe(document.documentElement);

const formatMetric = (value: number | null): string => {
  if (value === null || isNaN(value)) return '---';

  // Ensure value is a valid number
  const numValue = Number(value);

  if (numValue < 0.01) return '< 0.01';

  // LCP: show in seconds with 2 decimals
  if (numValue > 1000) return `${(numValue / 1000).toFixed(2)}s`;

  // CLS: show up to 3 decimals
  if (numValue < 1) return numValue.toFixed(3);

  // INP: show in ms without decimals
  return `${Math.round(numValue)}ms`;
};

// Initialize metrics array with initial state
performanceMetrics[0] = {
  lastLCP: null,
  lastCLS: 0,
  lastINP: null,
  script: 0
};
