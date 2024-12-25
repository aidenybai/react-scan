import type { Fiber } from 'react-reconciler';
import { createHTMLTemplate } from '@web-utils/html-template';
import { Store } from 'src/core';
import { getOverrideMethods } from '@web-inspect-element/utils';
import { tryOrElse } from '@web-utils/helpers';
import {
  getChangedProps,
  getChangedState,
  getChangedContext,
  getStateNames,
  getCurrentContext,
  getCurrentProps,
  getCurrentState,
  resetStateTracking,
  getStateChangeCount,
  getPropsChangeCount,
  getContextChangeCount,
  getPropsOrder,
} from './utils';

interface PropertyElementOptions {
  componentName: string;
  didRender: boolean;
  propContainer: HTMLDivElement;
  fiber: Fiber;
  key: string;
  value: any;
  section?: string;
  level?: number;
  changedKeys?: Set<string>;
  parentPath?: string;
  objectPathMap?: WeakMap<object, Set<string>>;
  hasCumulativeChanges?: boolean;
}

const EXPANDED_PATHS = new Set<string>();
const fadeOutTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const activeOverlays = new Set<HTMLElement>();
let lastInspectedFiber: Fiber | null = null;
let changedAtInterval: ReturnType<typeof setInterval> | null = null;

export const changedAt = new Map<string, number>();
const lastRendered = new Map<string, unknown>();

const templates = {
  whatChangedSection: createHTMLTemplate<HTMLDetailsElement>(
    `<details class="react-scan-what-changed" style="background-color:#b8860b;color:#ffff00;padding:5px">
      <summary class="font-bold">What changed?</summary>
    </details>`,
    false
  ),

  changeList: createHTMLTemplate<HTMLUListElement>(
    '<ul style="list-style-type:disc;padding-left:20px"></ul>',
    false
  ),

  propertyContainer: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-property">',
    false
  ),

  previewLine: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-preview-line">',
    false
  ),

  arrow: createHTMLTemplate<HTMLSpanElement>(
    '<span class="react-scan-arrow">',
    false
  ),

  propertyContent: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-property-content">',
    false
  ),

  nestedObject: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-nested-object">',
    false
  ),

  inspector: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-inspector">',
    false
  ),

  content: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-content">',
    false
  ),

  header: createHTMLTemplate<HTMLDivElement>(
    '<div>',
    false
  ),

  flashOverlay: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-flash-overlay">',
    false
  ),

  listItem: createHTMLTemplate<HTMLLIElement>(
    '<li>',
    false
  ),

  input: createHTMLTemplate<HTMLInputElement>(
    '<input type="text" class="react-scan-input">',
    false
  ),

  section: createHTMLTemplate<HTMLDivElement>(
    '<div class="react-scan-section">',
    false
  )
};

