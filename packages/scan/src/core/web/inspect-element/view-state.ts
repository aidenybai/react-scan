import { fastSerialize } from '../../instrumentation';
import { Store } from '../../index';
import {
  getAllFiberContexts,
  getChangedProps,
  getChangedState,
  getStateFromFiber,
  getOverrideMethods,
} from './utils';

const EXPANDED_PATHS = new Set<string>();
const fadeOutTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const disabledButtons = new Set<HTMLButtonElement>();

export const renderPropsAndState = (
  didRender: boolean,
  fiber: any,
  reportDataFiber: any,
  propsContainer: HTMLDivElement,
) => {
  const { overrideProps } = getOverrideMethods();
  const canEdit = !!overrideProps;

  const scrollTop = propsContainer.scrollTop;

  const fiberContext = tryOrElse(
    () => Array.from(getAllFiberContexts(fiber).entries()).map((x) => x[1]),
    [],
  );

  const componentName =
    fiber.type?.displayName || fiber.type?.name || 'Unknown';
  const props = fiber.memoizedProps || {};
  const state = getStateFromFiber(fiber) || {};

  const renderCount = reportDataFiber?.count || 0;
  const renderTime = reportDataFiber?.time?.toFixed(2) || '0';

  const changedProps = new Set(getChangedProps(fiber));
  const changedState = new Set(getChangedState(fiber));
  propsContainer.innerHTML = '';

  const inspector = document.createElement('div');
  inspector.className = 'react-scan-inspector';

  const header = document.createElement('div');
  header.className = 'react-scan-header';
  header.innerHTML = `
    <div class="react-scan-header-left">
      <span class="react-scan-component-name">${componentName}</span>
      <span class="react-scan-metrics">
        ${renderCount > 0 ? `${renderCount} renders` : ''}
        ${renderCount > 0 && renderTime > 0 ? ' • ' : ''}
        ${renderTime > 0 ? `${renderTime}ms` : ''}
      </span>
    </div>
    <div class="react-scan-header-right">
      ${
        canEdit
          ? `
        <button class="react-scan-replay-button" title="Replay component">
         <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgb(203, 182, 242)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scan-eye"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/></svg>
        </button>
      `
          : ''
      }
      <button class="react-scan-close-button" title="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `;
  inspector.appendChild(header);

  const closeButton = header.querySelector<HTMLButtonElement>(
    '.react-scan-close-button',
  )!;
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentState = Store.inspectState.value;
    if (currentState.kind !== 'focused') return;

    propsContainer.style.maxHeight = '0';
    propsContainer.style.width = 'fit-content';
    propsContainer.innerHTML = '';

    Store.inspectState.value = {
      kind: 'inspect-off',
      propContainer: currentState.propContainer,
    };
  });

  if (canEdit) {
    const replayButton = header.querySelector<HTMLButtonElement>(
      '.react-scan-replay-button',
    )!;

    if (disabledButtons.has(replayButton)) {
      replayButton.classList.add('disabled');
    }

    replayButton.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      if (disabledButtons.has(replayButton)) return;

      const { overrideProps, overrideHookState } = getOverrideMethods();
      if (!overrideProps || !overrideHookState) return;

      disabledButtons.add(replayButton);
      replayButton.classList.add('disabled');

      void (async () => {
        try {
          await replayComponent(fiber);
        } finally {
          setTimeout(() => {
            disabledButtons.delete(replayButton);
            replayButton.classList.remove('disabled');
          }, 300);
        }
      })();
    });
  }

  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .react-scan-header-right {
      display: flex;
      gap: 4px;
    }
    .react-scan-replay-button,
    .react-scan-close-button {
      display: flex;
      align-items: center;
      padding: 4px;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: opacity 150ms ease;
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }
    .react-scan-close-button {
      background: rgba(255, 255, 255, 0.01);
    }
    .react-scan-close-button:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .react-scan-replay-button {
      background: rgba(142, 97, 227, 0.5) !important;
    }
    .react-scan-replay-button.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .react-scan-replay-button:hover {
      background: rgba(142, 97, 227, 0.25);
    }
    .react-scan-replay-button::before {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      animation: shimmer 2s infinite;
      background: linear-gradient(
        to right,
        transparent,
        rgba(142, 97, 227, 0.3),
        transparent
      );
    }
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(styleElement);

  const content = document.createElement('div');
  content.className = 'react-scan-content';

  const sections: Array<{ element: HTMLElement; hasChanges: boolean }> = [];

  if (Object.values(props).length) {
    tryOrElse(() => {
      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propsContainer,
          'Props',
          props,
          changedProps,
        ),
        hasChanges: changedProps.size > 0,
      });
    }, null);
  }

  if (fiberContext.length) {
    tryOrElse(() => {
      const changedKeys = new Set<string>();

      const contextObj = Object.fromEntries(
        fiberContext.map((val, idx) => {
          const key = idx.toString();
          return [key, val];
        }),
      );

      for (const [key, value] of Object.entries(contextObj)) {
        const path = `${componentName}.context.${key}`;
        const lastValue = lastRendered.get(path);
        const isChanged =
          lastValue !== undefined && lastValue !== contextObj[key];
        const isBadRender =
          isChanged &&
          ['object', 'function'].includes(typeof lastValue) &&
          fastSerialize(lastValue) === fastSerialize(contextObj[key]);

        if (isChanged) {
          changedKeys.add(key);
          changedAt.set(path, Date.now());
        }

        if (isBadRender) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete contextObj[key];
          const newKey = `⚠️ ${key}`;
          contextObj[newKey] = value;
          changedAt.set(`${componentName}.context.${key}`, Date.now());
        }

        lastRendered.set(path, value);
      }

      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propsContainer,
          'Context',
          contextObj,
          changedKeys,
        ),
        hasChanges: changedKeys.size > 0,
      });
    }, null);
  }

  if (Object.values(state).length) {
    tryOrElse(() => {
      const stateObj = Array.isArray(state)
        ? Object.fromEntries(state.map((val, idx) => [idx.toString(), val]))
        : state;

      for (const [key, value] of Object.entries(stateObj)) {
        const path = `${componentName}.state.${key}`;
        const lastValue = lastRendered.get(path);
        if (lastValue !== undefined && lastValue !== value) {
          changedAt.set(path, Date.now());
        }
        lastRendered.set(path, value);
      }

      sections.push({
        element: renderSection(
          componentName,
          didRender,
          fiber,
          propsContainer,
          'State',
          stateObj,
          changedState,
        ),
        hasChanges: changedState.size > 0,
      });
    }, null);
  }

  sections.sort((a, b) => {
    if (a.hasChanges && !b.hasChanges) return -1;
    if (!a.hasChanges && b.hasChanges) return 1;
    return 0;
  });

  sections.forEach((section) => content.appendChild(section.element));

  inspector.appendChild(content);
  propsContainer.appendChild(inspector);

  requestAnimationFrame(() => {
    const contentHeight = inspector.getBoundingClientRect().height;
    propsContainer.style.maxHeight = `${contentHeight}px`;
    propsContainer.scrollTop = scrollTop;
  });
};

