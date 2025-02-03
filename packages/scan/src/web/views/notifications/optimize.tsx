import { useState } from 'preact/hooks';
import { cn } from '~web/utils/helpers';
import {
  GroupedFiberRender,
  NotificationEvent,
  getComponentName,
  getTotalTime,
} from './data';
import { iife } from '~core/notifications/performance-utils';

const formatReactData = (groupedFiberRenders: Array<GroupedFiberRender>) => {
  let text = '';

  const filteredFibers = groupedFiberRenders
    .toSorted((a, b) => b.totalTime - a.totalTime)
    .slice(0, 30)
    .filter((fiber) => fiber.totalTime > 5);

  filteredFibers.forEach((fiberRender) => {
    let localText = '';

    localText += 'Component Name:';
    localText += fiberRender.name;
    localText += '\n';

    localText += `Rendered: ${fiberRender.count} times\n`;
    localText += `Sum of self times for ${fiberRender.name} is ${fiberRender.totalTime.toFixed(0)}ms\n`;
    if (fiberRender.changes.props.length > 0) {
      localText += `Changed props for all ${fiberRender.name} instances ("name:count" pairs)\n`;
      fiberRender.changes.props.forEach((change) => {
        localText += `${change.name}:${change.count}x\n`;
      });
    }

    if (fiberRender.changes.state.length > 0) {
      localText += `Changed state for all ${fiberRender.name} instances ("hook index:count" pairs)\n`;
      fiberRender.changes.state.forEach((change) => {
        localText += `${change.index}:${change.count}x\n`;
      });
    }

    if (fiberRender.changes.context.length > 0) {
      localText += `Changed context for all ${fiberRender.name} instances ("context display name (if exists):count" pairs)\n`;
      fiberRender.changes.context.forEach((change) => {
        localText += `${change.name}:${change.count}x\n`;
      });
    }

    text += localText;
    text += '\n';
  });

  return text;
};

export const generateInteractionDataPrompt = ({
  renderTime,
  eHandlerTimeExcludingRenders,
  toRafTime,
  commitTime,
  framePresentTime,
  formattedReactData,
}: {
  renderTime: number;
  eHandlerTimeExcludingRenders: number;
  toRafTime: number;
  commitTime: number;
  framePresentTime: number | null;
  formattedReactData: string;
}) => {
  return `I will provide you with a set of high level, and low level performance data about an interaction in a React App:
### High level
- react component render time: ${renderTime.toFixed(0)}ms
- how long it took to run javascript event handlers (EXCLUDING REACT RENDERS): ${eHandlerTimeExcludingRenders.toFixed(0)}ms
- how long it took from the last event handler time, to the last request animation frame: ${toRafTime.toFixed(0)}ms
	- things like prepaint, style recalculations, layerization, async web API's like observers may occur during this time
- how long it took from the last request animation frame to when the dom was committed: ${commitTime.toFixed(0)}ms
	- during this period you will see paint, commit, potential style recalcs, and other misc browser activity. Frequently high times here imply css that makes the browser do a lot of work, or mutating expensive dom properties during the event handler stage. This can be many things, but it narrows the problem scope significantly when this is high
${framePresentTime && `- how long it took from dom commit for the frame to be presented: ${framePresentTime.toFixed(0)}ms. This is when information about how to paint the next frame is sent to the compositor threads, and when the GPU does work. If this is high, look for issues that may be a bottleneck for operations occurring during this time`}

### Low level
We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.
${formattedReactData}`;
};

