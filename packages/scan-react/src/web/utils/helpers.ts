import {
  type Fiber,
  MemoComponentTag,
  SimpleMemoComponentTag,
  SuspenseComponentTag,
  getDisplayName,
  hasMemoCache,
} from "bippy";
import { IS_CLIENT } from "./constants";

type ClassValue = string | number | bigint | null | boolean | undefined | ClassDictionary | ClassArray;
type ClassDictionary = Record<string, unknown>;
type ClassArray = Array<ClassValue>;

const toClassString = (input: ClassValue): string => {
  if (!input) return "";
  if (typeof input === "string" || typeof input === "number" || typeof input === "bigint") {
    return String(input);
  }
  if (Array.isArray(input)) {
    let result = "";
    for (const value of input) {
      const part = toClassString(value);
      if (part) {
        result = result ? `${result} ${part}` : part;
      }
    }
    return result;
  }
  if (typeof input !== "object") return "";
  const dict = input as ClassDictionary;
  let result = "";
  for (const key in dict) {
    if (dict[key]) {
      result = result ? `${result} ${key}` : key;
    }
  }
  return result;
};

export const cn = (...inputs: Array<ClassValue>): string => {
  const classNames: Array<string> = [];
  const seen = new Set<string>();
  for (const part of toClassString(inputs).split(" ")) {
    if (part && !seen.has(part)) {
      seen.add(part);
      classNames.push(part);
    }
  }
  return classNames.join(" ");
};

export const throttle = <E>(callback: (e?: E) => void, delay: number): ((e?: E) => void) => {
  let lastCall = 0;
  return (e?: E) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return callback(e);
    }
    return undefined;
  };
};

export const readLocalStorage = <T>(storageKey: string): T | null => {
  if (!IS_CLIENT) return null;

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveLocalStorage = <T>(storageKey: string, state: T): void => {
  if (!IS_CLIENT) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
};
export const removeLocalStorage = (storageKey: string): void => {
  if (!IS_CLIENT) return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {}
};

interface WrapperBadge {
  type: "memo" | "forwardRef" | "lazy" | "suspense" | "profiler" | "strict";
  title: string;
  compiler?: boolean;
}

interface ExtendedDisplayName {
  name: string | null;
  wrappers: Array<string>;
  wrapperTypes: Array<WrapperBadge>;
}

// React internal tags not exported by bippy
const LazyComponentTag = 24;
const ProfilerTag = 12;

export const getExtendedDisplayName = (fiber: Fiber): ExtendedDisplayName => {
  if (!fiber) {
    return {
      name: "Unknown",
      wrappers: [],
      wrapperTypes: [],
    };
  }

  const { tag, type, elementType } = fiber;
  let name = getDisplayName(type);
  const wrappers: Array<string> = [];
  const wrapperTypes: Array<WrapperBadge> = [];

  if (
    hasMemoCache(fiber) ||
    tag === SimpleMemoComponentTag ||
    tag === MemoComponentTag ||
    (type as { $$typeof?: symbol })?.$$typeof === Symbol.for("react.memo") ||
    (elementType as { $$typeof?: symbol })?.$$typeof === Symbol.for("react.memo")
  ) {
    const compiler = hasMemoCache(fiber);
    wrapperTypes.push({
      type: "memo",
      title: compiler
        ? "This component has been auto-memoized by the React Compiler."
        : "Memoized component that skips re-renders if props are the same",
      compiler,
    });
  }

  if (tag === LazyComponentTag) {
    wrapperTypes.push({
      type: "lazy",
      title: "Lazily loaded component that supports code splitting",
    });
  }

  if (tag === SuspenseComponentTag) {
    wrapperTypes.push({
      type: "suspense",
      title: "Component that can suspend while content is loading",
    });
  }

  if (tag === ProfilerTag) {
    wrapperTypes.push({
      type: "profiler",
      title: "Component that measures rendering performance",
    });
  }

  if (typeof name === "string") {
    const wrapperRegex = /^(\w+)\((.*)\)$/;
    let currentName = name;
    while (wrapperRegex.test(currentName)) {
      const match = currentName.match(wrapperRegex);
      if (match?.[1] && match?.[2]) {
        wrappers.unshift(match[1]);
        currentName = match[2];
      } else {
        break;
      }
    }
    name = currentName;
  }

  return {
    name: name || "Unknown",
    wrappers,
    wrapperTypes,
  };
};
