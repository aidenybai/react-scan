import { type Fiber, getDisplayName, getTimings, traverseFiber } from "bippy";
import { ReactScanInternals } from "../../../core/index";
import {
  getFiberFromElement,
  getParentCompositeFiber,
  isPromise,
} from "../../../core/inspection/fiber";
import type { MinimalFiberInfo } from "./states";

export {
  getChangedPropsDetailed,
  getFiberFromElement,
  getParentCompositeFiber,
  isPromise,
} from "../../../core/inspection/fiber";
export type { States } from "../../../core/inspection/types";

const getFirstStateNode = (fiber: Fiber): Element | null => {
  let current: Fiber | null = fiber;
  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode;
    }

    if (!current.child) {
      break;
    }
    current = current.child;
  }

  while (current) {
    if (current.stateNode instanceof Element) {
      return current.stateNode;
    }

    if (!current.return) {
      break;
    }
    current = current.return;
  }
  return null;
};

const getNearestFiberFromElement = (element: Element | null): Fiber | null => {
  if (!element) return null;

  try {
    const fiber = getFiberFromElement(element);
    if (!fiber) return null;

    const res = getParentCompositeFiber(fiber);
    return res ? res[0] : null;
  } catch {
    return null;
  }
};

const isFiberInTree = (fiber: Fiber, root: Fiber): boolean => {
  {
    // const root= fiberRootCache.get(fiber) || (fiber.alternate && fiberRootCache.get(fiber.alternate) )
    // if (root){
    //   return root
    // }
    const res = !!traverseFiber(root, (searchFiber) => searchFiber === fiber);

    return res;
  }
};

export const getAssociatedFiberRect = async (element: Element) => {
  const associatedFiber = getNearestFiberFromElement(element);

  if (!associatedFiber) return null;
  const stateNode = getFirstStateNode(associatedFiber);
  if (!stateNode) return null;

  const rect = await new Promise<DOMRect | null>((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      resolve(entries[0]?.boundingClientRect ?? null);
    });
    observer.observe(stateNode);
  });
  return rect;
};

// todo-before-stable(rob): refactor these
export const getCompositeComponentFromElement = (element: Element) => {
  const associatedFiber = getNearestFiberFromElement(element);

  if (!associatedFiber) return {};

  const stateNode = getFirstStateNode(associatedFiber);
  if (!stateNode) return {};
  const parentCompositeFiberInfo = getParentCompositeFiber(associatedFiber);
  if (!parentCompositeFiberInfo) {
    return {};
  }
  const [parentCompositeFiber] = parentCompositeFiberInfo;

  return {
    parentCompositeFiber,
  };
};

export const getCompositeFiberFromElement = (element: Element, knownFiber?: Fiber) => {
  if (!element.isConnected) return {};

  let fiber = knownFiber ?? getNearestFiberFromElement(element);
  if (!fiber) return {};

  // Find root once and cache it
  let curr: Fiber | null = fiber;
  let rootFiber: Fiber | null = null;
  let currentRootFiber: Fiber | null = null;

  while (curr) {
    if (!curr.stateNode) {
      curr = curr.return;
      continue;
    }
    if (ReactScanInternals.instrumentation?.fiberRoots.has(curr.stateNode)) {
      rootFiber = curr;
      currentRootFiber = curr.stateNode.current;
      break;
    }
    curr = curr.return;
  }

  if (!rootFiber || !currentRootFiber) return {};

  // Get the current associated fiber using cached root
  fiber = isFiberInTree(fiber, currentRootFiber) ? fiber : (fiber.alternate ?? fiber);
  if (!fiber) return {};

  if (!getFirstStateNode(fiber)) return {};

  // Get parent composite fiber
  const parentCompositeFiber = getParentCompositeFiber(fiber)?.[0];
  if (!parentCompositeFiber) return {};

  // Use cached root to check parent fiber
  return {
    parentCompositeFiber: isFiberInTree(parentCompositeFiber, currentRootFiber)
      ? parentCompositeFiber
      : (parentCompositeFiber.alternate ?? parentCompositeFiber),
  };
};