const generateInteractionOptimizationPrompt = ({
  interactionType,
  name,
  componentPath,
  time,
  renderTime,
  eHandlerTimeExcludingRenders,
  toRafTime,
  commitTime,
  framePresentTime,
  formattedReactData,
}: {
  interactionType: string;
  name: string;
  componentPath: string;

  time: number;
  renderTime: number;
  eHandlerTimeExcludingRenders: number;
  toRafTime: number;
  commitTime: number;
  framePresentTime: number | null;
  formattedReactData: string;
}) => `You will attempt to implement a performance improvement to a user interaction in a React app. You will be provided with data about the interaction, and the slow down.

Your should split your goals into 2 parts:
- identifying the problem
- fixing the problem
	- it is okay to implement a fix even if you aren't 100% sure the fix solves the performance problem. When you aren't sure, you should tell the user to try repeating the interaction, and feeding the "Formatted Data" in the React Scan notifications optimize tab. This allows you to start a debugging flow with the user, where you attempt a fix, and observe the result. The user may make a mistake when they pass you the formatted data, so must make sure, given the data passed to you, that the associated data ties to the same interaction you were trying to debug.


Make sure to check if the user has the react compiler enabled (project dependent, configured through build tool), so you don't unnecessarily memoize components. If it is, you do not need to worry about memoizing user components

One challenge you may face is the performance problem lies in a node_module, not in user code. If you are confident the problem originates because of a node_module, there are multiple strategies, which are context dependent:
- you can try to work around the problem, knowing which module is slow
- you can determine if its possible to resolve the problem in the node_module by modifying non node_module code
- you can monkey patch the node_module to experiment and see if it's really the problem (you can modify a functions properties to hijack the call for example)
- you can determine if it's feasible to replace whatever node_module is causing the problem with a performant option (this is an extreme)

The interaction was a ${interactionType} on the component named ${name}. This component has the following ancestors ${componentPath}. This is the path from the component, to the root. This should be enough information to figure out where this component is in the user's code base

This path is the component that was clicked, so it should tell you roughly where component had an event handler that triggered a state change.

Please note that the leaf node of this path might not be user code (if they use a UI library), and they may contain many wrapper components that just pass through children that aren't relevant to the actual click. So make you sure analyze the path and understand what the user code is doing

We have a set of high level, and low level data about the performance issue.

The click took ${time.toFixed(0)}ms from interaction start, to when a new frame was presented to a user.

We also provide you with a breakdown of what the browser spent time on during the period of interaction start to frame presentation.

- react component render time: ${renderTime.toFixed(0)}ms
- how long it took to run javascript event handlers (EXCLUDING REACT RENDERS): ${eHandlerTimeExcludingRenders.toFixed(0)}ms
- how long it took from the last event handler time, to the last request animation frame: ${toRafTime.toFixed(0)}ms
	- things like prepaint, style recalculations, layerization, async web API's like observers may occur during this time
- how long it took from the last request animation frame to when the dom was committed: ${commitTime.toFixed(0)}ms
	- during this period you will see paint, commit, potential style recalcs, and other misc browser activity. Frequently high times here imply css that makes the browser do a lot of work, or mutating expensive dom properties during the event handler stage. This can be many things, but it narrows the problem scope significantly when this is high
${framePresentTime && `- how long it took from dom commit for the frame to be presented: ${framePresentTime.toFixed(0)}ms. This is when information about how to paint the next frame is sent to the compositor threads, and when the GPU does work. If this is high, look for issues that may be a bottleneck for operations occurring during this time`}


We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.

${formattedReactData}

You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So the flow should be:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 

An important thing to note is that if you see a lot of react renders (some components with very high render counts), but javascript excluding renders is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run during the JS event handler period.

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one. And it may also be the case the comparison of the hooks dependency can be expensive, and that would not be tracked in render time.

If a node_module is the component with high renders, you can experiment to see if that component is the root issue (because of hooks). You should use the same instructions for node_module debugging mentioned previously.

`;
const generateFrameDropOptimizationPrompt = ({
  renderTime,
  otherTime,
  formattedReactData,
}: {
  renderTime: number;

  otherTime: number;
  formattedReactData: string;
}) => `You will attempt to implement a performance improvement to a large slowdown in a react app

Your should split your goals into 2 parts:
- identifying the problem
- fixing the problem
	- it is okay to implement a fix even if you aren't 100% sure the fix solves the performance problem. When you aren't sure, you should tell the user to try repeating the interaction, and feeding the "Formatted Data" in the React Scan notifications optimize tab. This allows you to start a debugging flow with the user, where you attempt a fix, and observe the result. The user may make a mistake when they pass you the formatted data, so must make sure, given the data passed to you, that the associated data ties to the same interaction you were trying to debug.

Make sure to check if the user has the react compiler enabled (project dependent, configured through build tool), so you don't unnecessarily memoize components. If it is, you do not need to worry about memoizing user components

One challenge you may face is the performance problem lies in a node_module, not in user code. If you are confident the problem originates because of a node_module, there are multiple strategies, which are context dependent:
- you can try to work around the problem, knowing which module is slow
- you can determine if its possible to resolve the problem in the node_module by modifying non node_module code
- you can monkey patch the node_module to experiment and see if it's really the problem (you can modify a functions properties to hijack the call for example)
- you can determine if it's feasible to replace whatever node_module is causing the problem with a performant option (this is an extreme)


We have the high level time of how much react spent rendering, and what else the browser spent time on during this slowdown

- react component render time: ${renderTime.toFixed(0)}ms
- other time: ${otherTime}ms


We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.

${formattedReactData}

You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So the flow should be:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 

An important thing to note is that if you see a lot of react renders (some components with very high render counts), but other time is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run outside of what we profile (just react render time).

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one. And it may also be the case the comparison of the hooks dependency can be expensive, and that would not be tracked in render time.

If a node_module is the component with high renders, you can experiment to see if that component is the root issue (because of hooks). You should use the same instructions for node_module debugging mentioned previously.

If renders don't seem to be the problem, see if there are any expensive CSS properties being added/mutated, or any expensive DOM Element mutations/new elements being created that could cause this slowdown. 
`;

