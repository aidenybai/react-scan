import { Store } from '../../index';
import { fastSerialize } from '../../instrumentation';
import {
  getAllFiberContexts,
  getChangedProps,
  getChangedState,
  getOverrideMethods,
  getStateFromFiber,
} from './utils';

const EXPANDED_PATHS = new Set<string>();
const fadeOutTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export const cumulativeChanges = {
  props: new Map<string, number>(),
  state: new Map<string, number>(),
  context: new Map<string, number>(),
};

export const renderPropsAndState = (didRender: boolean, fiber: any) => {
  const propContainer = Store.inspectState.value.propContainer;

  if (!propContainer) {
    return;
  }

  const fiberContext = tryOrElse(
    () => Array.from(getAllFiberContexts(fiber).entries()).map((x) => x[1]),
    [],
  );

  const componentName =
    fiber.type?.displayName || fiber.type?.name || 'Unknown';
  const props = fiber.memoizedProps || {};
  const state = getStateFromFiber(fiber) || {};

  const changedProps = new Set(getChangedProps(fiber));
  const changedState = new Set(getChangedState(fiber));
  // Empty??
  const changedContext = new Set<string>();

  for (const key of changedProps) {
    cumulativeChanges.props.set(
      key,
      (cumulativeChanges.props.get(key) ?? 0) + 1,
    );
  }

  for (const key of changedState) {
    cumulativeChanges.state.set(
      key,
      (cumulativeChanges.state.get(key) ?? 0) + 1,
    );
  }

  // FIXME(Alexis): changedContext is empty, this block is no-op
  for (const key of changedContext) {
    cumulativeChanges.context.set(
      key,
      (cumulativeChanges.context.get(key) ?? 0) + 1,
    );
  }

  propContainer.innerHTML = '';

  const changedItems: Array<string> = [];

  if (cumulativeChanges.props.size > 0) {
    for (const [key, count] of cumulativeChanges.props) {
      changedItems.push(`Prop: ${key} ×${count}`);
    }
  }

  if (cumulativeChanges.state.size > 0) {
    for (const [key, count] of cumulativeChanges.state) {
      changedItems.push(`State: ${key} ×${count}`);
    }
  }

  if (cumulativeChanges.context.size > 0) {
    for (const [key, count] of cumulativeChanges.context) {
      changedItems.push(`Context: ${key} ×${count}`);
    }
  }

  const whatChangedSection = document.createElement('details');
  whatChangedSection.className = 'react-scan-what-changed';
  whatChangedSection.style.backgroundColor = '#b8860b';
  whatChangedSection.style.color = '#ffff00';
  whatChangedSection.style.padding = '5px';
  whatChangedSection.open = Store.wasDetailsOpen.value;

  const summary = document.createElement('summary');
  summary.textContent = 'What changed?';
  summary.className = 'font-bold';
  whatChangedSection.appendChild(summary);

  if (cumulativeChanges.props.size > 0) {
    const propsHeader = document.createElement('div');
    propsHeader.textContent = 'Props:';
    const propsList = document.createElement('ul');
    propsList.style.listStyleType = 'disc';
    propsList.style.paddingLeft = '20px';

    for (const [key, count] of cumulativeChanges.props) {
      const li = document.createElement('li');
      li.textContent = `${key} ×${count}`;
      propsList.appendChild(li);
    }

    whatChangedSection.appendChild(propsHeader);
    whatChangedSection.appendChild(propsList);
  }

  if (cumulativeChanges.state.size > 0) {
    const stateHeader = document.createElement('div');
    stateHeader.textContent = 'State:';
    const stateList = document.createElement('ul');
    stateList.style.listStyleType = 'disc';
    stateList.style.paddingLeft = '20px';

    for (const [key, count] of cumulativeChanges.state) {
      const li = document.createElement('li');
      li.textContent = `${key} ×${count}`;
      stateList.appendChild(li);
    }

    whatChangedSection.appendChild(stateHeader);
    whatChangedSection.appendChild(stateList);
  }

  if (cumulativeChanges.context.size > 0) {
    const contextHeader = document.createElement('div');
    contextHeader.textContent = 'Context:';
    const contextList = document.createElement('ul');
    contextList.style.listStyleType = 'disc';
    contextList.style.paddingLeft = '20px';

    for (const [key, count] of cumulativeChanges.context) {
      const li = document.createElement('li');
      li.textContent = `${key} ×${count}`;
      contextList.appendChild(li);
    }

    whatChangedSection.appendChild(contextHeader);
    whatChangedSection.appendChild(contextList);
  }

  whatChangedSection.addEventListener('toggle', () => {
    Store.wasDetailsOpen.value = whatChangedSection.open;
  });

  propContainer.appendChild(whatChangedSection);

  const inspector = document.createElement('div');
  inspector.className = 'react-scan-inspector';

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
          propContainer,
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
          propContainer,
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
          propContainer,
          'State',
          stateObj,
          changedState,
        ),
        hasChanges: changedState.size > 0,
      });
    }, null);
  }

  for (const section of sections) {
    content.appendChild(section.element);
  }

  inspector.appendChild(content);

  propContainer.appendChild(inspector);
};

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
  section.dataset.section = title;

  for (const key in data) {
    const value = data[key];
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
    if (el) {
      section.appendChild(el);
    }
  }

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