const lastChangedAt = new Map<string, number>();

const renderSection = (
  componentName: string,
  didRender: boolean,
  fiber: any,
  propsContainer: HTMLDivElement,
  title: string,
  data: any,
  changedKeys: Set<string> = new Set(),
) => {
  const section = document.createElement('div');
  section.className = 'react-scan-section';
  section.textContent = title;

  const entries = Object.entries(data).sort(([keyA], [keyB]) => {
    const pathA = getPath(componentName, title.toLowerCase(), '', keyA);
    const pathB = getPath(componentName, title.toLowerCase(), '', keyB);

    if (
      changedKeys.has(keyA) ||
      (changedAt.has(pathA) && Date.now() - changedAt.get(pathA)! < 450)
    ) {
      lastChangedAt.set(pathA, Date.now());
    }
    if (
      changedKeys.has(keyB) ||
      (changedAt.has(pathB) && Date.now() - changedAt.get(pathB)! < 450)
    ) {
      lastChangedAt.set(pathB, Date.now());
    }

    const aLastChanged = lastChangedAt.get(pathA) ?? 0;
    const bLastChanged = lastChangedAt.get(pathB) ?? 0;

    return bLastChanged - aLastChanged;
  });

  entries.forEach(([key, value]) => {
    const el = createPropertyElement(
      componentName,
      didRender,
      propsContainer,
      fiber,
      key,
      value,
      title.toLowerCase(),
      0,
      changedKeys,
      '',
      new WeakMap(),
    );
    if (!el) {
      return;
    }
    section.appendChild(el);
  });

  return section;
};

const getPath = (
  componentName: string,
  section: string,
  parentPath: string,
  key: string,
) => {
  return parentPath
    ? `${componentName}.${parentPath}.${key}`
    : `${componentName}.${section}.${key}`;
};
export const changedAt = new Map<string, number>();