export const generateFrameDropExplanationPrompt = ({
  renderTime,
  otherTime,
  formattedReactData,
}: {
  renderTime: number;

  otherTime: number;
  formattedReactData: string;
}) => `Your goal will be to help me find the source of a performance problem in a React App. I collected a large dataset about this specific performance problem.

We have the high level time of how much react spent rendering, and what else the browser spent time on during this slowdown

- react component render time: ${renderTime.toFixed(0)}ms
- other time (other JavaScript, hooks like useEffect, style recalculations, layerization, paint & commit and everything else the browser might do to draw a new frame after javascript mutates the DOM): ${otherTime}ms


We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.

${formattedReactData}

You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So a flow we can go through is:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 


An important thing to note is that if you see a lot of react renders (some components with very high render counts), but other time is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run outside of what we profile (just react render time).

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one, and this can add significant overhead when thousands of effects ran.

If it's not possible to explain the root problem from this data, please ask me for more data explicitly, and what we would need to know to find the source of the performance problem.
`;

const generateFrameDropDataPrompt = ({
  renderTime,
  otherTime,
  formattedReactData,
}: {
  renderTime: number;

  otherTime: number;
  formattedReactData: string;
}) => `I will provide you with a set of high level, and low level performance data about a large frame drop in a React App:
### High level
- react component render time: ${renderTime.toFixed(0)}ms
- how long it took to run everything else (other JavaScript, hooks like useEffect, style recalculations, layerization, paint & commit and everything else the browser might do to draw a new frame after javascript mutates the DOM): ${otherTime}ms

### Low level
We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.
${formattedReactData}`;

export const generateInteractionExplanationPrompt = ({
  interactionType,
  name,
  componentPath,
  time,
  renderTime,
  eHandlerTimeExcludingRenders,
  toRafTime,
  commitTime,
  framePresentTime,
  formattedReactData,
}: {
  interactionType: string;
  name: string;
  componentPath: string;
  time: number;
  renderTime: number;
  eHandlerTimeExcludingRenders: number;
  toRafTime: number;
  commitTime: number;
  framePresentTime: number | null;
  formattedReactData: string;
}) => `Your goal will be to help me find the source of a performance problem. I collected a large dataset about this specific performance problem.

There was a ${interactionType} on a component named ${name}. This means, roughly, the component that handled the ${interactionType} event was named ${name}.

We have a set of high level, and low level data about the performance issue.

The click took ${time.toFixed(0)}ms from interaction start, to when a new frame was presented to a user.

We also provide you with a breakdown of what the browser spent time on during the period of interaction start to frame presentation.

- react component render time: ${renderTime.toFixed(0)}ms
- how long it took to run javascript event handlers (EXCLUDING REACT RENDERS): ${eHandlerTimeExcludingRenders.toFixed(0)}ms
- how long it took from the last event handler time, to the last request animation frame: ${toRafTime.toFixed(0)}ms
	- things like prepaint, style recalculations, layerization, async web API's like observers may occur during this time
- how long it took from the last request animation frame to when the dom was committed: ${commitTime.toFixed(0)}ms
	- during this period you will see paint, commit, potential style recalcs, and other misc browser activity. Frequently high times here imply css that makes the browser do a lot of work, or mutating expensive dom properties during the event handler stage. This can be many things, but it narrows the problem scope significantly when this is high
${framePresentTime && `- how long it took from dom commit for the frame to be presented: ${framePresentTime.toFixed(0)}ms. This is when information about how to paint the next frame is sent to the compositor threads, and when the GPU does work. If this is high, look for issues that may be a bottleneck for operations occurring during this time`}

We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.

${formattedReactData}


You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So a flow we can go through is:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 


An important thing to note is that if you see a lot of react renders (some components with very high render counts), but javascript excluding renders is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run during the JS event handler period.

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one. And it may also be the case the comparison of the hooks dependency can be expensive, and that would not be tracked in render time.

If it's not possible to explain the root problem from this data, please ask me for more data explicitly, and what we would need to know to find the source of the performance problem.
`;
export const getLLMPrompt = (
  activeTab: 'fix' | 'data' | 'explanation',
  selectedEvent: NotificationEvent,
) =>
  iife(() => {
    switch (activeTab) {
      case 'data': {
        switch (selectedEvent.kind) {
          case 'dropped-frames': {
            return generateFrameDropDataPrompt({
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),
              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              otherTime: selectedEvent.timing.otherTime,
            });
          }
          case 'interaction': {
            return generateInteractionDataPrompt({
              commitTime: selectedEvent.timing.frameConstruction,
              eHandlerTimeExcludingRenders: selectedEvent.timing.otherJSTime,
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),
              framePresentTime: selectedEvent.timing.frameDraw,
              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              toRafTime: selectedEvent.timing.framePreparation,
            });
          }
        }
      }
      case 'explanation': {
        switch (selectedEvent.kind) {
          case 'dropped-frames': {
            return generateFrameDropExplanationPrompt({
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),
              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              otherTime: selectedEvent.timing.otherTime,
            });
          }
          case 'interaction': {
            return generateInteractionExplanationPrompt({
              commitTime: selectedEvent.timing.frameConstruction,
              componentPath: selectedEvent.componentPath.join('>'),
              eHandlerTimeExcludingRenders: selectedEvent.timing.otherJSTime,
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),
              framePresentTime: selectedEvent.timing.frameDraw,
              interactionType: selectedEvent.type,
              name: getComponentName(selectedEvent.componentPath),
              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              time: getTotalTime(selectedEvent.timing),
              toRafTime: selectedEvent.timing.framePreparation,
            });
          }
        }
      }
      case 'fix': {
        switch (selectedEvent.kind) {
          case 'dropped-frames': {
            return generateFrameDropOptimizationPrompt({
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),

              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              otherTime: selectedEvent.timing.otherTime,
            });
          }
          case 'interaction': {
            return generateInteractionOptimizationPrompt({
              commitTime: selectedEvent.timing.frameConstruction,
              componentPath: selectedEvent.componentPath.join('>'),
              eHandlerTimeExcludingRenders: selectedEvent.timing.otherJSTime,
              formattedReactData: formatReactData(
                selectedEvent.groupedFiberRenders,
              ),
              framePresentTime: selectedEvent.timing.frameDraw,
              interactionType: selectedEvent.type,
              name: getComponentName(selectedEvent.componentPath),
              renderTime: selectedEvent.groupedFiberRenders.reduce(
                (prev, curr) => prev + curr.totalTime,
                0,
              ),
              time: getTotalTime(selectedEvent.timing),
              toRafTime: selectedEvent.timing.framePreparation,
            });
          }
        }
      }
    }
  });