export const renderPropsAndState = (didRender: boolean, fiber: Fiber) => {
  const propContainer = Store.inspectState.value.propContainer;
  if (!propContainer) return;

  const componentName = fiber.type?.displayName || fiber.type?.name || 'Unknown';

  // Reset tracking only when switching to a different component type
  if (lastInspectedFiber?.type !== fiber.type) {
    resetStateTracking();
  }
  lastInspectedFiber = fiber;

  const changedProps = getChangedProps(fiber);
  const changedState = getChangedState(fiber);
  const changedContext = getChangedContext(fiber);

  propContainer.innerHTML = '';

  const whatChangedSection = templates.whatChangedSection();
  whatChangedSection.open = Store.wasDetailsOpen.value;

  let hasAnyChanges = false;

  const stateHeader = templates.header();
  stateHeader.textContent = 'State:';
  const stateList = templates.changeList();
  let hasStateChanges = false;

  changedState.forEach(key => {
    const count = getStateChangeCount(key);
    if (count > 0) {
      hasStateChanges = true;
      hasAnyChanges = true;
      const li = templates.listItem();
      li.textContent = `${key} ×${count}`;
      stateList.appendChild(li);
    }
  });

  if (hasStateChanges) {
    whatChangedSection.appendChild(stateHeader);
    whatChangedSection.appendChild(stateList);
  }

  const propsHeader = templates.header();
  propsHeader.textContent = 'Props:';
  const propsList = templates.changeList();
  let hasPropsChanges = false;

  const propsOrder = getPropsOrder(fiber);
  const orderedProps = [...propsOrder, ...Array.from(changedProps)];
  const uniqueOrderedProps = [...new Set(orderedProps)];

  uniqueOrderedProps.forEach(key => {
    if (!changedProps.has(key)) return;
    const count = getPropsChangeCount(key);
    if (count > 0) {
      hasPropsChanges = true;
      hasAnyChanges = true;
      const li = templates.listItem();
      li.textContent = `${key} ×${count}`;
      propsList.appendChild(li);
    }
  });

  if (hasPropsChanges) {
    whatChangedSection.appendChild(propsHeader);
    whatChangedSection.appendChild(propsList);
  }

  const contextHeader = templates.header();
  contextHeader.textContent = 'Context:';
  const contextList = templates.changeList();
  let hasContextChanges = false;

  changedContext.forEach(key => {
    const count = getContextChangeCount(key);
    if (count > 0) {
      hasContextChanges = true;
      hasAnyChanges = true;
      const li = templates.listItem();
      li.textContent = `${key.replace('context.', '')} ×${count}`;
      contextList.appendChild(li);
    }
  });

  if (hasContextChanges) {
    whatChangedSection.appendChild(contextHeader);
    whatChangedSection.appendChild(contextList);
  }

  whatChangedSection.addEventListener('toggle', () => {
    Store.wasDetailsOpen.value = whatChangedSection.open;
  });

  if (hasAnyChanges) {
    propContainer.appendChild(whatChangedSection);
  }

  const inspector = templates.inspector();
  const content = templates.content();
  const sections: Array<{ element: HTMLElement; hasChanges: boolean }> = [];

  const currentProps = getCurrentProps(fiber);
  if (Object.values(currentProps).length) {
    tryOrElse(() => {
      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propContainer,
          'Props',
          currentProps,
          changedProps,
        ),
        hasChanges: changedProps.size > 0,
      });
    }, null);
  }

  const currentContext = getCurrentContext(fiber);
  if (Object.keys(currentContext).length) {
    tryOrElse(() => {
      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propContainer,
          'Context',
          currentContext,
          changedContext,
        ),
        hasChanges: changedContext.size > 0,
      });
    }, null);
  }

  const currentState = getCurrentState(fiber);
  if (Object.values(currentState).length > 0) {
    tryOrElse(() => {
      const stateObj: Record<string, unknown> = Array.isArray(currentState)
        ? Object.fromEntries(
          (currentState as Array<unknown>).map((val, idx) => [idx.toString(), val])
        )
        : currentState;

      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propContainer,
          'State',
          stateObj,
          changedState,
        ),
        hasChanges: changedState.size > 0,
      });
    }, null);
  }

  sections.forEach((section) => content.appendChild(section.element));
  inspector.appendChild(content);
  propContainer.appendChild(inspector);
};

export const replayComponent = async (fiber: any) => {
  try {
    const { overrideProps, overrideHookState } = getOverrideMethods();
    if (!overrideProps || !overrideHookState || !fiber) return;

    const currentProps = fiber.memoizedProps || {};

    try {
      Object.keys(currentProps).forEach((key) => {
        overrideProps(fiber, [key], currentProps[key]);
      });
    } catch (e) {
      /**/
    }

    try {
      const state = getCurrentState(fiber) || {};
      Object.keys(state).forEach((key) => {
        overrideHookState(fiber, key, [], state[key]);
      });
    } catch (e) {
      /**/
    }

    try {
      let child = fiber.child;
      while (child) {
        await replayComponent(child);
        child = child.sibling;
      }
    } catch (e) {
      /**/
    }
  } catch (e) {
    /**/
  }
};


const isPromise = (value: any): value is Promise<unknown> => {
  return value && (value instanceof Promise || (typeof value === 'object' && 'then' in value));
};

const getPath = (
  componentName: string,
  section: string,
  parentPath: string,
  key: string,
): string => {
  return parentPath
    ? `${componentName}.${parentPath}.${key}`
    : `${componentName}.${section}.${key}`;
};

const isEditableValue = (value: unknown): boolean => {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';
};

export const getValueClassName = (value: unknown): string => {
  if (Array.isArray(value)) return 'react-scan-array';
  if (value === null || value === undefined) return 'react-scan-null';
  switch (typeof value) {
    case 'string': return 'react-scan-string';
    case 'number': return 'react-scan-number';
    case 'boolean': return 'react-scan-boolean';
    case 'object': return 'react-scan-object-key';
    default: return '';
  }
};