let changedAtInterval: ReturnType<typeof setInterval>;
const lastRendered = new Map<string, unknown>();

const tryOrElse = <T, E>(cb: () => T, val: E) => {
  try {
    return cb();
  } catch (e) {
    return val;
  }
};

export const createPropertyElement = (
  componentName: string,
  didRender: boolean,
  propsContainer: HTMLDivElement,
  fiber: any,
  key: string,
  value: any,
  section = '',
  level = 0,
  changedKeys: Set<string> = new Set(),
  parentPath = '',
  objectPathMap: WeakMap<object, Set<string>> = new WeakMap(),
) => {
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
    const container = document.createElement('div');
    container.className = 'react-scan-property';

    const isExpandable =
      (typeof value === 'object' && value !== null) || Array.isArray(value);
    const currentPath = getPath(componentName, section, parentPath, key);
    const prevValue = lastRendered.get(currentPath);
    const isChanged = prevValue !== undefined && prevValue !== value;

    const isBadRender =
      value &&
      ['object', 'function'].includes(typeof value) &&
      fastSerialize(value) === fastSerialize(prevValue) &&
      isChanged;

    lastRendered.set(currentPath, value);

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

      const arrow = document.createElement('span');
      arrow.className = 'react-scan-arrow';
      arrow.textContent = '▶';
      container.appendChild(arrow);

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'react-scan-property-content';

      const preview = document.createElement('div');
      preview.className = 'react-scan-preview-line';
      preview.dataset.key = key;
      preview.dataset.section = section;
      preview.innerHTML = `
        ${isBadRender ? '<span class="react-scan-warning">⚠️</span>' : ''}
        <span class="react-scan-key">${key}:&nbsp;</span><span class="${getValueClassName(
          value,
        )}">${getValuePreview(value)}</span>
      `;

      const content = document.createElement('div');
      content.className = isExpanded
        ? 'react-scan-nested-object'
        : 'react-scan-nested-object react-scan-hidden';

      contentWrapper.appendChild(preview);
      contentWrapper.appendChild(content);
      container.appendChild(contentWrapper);

      if (isExpanded) {
        if (Array.isArray(value)) {
          const arrayContainer = document.createElement('div');
          arrayContainer.className = 'react-scan-array-container';
          value.forEach((item, index) => {
            const el = createPropertyElement(
              componentName,
              didRender,
              propsContainer,
              fiber,
              index.toString(),
              item,
              section,
              level + 1,
              changedKeys,
              currentPath,
              objectPathMap,
            );
            if (!el) {
              return;
            }
            arrayContainer.appendChild(el);
          });
          content.appendChild(arrayContainer);
        } else {
          Object.entries(value).forEach(([k, v]) => {
            const el = createPropertyElement(
              componentName,
              didRender,
              propsContainer,
              fiber,
              k,
              v,
              section,
              level + 1,
              changedKeys,
              currentPath,
              objectPathMap,
            );
            if (!el) {
              return;
            }
            content.appendChild(el);
          });
        }
      }

      arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanding = !container.classList.contains(
          'react-scan-expanded',
        );

        if (isExpanding) {
          EXPANDED_PATHS.add(currentPath);
          container.classList.add('react-scan-expanded');
          content.classList.remove('react-scan-hidden');

          if (!content.hasChildNodes()) {
            if (Array.isArray(value)) {
              const arrayContainer = document.createElement('div');
              arrayContainer.className = 'react-scan-array-container';
              value.forEach((item, index) => {
                const el = createPropertyElement(
                  componentName,
                  didRender,
                  propsContainer,
                  fiber,
                  index.toString(),
                  item,
                  section,
                  level + 1,
                  changedKeys,
                  currentPath,
                  new WeakMap(),
                );
                if (!el) {
                  return;
                }
                arrayContainer.appendChild(el);
              });
              content.appendChild(arrayContainer);
            } else {
              Object.entries(value).forEach(([k, v]) => {
                const el = createPropertyElement(
                  componentName,
                  didRender,
                  propsContainer,
                  fiber,
                  k,
                  v,
                  section,
                  level + 1,
                  changedKeys,
                  currentPath,
                  new WeakMap(),
                );
                if (!el) {
                  return;
                }
                content.appendChild(el);
              });
            }
          }
        } else {
          EXPANDED_PATHS.delete(currentPath);
          container.classList.remove('react-scan-expanded');
          content.classList.add('react-scan-hidden');
        }

        requestAnimationFrame(() => {
          const inspector = propsContainer.firstElementChild as HTMLElement;
          if (inspector) {
            const contentHeight = inspector.getBoundingClientRect().height;
            propsContainer.style.maxHeight = `${contentHeight}px`;
          }
        });
      });
    } else {
      const preview = document.createElement('div');
      preview.className = 'react-scan-preview-line';
      preview.dataset.key = key;
      preview.dataset.section = section;
      preview.innerHTML = `
        <span style="width: 8px; display: inline-block"></span>
        ${isBadRender ? '<span class="react-scan-warning">⚠️</span>' : ''}
        <span class="react-scan-key">${key}:&nbsp;</span><span class="${getValueClassName(
          value,
        )} react-scan-value">${getValuePreview(value)}</span>
      `;
      container.appendChild(preview);

      if (section === 'props' || section === 'state') {
        const valueElement = preview.querySelector('.react-scan-value');
        const { overrideProps, overrideHookState } = getOverrideMethods();
        const canEdit =
          section === 'props' ? !!overrideProps : !!overrideHookState;

        if (
          valueElement &&
          canEdit &&
          (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean')
        ) {
          valueElement.classList.add('react-scan-editable');
          valueElement.addEventListener('click', (e) => {
            e.stopPropagation();

            const input = document.createElement('input');
            input.type = 'text';
            input.value = value.toString();
            input.className = 'react-scan-input';

            const updateValue = () => {
              const newValue = input.value;
              value = typeof value === 'number' ? Number(newValue) : newValue;
              valueElement.textContent = getValuePreview(value);

              tryOrElse(() => {
                input.replaceWith(valueElement);
              }, null);

              tryOrElse(() => {
                const { overrideProps, overrideHookState } =
                  getOverrideMethods();
                if (overrideProps && section === 'props') {
                  overrideProps(fiber, [key], value);
                }
                if (overrideHookState && section === 'state') {
                  overrideHookState(fiber, key, [], value);
                }
              }, null);
            };

            input.addEventListener('blur', updateValue);
            input.addEventListener('keydown', (event) => {
              if (event.key === 'Enter') {
                updateValue();
              }
            });

            valueElement.replaceWith(input);
            input.focus();
          });
        }
      }
    }

    if (changedKeys.has(key)) {
      changedAt.set(currentPath, Date.now());
    }
    if (changedAt.has(currentPath)) {
      const flashOverlay = document.createElement('div');
      flashOverlay.className = 'react-scan-flash-overlay';
      container.appendChild(flashOverlay);

      flashOverlay.style.opacity = '.9';

      const existingTimer = fadeOutTimers.get(flashOverlay);
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      const timerId = setTimeout(() => {
        flashOverlay.style.transition = 'opacity 400ms ease-out';
        flashOverlay.style.opacity = '0';
        fadeOutTimers.delete(flashOverlay);
      }, 300);

      fadeOutTimers.set(flashOverlay, timerId);
    }

    return container;
  } catch {
    /*We likely read a proxy/getter that threw an error */
    return null;
  }
};