export const Optimize = ({
  selectedEvent,
}: { selectedEvent: NotificationEvent }) => {
  const [activeTab, setActiveTab] = useState<'fix' | 'explanation' | 'data'>(
    'fix',
  );
  const [copying, setCopying] = useState(false);

  return (
    <div className={cn(['w-full h-full'])}>
      <div
        className={cn([
          'border border-[#27272A] rounded-sm h-4/5 text-xs overflow-hidden',
        ])}
      >
        <div className={cn(['bg-[#18181B] p-1 rounded-t-sm'])}>
          <div className={cn(['flex items-center gap-x-1'])}>
            <button
              onClick={() => setActiveTab('fix')}
              className={cn([
                'flex items-center justify-center whitespace-nowrap py-1.5 px-3 rounded-sm',
                activeTab === 'fix'
                  ? 'text-white bg-[#7521c8]'
                  : 'text-[#6E6E77] hover:text-white',
              ])}
            >
              Fix
            </button>

            <button
              onClick={() => setActiveTab('explanation')}
              className={cn([
                'flex items-center justify-center whitespace-nowrap py-1.5 px-3 rounded-sm',
                activeTab === 'explanation'
                  ? 'text-white bg-[#7521c8]'
                  : 'text-[#6E6E77] hover:text-white',
              ])}
            >
              Explanation
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={cn([
                'flex items-center justify-center whitespace-nowrap py-1.5 px-3 rounded-sm',
                activeTab === 'data'
                  ? 'text-white bg-[#7521c8]'
                  : 'text-[#6E6E77] hover:text-white',
              ])}
            >
              Data
            </button>
          </div>
        </div>
        <div className={cn(['overflow-y-auto h-full'])}>
          <pre
            className={cn([
              'p-2 h-full',
              'whitespace-pre-wrap break-words',
              'text-gray-300 font-mono ',
            ])}
          >
            {getLLMPrompt(activeTab, selectedEvent)}
          </pre>
        </div>
      </div>
      <button
        onClick={async () => {
          const text = getLLMPrompt(activeTab, selectedEvent);

          await navigator.clipboard.writeText(text);
          setCopying(true);
          setTimeout(() => setCopying(false), 1000);
        }}
        className={cn([
          'mt-4 px-4 py-2 bg-[#18181B] text-[#6E6E77] rounded-sm',
          'hover:text-white transition-colors duration-200',
          'flex items-center justify-center gap-x-2 text-xs',
        ])}
      >
        <span>{copying ? 'Copied!' : 'Copy Prompt'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn([
            'transition-transform duration-200',
            copying && 'scale-110',
          ])}
        >
          {copying ? (
            <path d="M20 6L9 17l-5-5" />
          ) : (
            <>
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
};
