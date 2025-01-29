import type { ActiveOutline, OutlineData } from './types';

export const OUTLINE_ARRAY_SIZE = 7;
export const MONO_FONT =
  'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace';

export const INTERPOLATION_SPEED = 0.1;
export const lerp = (start: number, end: number) => {
  return Math.floor(start + (end - start) * INTERPOLATION_SPEED);
};

export const MAX_PARTS_LENGTH = 4;
export const MAX_LABEL_LENGTH = 40;
export const TOTAL_FRAMES = 45;

export const primaryColor = '115,97,230';
export const secondaryColor = '128,128,128';

function getLabelTextPart(
  partsEntries: [number, string[]][],
  partsLength: number,
  index: number,
): string {
  const [count, names] = partsEntries[index];
  let part = `${names.slice(0, MAX_PARTS_LENGTH).join(', ')} ×${count}`;
  if (part.length > MAX_LABEL_LENGTH) {
    part = `${part.slice(0, MAX_LABEL_LENGTH)}…`;
  }
  if (index !== partsLength - 1) {
    part += ', ';
  }
  return part;
}

export const getLabelText = (outlines: ActiveOutline[]): string => {
  const nameByCount = new Map<string, number>();
  for (const { name, count } of outlines) {
    nameByCount.set(name, (nameByCount.get(name) || 0) + count);
  }

  const countByNames = new Map<number, string[]>();
  for (const [name, count] of nameByCount.entries()) {
    const names = countByNames.get(count);
    if (names) {
      names.push(name);
    } else {
      countByNames.set(count, [name]);
    }
  }

  // TODO(Alexis): Optimize
  const partsEntries = Array.from(countByNames.entries()).sort(
    ([countA], [countB]) => countB - countA,
  );
  const partsLength = partsEntries.length;
  let labelText = getLabelTextPart(partsEntries, partsLength, 0);
  for (let i = 1; i < partsLength; i++) {
    labelText += getLabelTextPart(partsEntries, partsLength, i);
  }

  if (labelText.length > MAX_LABEL_LENGTH) {
    return `${labelText.slice(0, MAX_LABEL_LENGTH)}…`;
  }

  return labelText;
};

export const getAreaFromOutlines = (outlines: ActiveOutline[]) => {
  let area = 0;
  for (const outline of outlines) {
    area += outline.width * outline.height;
  }
  return area;
};

export const updateOutlines = (
  activeOutlines: Map<string, ActiveOutline>,
  outlines: OutlineData[],
) => {
  for (const { id, name, count, x, y, width, height, didCommit } of outlines) {
    const outline: ActiveOutline = {
      id,
      name,
      count,
      x,
      y,
      width,
      height,
      frame: 0,
      targetX: x,
      targetY: y,
      targetWidth: width,
      targetHeight: height,
      didCommit,
    };
    const key = String(outline.id);

    const existingOutline = activeOutlines.get(key);
    if (existingOutline) {
      existingOutline.count++;
      existingOutline.frame = 0;
      existingOutline.targetX = x;
      existingOutline.targetY = y;
      existingOutline.targetWidth = width;
      existingOutline.targetHeight = height;
      existingOutline.didCommit = didCommit;
    } else {
      activeOutlines.set(key, outline);
    }
  }
};

export const updateScroll = (
  activeOutlines: Map<string, ActiveOutline>,
  deltaX: number,
  deltaY: number,
) => {
  for (const outline of activeOutlines.values()) {
    const newX = outline.x - deltaX;
    const newY = outline.y - deltaY;
    outline.targetX = newX;
    outline.targetY = newY;
  }
};