export const nonVisualTags = new Set([
  "HTML",
  "HEAD",
  "META",
  "TITLE",
  "BASE",
  "SCRIPT",
  "SCRIPT",
  "STYLE",
  "LINK",
  "NOSCRIPT",
  "SOURCE",
  "TRACK",
  "EMBED",
  "OBJECT",
  "PARAM",
  "TEMPLATE",
  "PORTAL",
  "SLOT",
  "AREA",
  "XML",
  "DOCTYPE",
  "COMMENT",
]);

export const findComponentDOMNode = (
  fiber: Fiber,
  excludeNonVisualTags = true,
): HTMLElement | null => {
  if (fiber.stateNode && "nodeType" in fiber.stateNode) {
    const element = fiber.stateNode as HTMLElement;
    if (excludeNonVisualTags && element.tagName && nonVisualTags.has(element.tagName)) {
      return null;
    }
    return element;
  }

  let child = fiber.child;
  while (child) {
    const result = findComponentDOMNode(child, excludeNonVisualTags);
    if (result) return result;
    child = child.sibling;
  }

  return null;
};

export interface InspectableElement {
  element: HTMLElement;
  depth: number;
  name: string;
  fiber: Fiber;
}

export const getInspectableElements = (
  root: HTMLElement = document.body,
): Array<InspectableElement> => {
  const result: Array<InspectableElement> = [];

  const findInspectableFiber = (element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;

    const { parentCompositeFiber } = getCompositeComponentFromElement(element);
    if (!parentCompositeFiber) return null;

    const componentRoot = findComponentDOMNode(parentCompositeFiber);
    return componentRoot === element ? element : null;
  };

  const traverse = (element: HTMLElement, depth = 0) => {
    const inspectable = findInspectableFiber(element);
    if (inspectable) {
      const { parentCompositeFiber } = getCompositeComponentFromElement(inspectable);

      if (!parentCompositeFiber) return;

      result.push({
        element: inspectable,
        depth,
        name: getDisplayName(parentCompositeFiber.type) ?? "Unknown",
        fiber: parentCompositeFiber,
      });
    }

    // Traverse children first (depth-first)
    for (const child of Array.from(element.children)) {
      traverse(child as HTMLElement, inspectable ? depth + 1 : depth);
    }
  };

  traverse(root);
  return result;
};

type DiffResult = {
  type: "primitive" | "reference" | "object";
  changes: Array<{
    path: string[];
    prevValue: unknown;
    currentValue: unknown;
    sameFunction?: boolean;
  }>;
  hasDeepChanges: boolean;
};

type DiffChange = {
  path: string[];
  prevValue: unknown;
  currentValue: unknown;
  sameFunction?: boolean;
};

export type AggregatedChanges = {
  count: number;
  // unstable: boolean;
  currentValue: unknown;
  previousValue: unknown;
  // displayName?:string
  name: string;
};

