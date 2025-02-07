// import { useCallback } from 'preact/hooks';
// import { ReactScanInternals, setOptions } from '~core/index';
// import { Toggle } from '~web/components/toggle';
// import { useDelayedValue } from '~web/hooks/use-mount-delay';
// import { signalIsSettingsOpen } from '~web/state';
// import { cn } from '~web/utils/helpers';

// // todo settings
// /**
//  *
//  * - chose a component to inspect, persist page refresh, could have a reactive listener... or can do it in an interval to avoid accidently doing to heavy of logic
//  * an abstraction is likely needed to read debounced/ non memory leaked state, eh todo
//  * - only show on a certain page
//  * lets see what else ca we do..........
//  * unnecessary renders is good
//  * animation speed perchance?
//  * minimal mode
//  * magnetic behavior
//  */
// export const Settings = () => {
//   const isSettingsOpen = signalIsSettingsOpen.value;
//   const isMounted = useDelayedValue(isSettingsOpen, 0, 1000);

//   const onSoundToggle = useCallback(() => {
//     const newSoundState = !ReactScanInternals.options.value.playSound;
//     setOptions({ playSound: newSoundState });
//   }, []);

//   const onToggle = useCallback((e: Event) => {
//     const target = e.currentTarget as HTMLInputElement;
//     const type = target.dataset.type;
//     const value = target.checked;

//     if (type) {
//       setOptions({ [type]: value });
//     }
//   }, []);

//   return (
//     <div
//       className={cn(
//         'react-scan-settings',
//         'opacity-0',
//         'max-h-0',
//         'overflow-hidden',
//         'transition-opacity delay-0',
//         'pointer-events-none',
//         {
//           'opacity-100 delay-300 pointer-events-auto max-h-["auto"]': isSettingsOpen,
//         },
//       )}
//     >
//       {isMounted && (
//         <>
//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.playSound })}>
//             Play Sound
//             <Toggle
//               checked={!!ReactScanInternals.options.value.playSound}
//               onChange={onSoundToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.includeChildren })}>
//             Include Children
//             <Toggle
//               data-type="includeChildren"
//               checked={!!ReactScanInternals.options.value.includeChildren}
//               onChange={onToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.log })}>
//             Log renders to the console
//             <Toggle
//               data-type="log"
//               checked={!!ReactScanInternals.options.value.log}
//               onChange={onToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.report })}>
//             Report data to getReport()
//             <Toggle
//               data-type="report"
//               checked={!!ReactScanInternals.options.value.report}
//               onChange={onToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.alwaysShowLabels })}>
//             Always show labels
//             <Toggle
//               data-type="alwaysShowLabels"
//               checked={!!ReactScanInternals.options.value.alwaysShowLabels}
//               onChange={onToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.smoothlyAnimateOutlines })}>
//             Show labels on hover
//             <Toggle
//               data-type="smoothlyAnimateOutlines"
//               checked={!!ReactScanInternals.options.value.smoothlyAnimateOutlines}
//               onChange={onToggle}
//             />
//           </div>

//           <div className={cn({ 'text-white': !!ReactScanInternals.options.value.trackUnnecessaryRenders })}>
//             Track unnecessary renders
//             <Toggle
//               data-type="trackUnnecessaryRenders"
//               checked={!!ReactScanInternals.options.value.trackUnnecessaryRenders}
//               onChange={onToggle}
//             />
//           </div>
//         </>
//       )}
//     </div>
//   );
// };