export const getValuePreview = (value: unknown): string => {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string':
      if (value.includes('&quot;') || value.includes('&#39;') ||
        value.includes('&lt;') || value.includes('&gt;') ||
        value.includes('&amp;')) {
        return `"${value}"`;
      }
      return `"${value.replace(/[<>&"'\\\n\r\t]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          case '\\': return '\\\\';
          case '\n': return '\\n';
          case '\r': return '\\r';
          case '\t': return '\\t';
          default: return char;
        }
      })}"`;
    case 'number': return value.toString();
    case 'boolean': return value.toString();
    case 'object': {
      if (value instanceof Promise) return 'Promise';
      const keys = Object.keys(value);
      if (keys.length <= 3) return `{${keys.join(', ')}}`;
      return `{${keys.slice(0, 8).join(', ')}, ...}`;
    }
    default: return typeof value;
  }
};

const renderSection = (
  componentName: string,
  didRender: boolean,
  fiber: Fiber,
  propContainer: HTMLDivElement,
  title: string,
  data: Record<string, any>,
  changedKeys: Set<string>,
): HTMLElement => {
  const section = templates.section();
  section.dataset.section = title;

  let orderedEntries: Array<[string, any]> = [];
  if (title.toLowerCase() === 'props') {
    const propsOrder = getPropsOrder(fiber);
    const orderedProps = [...propsOrder, ...Object.keys(data)];
    const uniqueOrderedProps = [...new Set(orderedProps)];
    orderedEntries = uniqueOrderedProps
      .filter(key => key in data)
      .map(key => [key, data[key]]);
  } else {
    orderedEntries = Object.entries(data);
  }

  orderedEntries.forEach(([key, value]) => {
    const el = createPropertyElement({
      componentName,
      didRender,
      propContainer,
      fiber,
      key,
      value,
      section: title.toLowerCase(),
      level: 0,
      changedKeys,
      parentPath: '',
      objectPathMap: new WeakMap(),
      hasCumulativeChanges: true
    });

    if (!el) return;
    section.appendChild(el);
  });

  return section;
};