export const formatForClipboard = (value: unknown): string => {
  try {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (isPromise(value)) return "Promise";

    if (typeof value === "function") {
      const fnStr = value.toString();
      try {
        const formatted = fnStr
          .replace(/\s+/g, " ") // Normalize whitespace
          .replace(/{\s+/g, "{\n  ") // Add newline after {
          .replace(/;\s+/g, ";\n  ") // Add newline after ;
          .replace(/}\s*$/g, "\n}") // Add newline before final }
          .replace(/\(\s+/g, "(") // Remove space after (
          .replace(/\s+\)/g, ")") // Remove space before )
          .replace(/,\s+/g, ", "); // Normalize comma spacing

        return formatted;
      } catch {
        return fnStr;
      }
    }

    switch (true) {
      case value instanceof Date:
        return value.toISOString();
      case value instanceof RegExp:
        return value.toString();
      case value instanceof Error:
        return `${value.name}: ${value.message}`;
      case value instanceof Map:
        return JSON.stringify(Array.from(value.entries()), null, 2);
      case value instanceof Set:
        return JSON.stringify(Array.from(value), null, 2);
      case value instanceof DataView:
        return JSON.stringify(Array.from(new Uint8Array(value.buffer)), null, 2);
      case value instanceof ArrayBuffer:
        return JSON.stringify(Array.from(new Uint8Array(value)), null, 2);
      case ArrayBuffer.isView(value) && "length" in value:
        return JSON.stringify(Array.from(value as unknown as ArrayLike<number>), null, 2);
      case Array.isArray(value):
        return JSON.stringify(value, null, 2);
      case typeof value === "object":
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  } catch {
    return String(value);
  }
};

const parseArrayValue = (value: string): Array<unknown> => {
  if (value.trim() === "[]") return [];

  const result: Array<unknown> = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
    }

    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    if (char === "[" || char === "{") {
      depth++;
      current += char;
      continue;
    }

    if (char === "]" || char === "}") {
      depth--;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      if (current.trim()) {
        result.push(parseValue(current.trim(), ""));
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(parseValue(current.trim(), ""));
  }

  return result;
};

const parseValue = (value: string, currentType: unknown): unknown => {
  try {
    switch (typeof currentType) {
      case "number":
        return Number(value);
      case "string":
        return value;
      case "boolean":
        return value === "true";
      case "bigint":
        return BigInt(value);
      case "undefined":
        return undefined;
      case "object": {
        if (!currentType) {
          return null;
        }

        if (Array.isArray(currentType)) {
          return parseArrayValue(value.slice(1, -1));
        }

        if (currentType instanceof RegExp) {
          try {
            const match = /^\/(?<pattern>.*)\/(?<flags>[gimuy]*)$/.exec(value);
            if (match?.groups) {
              return new RegExp(match.groups.pattern, match.groups.flags);
            }
            return new RegExp(value);
          } catch {
            return currentType;
          }
        }

        if (currentType instanceof Map) {
          const entries = value
            .slice(1, -1)
            .split(", ")
            .map((entry) => {
              const [key, val] = entry.split(" => ");
              return [parseValue(key, ""), parseValue(val, "")] as [unknown, unknown];
            });
          return new Map(entries);
        }

        if (currentType instanceof Set) {
          const values = value
            .slice(1, -1)
            .split(", ")
            .map((v) => parseValue(v, ""));
          return new Set(values);
        }
        const entries = value
          .slice(1, -1)
          .split(", ")
          .map((entry) => {
            const [key, val] = entry.split(": ");
            return [key, parseValue(val, "")];
          });
        return Object.fromEntries(entries);
      }
    }

    return value;
  } catch {
    return currentType;
  }
};

const areFunctionsEqual = (prev: unknown, current: unknown): boolean => {
  try {
    // Check if both values are actually functions
    if (typeof prev !== "function" || typeof current !== "function") {
      return false;
    }

    // Now we know both are functions, we can safely call toString()
    return prev.toString() === current.toString();
  } catch {
    return false;
  }
};

export const getObjectDiff = (
  prev: unknown,
  current: unknown,
  path: string[] = [],
  seen = new WeakSet(),
): DiffResult => {
  if (prev === current) {
    return { type: "primitive", changes: [], hasDeepChanges: false };
  }

  if (typeof prev === "function" && typeof current === "function") {
    const isSameFunction = areFunctionsEqual(prev, current);
    return {
      type: "primitive",
      changes: [
        {
          path,
          prevValue: prev,
          currentValue: current,
          sameFunction: isSameFunction,
        },
      ],
      hasDeepChanges: !isSameFunction,
    };
  }

  if (
    prev === null ||
    current === null ||
    prev === undefined ||
    current === undefined ||
    typeof prev !== "object" ||
    typeof current !== "object"
  ) {
    return {
      type: "primitive",
      changes: [{ path, prevValue: prev, currentValue: current }],
      hasDeepChanges: true,
    };
  }

  if (seen.has(prev) || seen.has(current)) {
    return {
      type: "object",
      changes: [{ path, prevValue: "[Circular]", currentValue: "[Circular]" }],
      hasDeepChanges: false,
    };
  }

  seen.add(prev);
  seen.add(current);

  const prevObj = prev as Record<string, unknown>;
  const currentObj = current as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(currentObj)]);
  const changes: Array<DiffChange> = [];
  let hasDeepChanges = false;

  for (const key of allKeys) {
    const prevValue = prevObj[key];
    const currentValue = currentObj[key];

    if (prevValue !== currentValue) {
      if (
        typeof prevValue === "object" &&
        typeof currentValue === "object" &&
        prevValue !== null &&
        currentValue !== null
      ) {
        const nestedDiff = getObjectDiff(prevValue, currentValue, [...path, key], seen);
        changes.push(...nestedDiff.changes);
        if (nestedDiff.hasDeepChanges) {
          hasDeepChanges = true;
        }
      } else {
        changes.push({
          path: [...path, key],
          prevValue,
          currentValue,
        });
        hasDeepChanges = true;
      }
    }
  }

  return {
    type: "object",
    changes,
    hasDeepChanges,
  };
};