export const initCanvas = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  dpr: number,
) => {
  const ctx = canvas.getContext('2d', { alpha: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
};

export const drawCanvas = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  dpr: number,
  activeOutlines: Map<string, ActiveOutline>,
) => {
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  const groupedOutlinesMap = new Map<string, ActiveOutline[]>();
  const rectMap = new Map<
    string,
    {
      x: number;
      y: number;
      width: number;
      height: number;
      alpha: number;
    }
  >();

  for (const outline of activeOutlines.values()) {
    const {
      x,
      y,
      width,
      height,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
      frame,
    } = outline;
    if (targetX !== x) {
      outline.x = lerp(x, targetX);
    }
    if (targetY !== y) {
      outline.y = lerp(y, targetY);
    }

    if (targetWidth !== width) {
      outline.width = lerp(width, targetWidth);
    }
    if (targetHeight !== height) {
      outline.height = lerp(height, targetHeight);
    }

    const labelKey = `${targetX ?? x},${targetY ?? y}`;
    const rectKey = `${labelKey},${targetWidth ?? width},${targetHeight ?? height}`;

    const outlines = groupedOutlinesMap.get(labelKey);
    if (outlines) {
      outlines.push(outline);
    } else {
      groupedOutlinesMap.set(labelKey, [outline]);
    }

    const alpha = 1 - frame / TOTAL_FRAMES;
    outline.frame++;

    const rect = rectMap.get(rectKey) || {
      x,
      y,
      width,
      height,
      alpha,
    };
    if (alpha > rect.alpha) {
      rect.alpha = alpha;
    }
    rectMap.set(rectKey, rect);
  }

  for (const { x, y, width, height, alpha } of rectMap.values()) {
    ctx.strokeStyle = `rgba(${primaryColor},${alpha})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.fillStyle = `rgba(${primaryColor},${alpha * 0.1})`;
    ctx.fill();
  }

  ctx.font = `11px ${MONO_FONT}`;

  const labelMap = new Map<
    string,
    {
      text: string;
      width: number;
      height: number;
      alpha: number;
      x: number;
      y: number;
      outlines: ActiveOutline[];
    }
  >();

  ctx.textRendering = 'optimizeSpeed';

  // TODO(Alexis): optimizable?
  for (const outlines of groupedOutlinesMap.values()) {
    const first = outlines[0];
    const { x, y, frame } = first;
    const alpha = 1 - frame / TOTAL_FRAMES;
    const text = getLabelText(outlines);
    const { width } = ctx.measureText(text);
    const height = 11;
    labelMap.set(`${x},${y},${width},${text}`, {
      text,
      width,
      height,
      alpha,
      x,
      y,
      outlines,
    });

    let labelY: number = y - height - 4;

    if (labelY < 0) {
      labelY = 0;
    }

    if (frame > TOTAL_FRAMES) {
      for (const outline of outlines) {
        activeOutlines.delete(String(outline.id));
      }
    }
  }

  // TODO(Alexis): optimize
  const sortedLabels = Array.from(labelMap.entries()).sort(
    ([_, a], [__, b]) => {
      return getAreaFromOutlines(b.outlines) - getAreaFromOutlines(a.outlines);
    },
  );

  for (const [labelKey, label] of sortedLabels) {
    if (!labelMap.has(labelKey)) continue;

    for (const [otherKey, otherLabel] of labelMap.entries()) {
      if (labelKey === otherKey) continue;

      const { x, y, width, height } = label;
      const {
        x: otherX,
        y: otherY,
        width: otherWidth,
        height: otherHeight,
      } = otherLabel;

      if (
        x + width > otherX &&
        otherX + otherWidth > x &&
        y + height > otherY &&
        otherY + otherHeight > y
      ) {
        label.text = getLabelText(label.outlines.concat(otherLabel.outlines));
        label.width = ctx.measureText(label.text).width;
        labelMap.delete(otherKey);
      }
    }
  }

  for (const label of labelMap.values()) {
    const { x, y, alpha, width, height, text } = label;

    let labelY: number = y - height - 4;

    if (labelY < 0) {
      labelY = 0;
    }

    ctx.fillStyle = `rgba(${primaryColor},${alpha})`;
    ctx.fillRect(x, labelY, width + 4, height + 4);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(text, x + 2, labelY + height);
  }

  return activeOutlines.size > 0;
};