export const createPropertyElement = ({
  componentName,
  didRender,
  propContainer,
  fiber,
  key,
  value,
  section = '',
  level = 0,
  changedKeys = new Set<string>(),
  parentPath = '',
  objectPathMap = new WeakMap<object, Set<string>>(),
  hasCumulativeChanges = false,
}: PropertyElementOptions): HTMLElement | null => {
  try {
    if (!changedAtInterval) {
      changedAtInterval = setInterval(() => {
        changedAt.forEach((value, key) => {
          if (Date.now() - value > 450) {
            changedAt.delete(key);
          }
        });
      }, 200);
    }

    const container = templates.propertyContainer();

    const isExpandable =
      !isPromise(value) &&
      ((Array.isArray(value) && value.length > 0) ||
        (typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length > 0));

    const currentPath = getPath(componentName, section, parentPath, key);
    const prevValue = lastRendered.get(currentPath);
    const isChanged = prevValue !== undefined && prevValue !== value;

    const shouldShowChange =
      isChanged || changedKeys.has(key) || hasCumulativeChanges;

    const isBadRender = level === 0 &&
      shouldShowChange &&
      typeof value === 'object' &&
      value !== null &&
      !isPromise(value);

    lastRendered.set(currentPath, value);

    if (shouldShowChange) {
      changedAt.set(currentPath, Date.now());
      createAndHandleFlashOverlay(container);

      if (level > 0 && container.parentElement) {
        const parentContainer = container.closest('.react-scan-property')?.parentElement?.closest('.react-scan-property');
        if (parentContainer instanceof HTMLElement) {
          createAndHandleFlashOverlay(parentContainer);
        }
      }
    }

    if (isExpandable) {
      const isExpanded = EXPANDED_PATHS.has(currentPath);

      if (typeof value === 'object' && value !== null) {
        let paths = objectPathMap.get(value);
        if (!paths) {
          paths = new Set();
          objectPathMap.set(value, paths);
        }
        if (paths.has(currentPath)) {
          return createCircularReferenceElement(key);
        }
        paths.add(currentPath);
      }

      container.classList.add('react-scan-expandable');
      if (isExpanded) {
        container.classList.add('react-scan-expanded');
      }

      const arrow = templates.arrow();
      container.appendChild(arrow);

      const contentWrapper = templates.propertyContent();

      const preview = templates.previewLine();
      preview.dataset.key = key;
      preview.dataset.section = section;

      preview.innerHTML = `
        ${isBadRender ? '<span class="react-scan-warning">⚠️</span>' : ''}
        <span class="react-scan-key">${key}:&nbsp;</span><span class="${getValueClassName(
        value,
      )} react-scan-value truncate">${getValuePreview(value)}</span>
      `;

      const content = templates.nestedObject();
      content.className = isExpanded
        ? 'react-scan-nested-object'
        : 'react-scan-nested-object react-scan-hidden';

      contentWrapper.appendChild(preview);
      contentWrapper.appendChild(content);
      container.appendChild(contentWrapper);

      if (isExpanded) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            const el = createPropertyElement({
              componentName,
              didRender,
              propContainer,
              fiber,
              key: index.toString(),
              value: item,
              section,
              level: level + 1,
              changedKeys: new Set(),
              parentPath: currentPath,
              objectPathMap: new WeakMap(),
              hasCumulativeChanges: false
            });
            if (!el) return;
            content.appendChild(el);
          });
        } else {
          Object.entries(value).forEach(([k, v]) => {
            const el = createPropertyElement({
              componentName,
              didRender,
              propContainer,
              fiber,
              key: k,
              value: v,
              section,
              level: level + 1,
              changedKeys: new Set(),
              parentPath: currentPath,
              objectPathMap: new WeakMap(),
              hasCumulativeChanges: false
            });
            if (!el) return;
            content.appendChild(el);
          });
        }
      }

      arrow.addEventListener('click', (e) => {
        e.stopPropagation();

        const isExpanding = !container.classList.contains('react-scan-expanded');

        if (isExpanding) {
          EXPANDED_PATHS.add(currentPath);
          container.classList.add('react-scan-expanded');
          content.classList.remove('react-scan-hidden');

          if (!content.hasChildNodes()) {
            if (Array.isArray(value)) {
              value.forEach((item, index) => {
                const el = createPropertyElement({
                  componentName,
                  didRender,
                  propContainer,
                  fiber,
                  key: index.toString(),
                  value: item,
                  section,
                  level: level + 1,
                  changedKeys: new Set(),
                  parentPath: currentPath,
                  objectPathMap: new WeakMap(),
                  hasCumulativeChanges: false
                });
                if (!el) return;
                content.appendChild(el);
              });
            } else {
              Object.entries(value).forEach(([k, v]) => {
                const el = createPropertyElement({
                  componentName,
                  didRender,
                  propContainer,
                  fiber,
                  key: k,
                  value: v,
                  section,
                  level: level + 1,
                  changedKeys: new Set(),
                  parentPath: currentPath,
                  objectPathMap: new WeakMap(),
                  hasCumulativeChanges: false
                });
                if (!el) return;
                content.appendChild(el);
              });
            }
          }
        } else {
          EXPANDED_PATHS.delete(currentPath);
          container.classList.remove('react-scan-expanded');
          content.classList.add('react-scan-hidden');
        }
      });
    } else {
      const preview = templates.previewLine();
      preview.dataset.key = key;
      preview.dataset.section = section;
      preview.innerHTML = `
        ${isBadRender ? '<span class="react-scan-warning">⚠️</span>' : ''}
        <span class="react-scan-key">${key}:&nbsp;</span><span class="${getValueClassName(
        value,
      )} react-scan-value truncate">${getValuePreview(value)}</span>
      `;
      container.appendChild(preview);

      if (section === 'props' || section === 'state') {
        const valueElement = preview.querySelector('.react-scan-value');
        const { overrideProps, overrideHookState } = getOverrideMethods();
        const canEdit = section === 'props' ? !!overrideProps : !!overrideHookState;


        if (valueElement && canEdit && isEditableValue(value)) {
          valueElement.classList.add('react-scan-editable');
          valueElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const input = templates.input();
            input.value = typeof value === 'string' ?
              value.replace(/^"(?:.*)"$/, '$1')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
              : value.toString();

            const restoreOriginalElement = () => {
              tryOrElse(() => {
                if (input.parentNode) {
                  input.replaceWith(valueElement);
                }
              }, null);
            };

            const updateValue = () => {
              const newValue = tryOrElse(() => {
                const inputValue = input.value;
                return typeof value === 'number' ? Number(inputValue) :
                  typeof value === 'boolean' ? inputValue === 'true' :
                    inputValue;
              }, value);

              if (Object.is(value, newValue)) {
                restoreOriginalElement();
                return;
              }

              if (section === 'props' && overrideProps) {
                tryOrElse(() => {
                  if (parentPath) {
                    const parts = parentPath.split('.');
                    const path = parts.filter(part => part !== 'props' && part !== componentName);
                    path.push(key);
                    overrideProps(fiber, path, newValue);
                  } else {
                    overrideProps(fiber, [key], newValue);
                  }
                }, null);
              }

              if (section === 'state' && overrideHookState) {
                tryOrElse(() => {
                  if (!parentPath) {
                    const stateNames = getStateNames(fiber);
                    const namedStateIndex = stateNames.indexOf(key);
                    const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
                    overrideHookState(fiber, hookId, [], newValue);
                  } else {
                    const fullPathParts = parentPath.split('.');
                    const stateIndex = fullPathParts.indexOf('state');
                    if (stateIndex === -1) return;

                    const statePath = fullPathParts.slice(stateIndex + 1);
                    const baseStateKey = statePath[0];
                    const stateNames = getStateNames(fiber);
                    const namedStateIndex = stateNames.indexOf(baseStateKey);
                    const hookId = namedStateIndex !== -1 ? namedStateIndex.toString() : '0';
                    const nestedPath = statePath.slice(1).map(part => /^\d+$/.test(part) ? parseInt(part, 10) : part);
                    nestedPath.push(key);
                    overrideHookState(fiber, hookId, nestedPath, newValue);
                  }
                }, null);
              }
            };


            input.addEventListener('keydown', (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                updateValue();
              } else if (e.key === 'Escape') {
                restoreOriginalElement();
              }
            });

            input.addEventListener('blur', () => {
              restoreOriginalElement();
            });

            valueElement.replaceWith(input);
            input.focus();
          });
        }
      }
    }

    return container;
  } catch {
    return null;
  }
};