export const formatPath = (path: string[]): string => {
  if (path.length === 0) return "";

  return path.reduce((acc, segment, i) => {
    // Check if segment is a number (array index)
    if (/^\d+$/.test(segment)) {
      return `${acc}[${segment}]`;
    }
    // Add dot separator only if not first segment and previous segment wasn't an array index
    return i === 0 ? segment : `${acc}.${segment}`;
  }, "");
};

function hackyJsFormatter(code: string) {
  //
  // 1) Collapse runs of whitespace to single spaces
  //
  const normalizedCode = code.replace(/\s+/g, " ").trim();

  //
  // 2) Tokenize
  //    We'll separate out:
  //    - parentheses: ( )
  //    - braces: { }
  //    - brackets: [ ]
  //    - angle brackets: < >
  //    - semicolon: ;
  //    - comma: ,
  //    - arrow =>
  //    - colon :
  //    - question mark ?
  //    - exclamation mark ! (for TS non-null etc.)
  //
  //    We'll also try to combine () or [] or {} or <> if they appear empty.
  //
  const rawTokens = [];
  let current = "";
  for (let i = 0; i < normalizedCode.length; i++) {
    const c = normalizedCode[i];

    // Detect arrow =>
    if (c === "=" && normalizedCode[i + 1] === ">") {
      if (current.trim()) rawTokens.push(current.trim());
      rawTokens.push("=>");
      current = "";
      i++;
      continue;
    }

    // Single/double char punctuation
    if (/[(){}[\];,<>:?!]/.test(c)) {
      // If we had something in current, push it
      if (current.trim()) {
        rawTokens.push(current.trim());
      }
      rawTokens.push(c);
      current = "";
    } else if (/\s/.test(c)) {
      // whitespace ends the current token
      if (current.trim()) {
        rawTokens.push(current.trim());
      }
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) {
    rawTokens.push(current.trim());
  }

  //
  // 3) Combine immediate pairs of empty brackets, e.g. '(' + ')' => '()'
  //    This helps keep arrow param empty parens on one line, etc.
  //
  const merged: Array<string> = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    const n = rawTokens[i + 1];
    if (
      (t === "(" && n === ")") ||
      (t === "[" && n === "]") ||
      (t === "{" && n === "}") ||
      (t === "<" && n === ">")
    ) {
      merged.push(t + n); // '()', '[]', '{}', '<>'
      i++;
    } else {
      merged.push(t);
    }
  }

  //
  // 4) We want to detect arrow param lists:
  //    i.e. "(" ... ")" immediately followed by "=>"
  //    so we can keep them on one line.
  //
  //    Also, detect generic param lists:
  //    i.e. identifier "<" ... ">" (then maybe "(" ) for function calls or type declarations
  //
  //    We'll store indexes in sets: arrowParamSet, genericSet
  //
  const arrowParamSet = new Set(); // indexes inside arrow param lists
  const genericSet = new Set(); // indexes inside generics <...>

  function findMatchingPair(openTok: string, closeTok: string, startIndex: number) {
    // e.g. openTok = '(', closeTok = ')'
    let depth = 0;
    for (let j = startIndex; j < merged.length; j++) {
      const token = merged[j];
      if (token === openTok) depth++;
      else if (token === closeTok) {
        depth--;
        if (depth === 0) return j;
      }
    }
    return -1;
  }

  // Detect arrow param sets
  for (let i = 0; i < merged.length; i++) {
    const t = merged[i];
    if (t === "(") {
      const closeIndex = findMatchingPair("(", ")", i);
      if (closeIndex !== -1 && merged[closeIndex + 1] === "=>") {
        // Mark all tokens from i..closeIndex as arrow param
        for (let k = i; k <= closeIndex; k++) {
          arrowParamSet.add(k);
        }
      }
    }
  }

  // Detect generics, e.g. foo<...> or MyType<...>
  // We do a naive approach: if we see something that looks like an identifier
  // followed immediately by '<', we assume it's a generic.
  for (let i = 1; i < merged.length; i++) {
    const prev = merged[i - 1];
    const t = merged[i];
    // If prev is an identifier and t is '<', find matching '>'
    if (/^[a-zA-Z0-9_$]+$/.test(prev) && t === "<") {
      const closeIndex = findMatchingPair("<", ">", i);
      if (closeIndex !== -1) {
        // Mark i..closeIndex as generic
        for (let k = i; k <= closeIndex; k++) {
          genericSet.add(k);
        }
      }
    }
  }

  //
  // 5) Build lines with indentation. We maintain a stack for open brackets.
  //
  let indentLevel = 0;
  const indentStr = "  "; // 2 spaces
  const lines: Array<string> = [];
  let line = "";

  function pushLine() {
    if (line.trim()) {
      lines.push(line.replace(/\s+$/, ""));
    }
    line = "";
  }
  function newLine() {
    pushLine();
    line = indentStr.repeat(indentLevel);
  }

  const stack: Array<string> = [];
  function stackTop() {
    return stack.length ? stack[stack.length - 1] : null;
  }

  function placeToken(tok: string, noSpaceBefore = false) {
    if (!line.trim()) {
      // line is empty aside from indentation
      line += tok;
    } else {
      if (noSpaceBefore || /^[),;:\].}>]$/.test(tok)) {
        line += tok;
      } else {
        line += ` ${tok}`;
      }
    }
  }

  for (let i = 0; i < merged.length; i++) {
    const tok = merged[i];
    const next = merged[i + 1] || "";

    // Open brackets
    if (["(", "{", "[", "<"].includes(tok)) {
      placeToken(tok);
      stack.push(tok);

      // If '{', definitely newline + indent
      if (tok === "{") {
        indentLevel++;
        newLine();
      } else if (tok === "(" || tok === "[" || tok === "<") {
        // If we are in arrowParamSet or genericSet, keep it on one line
        if ((arrowParamSet.has(i) && tok === "(") || (genericSet.has(i) && tok === "<")) {
          // Don't break lines after commas etc.
          // We won't do multiline logic for these.
        } else {
          // If next is not a direct close, go multiline
          const directClose = {
            "(": ")",
            "[": "]",
            "<": ">",
          }[tok];
          if (next !== directClose && next !== "()" && next !== "[]" && next !== "<>") {
            indentLevel++;
            newLine();
          }
        }
      }
    }

    // Close brackets
    else if ([")", "}", "]", ">"].includes(tok)) {
      // pop stack
      const opening = stackTop();
      if (
        (tok === ")" && opening === "(") ||
        (tok === "]" && opening === "[") ||
        (tok === ">" && opening === "<")
      ) {
        // if not arrowParamSet or genericSet, multiline
        if (!(arrowParamSet.has(i) && tok === ")") && !(genericSet.has(i) && tok === ">")) {
          indentLevel = Math.max(indentLevel - 1, 0);
          newLine();
        }
      } else if (tok === "}" && opening === "{") {
        indentLevel = Math.max(indentLevel - 1, 0);
        newLine();
      }
      stack.pop();
      placeToken(tok);
      if (tok === "}") {
        // break line after }
        newLine();
      }
    }

    // Combined empty pairs like '()', '[]', '{}', '<>'
    else if (/^\(\)|\[\]|\{\}|<>$/.test(tok)) {
      placeToken(tok);

      // Arrow =>
    } else if (tok === "=>") {
      placeToken(tok);
      // We'll let the next token (maybe '{') handle line breaks.

      // Semicolon
    } else if (tok === ";") {
      placeToken(tok, true);
      newLine();

      // Comma
    } else if (tok === ",") {
      placeToken(tok, true);
      // If inside an arrow param set or generic set, don't break
      // Otherwise, if top is {, (, [ or <, break line
      const top = stackTop();
      if (!(arrowParamSet.has(i) && top === "(") && !(genericSet.has(i) && top === "<")) {
        if (top && ["{", "[", "(", "<"].includes(top)) {
          newLine();
        }
      }

      // Everything else (identifiers, operators, colons, question marks, etc.)
    } else {
      placeToken(tok);
    }
  }

  pushLine();

  // Remove extra blank lines
  return lines
    .join("\n")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// Update the formatFunctionPreview to use the new formatter
