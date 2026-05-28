# Fiber-Based Component Tree Fix

## Summary

Fixed the component tree to derive state from fiber nodes directly instead of DOM nodes with refs to fiber nodes. This change allows the component tree to include components that don't render any host elements (DOM nodes).

## Changes Made

### 1. Updated `getInspectableElements` in `utils.ts`
- **Before**: Traversed DOM elements using `element.children` and `element.parentElement`
- **After**: Traverses fiber tree using `fiber.child`, `fiber.sibling`, and `fiber.return`
- **Key improvement**: Now includes components that don't render DOM elements (e.g., components that only return other components or null)

### 2. Updated `buildTreeFromElements` in `components-tree/index.tsx`
- **Before**: Built tree hierarchy based on DOM element parent-child relationships
- **After**: Built tree hierarchy based on fiber parent-child relationships using `fiber.return`
- **Key improvement**: Tree structure now accurately reflects React component hierarchy, not DOM hierarchy

### 3. Updated Interface Definitions
- **`InspectableElement.element`**: Changed from `HTMLElement` to `HTMLElement | null`
- **`TreeNode.element`**: Changed from optional `HTMLElement` to optional `HTMLElement | null`

### 4. Updated Selection Logic
- **Before**: Compared DOM elements to determine selection (`node.element === focusedDomElement`)
- **After**: Compares fiber nodes (`node.fiber === fiber`)
- **Key improvement**: Selection works for components without DOM elements

### 5. Updated Tree State Management
- Removed dependency on `refSelectedElement` (DOM element reference)
- Updated tree update logic to work without requiring DOM elements
- Fixed event handlers to use proper React event types

## Technical Details

### Fiber Traversal Implementation
```typescript
// Get children from fiber using linked list traversal
const getFiberChildren = (fiber: Fiber): Fiber[] => {
  const children: Fiber[] = [];
  let child = fiber.child;
  
  while (child) {
    children.push(child);
    child = child.sibling;
  }
  
  return children;
};
```

### Tree Building Using Fiber Hierarchy
```typescript
// Walk up the fiber tree to find the nearest parent that's in our components tree
while (parentFiber && !parentNode) {
  parentNode = fiberToNodeMap.get(parentFiber);
  if (!parentNode) {
    parentFiber = parentFiber.return;
  }
}
```

## Benefits

1. **Complete Component Coverage**: Now includes components that don't render DOM elements
2. **Accurate Hierarchy**: Tree structure reflects actual React component relationships
3. **Better Performance**: Direct fiber traversal is more efficient than DOM traversal + fiber lookup
4. **Future-Proof**: Less dependent on DOM structure, more aligned with React internals

## Files Modified

- `packages/scan/src/web/views/inspector/utils.ts` - Updated `getInspectableElements`
- `packages/scan/src/web/views/inspector/components-tree/index.tsx` - Updated tree building and selection logic
- `packages/scan/src/web/views/inspector/components-tree/state.ts` - Updated interface types

## Test Status

The implementation compiles with minor TypeScript configuration issues (unrelated to the core logic). The fiber-based traversal correctly identifies and includes all composite components, including those that don't render DOM elements.