const createCircularReferenceElement = (key: string): HTMLElement => {
  const container = templates.propertyContainer();

  const preview = templates.previewLine();
  preview.innerHTML = `
    <span class="react-scan-key">${key}:&nbsp;</span><span class="react-scan-circular">[Circular Reference]</span>
  `;
  container.appendChild(preview);
  return container;
};

const cleanupFlashOverlay = (overlay: HTMLElement) => {
  const timerId = fadeOutTimers.get(overlay);
  if (timerId !== undefined) {
    clearTimeout(timerId);
    fadeOutTimers.delete(overlay);
  }
  activeOverlays.delete(overlay);
  if (overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
};

const createAndHandleFlashOverlay = (container: HTMLElement) => {
  const existingOverlay = container.querySelector('.react-scan-flash-overlay');

  const flashOverlay = existingOverlay instanceof HTMLElement ? existingOverlay : (() => {
    const newOverlay = templates.flashOverlay();
    container.appendChild(newOverlay);
    activeOverlays.add(newOverlay);
    return newOverlay;
  })();

  requestAnimationFrame(() => {
    flashOverlay.style.cssText = `
      transition: none;
      opacity: 0.9;
    `;

    const existingTimer = fadeOutTimers.get(flashOverlay);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
      fadeOutTimers.delete(flashOverlay);
    }

    const timerId = setTimeout(() => {
      flashOverlay.style.transition = 'opacity 150ms ease-out';
      flashOverlay.style.opacity = '0';

      const cleanupTimer = setTimeout(() => {
        cleanupFlashOverlay(flashOverlay);
        fadeOutTimers.delete(flashOverlay);
      }, 150);

      fadeOutTimers.set(flashOverlay, cleanupTimer);
    }, 300);

    fadeOutTimers.set(flashOverlay, timerId);
  });
};

export const cleanup = () => {
  EXPANDED_PATHS.clear();

  activeOverlays.forEach(cleanupFlashOverlay);
  activeOverlays.clear();

  if (changedAtInterval !== null) {
    clearInterval(changedAtInterval);
    changedAtInterval = null;
  }

  activeOverlays.forEach((overlay) => {
    const timer = fadeOutTimers.get(overlay);
    if (timer) {
      clearTimeout(timer);
      fadeOutTimers.delete(overlay);
    }
  });

  changedAt.clear();
  lastRendered.clear();

  lastInspectedFiber = null;
};