export const formatFunctionPreview = (fn: { toString(): string }, expanded = false): string => {
  try {
    const fnStr = fn.toString();
    const match = fnStr.match(/(?:function\s*)?(?:\(([^)]*)\)|([^=>\s]+))\s*=>?/);
    if (!match) return "ƒ";

    const params = match[1] || match[2] || "";
    const cleanParams = params.replace(/\s+/g, "");

    if (!expanded) {
      return `ƒ (${cleanParams}) => ...`;
    }

    // For expanded view, use the new formatter
    return hackyJsFormatter(fnStr);
  } catch {
    return "ƒ";
  }
};

export const formatValuePreview = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string")
    return `"${value.length > 150 ? `${value.slice(0, 20)}...` : value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "function") return formatFunctionPreview(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value instanceof Map) return `Map(${value.size})`;
  if (value instanceof Set) return `Set(${value.size})`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return `{${keys.length > 2 ? `${keys.slice(0, 2).join(", ")}, ...` : keys.join(", ")}}`;
  }
  return String(value);
};

export const safeGetValue = (value: unknown): { value: unknown; error?: string } => {
  if (value === null || value === undefined) return { value };
  if (typeof value === "function") return { value };
  if (typeof value !== "object") return { value };

  if (isPromise(value)) {
    return { value: "Promise" };
  }

  try {
    const proto = Object.getPrototypeOf(value);
    if (proto === Promise.prototype || proto?.constructor?.name === "Promise") {
      return { value: "Promise" };
    }

    return { value };
  } catch {
    return { value: null, error: "Error accessing value" };
  }
};

export const extractMinimalFiberInfo = (fiber: Fiber): MinimalFiberInfo => {
  const timings = getTimings(fiber);
  return {
    displayName: getDisplayName(fiber) || "Unknown",
    type: fiber.type,
    key: fiber.key,
    id: fiber.index,
    selfTime: timings?.selfTime ?? null,
    totalTime: timings?.totalTime ?? null,
  };
};