const isPromise = (value: any): value is Promise<unknown> => {
  return (
    value &&
    (value instanceof Promise || (typeof value === 'object' && 'then' in value))
  );
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
        for (const [key, value] of changedAt) {
          if (Date.now() - value > 450) {
            changedAt.delete(key);
          }
        }
      }, 200);
    }
    const container = document.createElement('div');
    container.className = 'react-scan-property';

    const isExpandable =
      !isPromise(value) &&
      ((Array.isArray(value) && value.length > 0) ||
        (typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length > 0));

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
        )} react-scan-value truncate">${getValuePreview(value)}</span>
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
          for (let i = 0, len = value.length; i < len; i++) {
            const el = createPropertyElement(
              componentName,
              didRender,
              propsContainer,
              fiber,
              `${i}`,
              value[i],
              section,
              level + 1,
              changedKeys,
              currentPath,
              objectPathMap,
            );
            if (el) {
              content.appendChild(el);
            }
          }
        } else {
          for (const k in value) {
            const v = value[key];

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
            if (el) {
              content.appendChild(el);
            }
          }
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
              for (let i = 0, len = value.length; i < len; i++) {
                const el = createPropertyElement(
                  componentName,
                  didRender,
                  propsContainer,
                  fiber,
                  `${i}`,
                  value[i],
                  section,
                  level + 1,
                  changedKeys,
                  currentPath,
                  new WeakMap(),
                );
                if (el) {
                  content.appendChild(el);
                }
              }
            } else {
              for (const k in value) {
                const v = value[k];
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
                if (el) {
                  content.appendChild(el);
                }
              }
            }
          }
        } else {
          EXPANDED_PATHS.delete(currentPath);
          container.classList.remove('react-scan-expanded');
          content.classList.add('react-scan-hidden');
        }
      });
    } else {
      const preview = document.createElement('div');
      preview.className = 'react-scan-preview-line';
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
              (valueElement as HTMLElement).dataset.text =
                getValuePreview(value);

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
      return `&quot;${value}&quot;`;
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
      return `{${keys.slice(0, 8).join(', ')}, ...}`;
    }
    default:
      return typeof value;
  }
};

export const replayComponent = async (fiber: any) => {
  try {
    const { overrideProps, overrideHookState } = getOverrideMethods();
    if (!overrideProps || !overrideHookState || !fiber) return;

    const currentProps = fiber.memoizedProps || {};

    try {
      for (const key in currentProps) {
        overrideProps(fiber, [key], currentProps[key]);
      }
    } catch (e) {
      /**/
    }

    try {
      const state = getStateFromFiber(fiber) || {};
      for (const key in state) {
        overrideHookState(fiber, key, [], state[key]);
      }
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
