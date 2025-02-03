import { Fiber } from "bippy";
export const getChildrenFromFiberLL = (fiber: Fiber) => {
  const children: Array<Fiber> = [];

  let curr: typeof fiber.child = fiber.child;

  while (curr) {
    children.push(curr);

    curr = curr.sibling;
  }

  return children;
};

type Node = Map<
  Fiber,
  {
    children: Array<Fiber>;
    parent: Fiber | null;
    isRoot: boolean;
    isSVG: boolean;
  }
>;

export const createChildrenAdjacencyList = (root: Fiber, limit: number) => {
  const tree: Node = new Map([]);

  const queue: Array<[node: Fiber, parent: Fiber | null]> = [];
  const visited = new Set<Fiber>();

  queue.push([root, root.return]);
  let traversed = 1;

  while (queue.length) {
    if (traversed >= limit) {
      return tree;
    }
    const [node, parent] = queue.pop()!;
    const children = getChildrenFromFiberLL(node);

    tree.set(node, {
      children: [],
      parent,
      isRoot: node === root,
      isSVG: node.type === "svg",
    });

    for (const child of children) {
      traversed += 1;
      // this isn't needed since the fiber tree is a TREE, not a graph, but it makes me feel safer
      if (visited.has(child)) {
        continue;
      }
      visited.add(child);
      tree.get(node)?.children.push(child);
      queue.push([child, node]);
    }
  }
  return tree;
};

const isProduction: boolean = process.env.NODE_ENV === "production";
const prefix: string = "Invariant failed";

// FIX ME THIS IS PRODUCTION INVARIANT LOL
export function devInvariant(
  condition: any,
  message?: string | (() => string)
): asserts condition {
  if (condition) {
    return;
  }

  if (isProduction) {
    throw new Error(prefix);
  }

  const provided: string | undefined =
    typeof message === "function" ? message() : message;

  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
}

const THROW_INVARIANTS = false;

export const invariantError = (message: string | undefined) => {
  if (THROW_INVARIANTS) {
    throw new Error(message);
  }
};

export const iife = <T>(fn: () => T): T => fn();

export class BoundedArray<T> extends Array<T> {
  constructor(private capacity: number = 25) {
    super();
  }

  push(...items: T[]): number {
    const result = super.push(...items);
    while (this.length > this.capacity) {
      this.shift();
    }
    return result;
  }
  // do not couple capacity with a default param, it must be explicit
  static fromArray<T>(array: Array<T>, capacity: number) {
    const arr = new BoundedArray<T>(capacity);
    arr.push(...array);
    return arr;
  }
}