const createCircularReferenceElement = (key: string) => {
  const container = document.createElement('div');
  container.className = 'react-scan-property';

  const preview = document.createElement('div');
  preview.className = 'react-scan-preview-line';
  preview.innerHTML = `
    <span style="width: 8px; display: inline-block"></span>
    <span class="react-scan-key">${key}:&nbsp;</span><span class="react-scan-circular">[Circular Reference]</span>
  `;
  container.appendChild(preview);
  return container;
};

export const getValueClassName = (value: any) => {
  if (Array.isArray(value)) return 'react-scan-array';
  if (value === null || value === undefined) return 'react-scan-null';
  switch (typeof value) {
    case 'string':
      return 'react-scan-string';
    case 'number':
      return 'react-scan-number';
    case 'boolean':
      return 'react-scan-boolean';
    case 'object':
      return 'react-scan-object-key';
    default:
      return '';
  }
};

export const getValuePreview = (value: any) => {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  switch (typeof value) {
    case 'string':
      return `"${value}"`;
    case 'number':
      return value.toString();
    case 'boolean':
      return value.toString();
    case 'object': {
      if (value instanceof Promise) {
        return 'Promise';
      }
      const keys = Object.keys(value);
      if (keys.length <= 3) {
        return `{${keys.join(', ')}}`;
      }
      return `{${keys.slice(0, 3).join(', ')}, ...}`;
    }
    default:
      return typeof value;
  }
};

const replayComponent = async (fiber: any) => {
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
      const state = getStateFromFiber(fiber) || {};
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
