import {
  Animated,
  PanResponder,
  Pressable,
  Text as RNText,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  Group,
  matchFont,
  Rect,
  Text,
} from '@shopify/react-native-skia';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ReactScanInternals } from '..';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { assertNative, instrumentNative } from './instrument';

// can't use useSyncExternalStore for back compat
const useIsPaused = () => {
  const [isPaused, setIsPaused] = useState(ReactScanInternals.isPaused);
  useEffect(() => {
    ReactScanInternals.subscribe('isPaused', (isPaused) =>
      setIsPaused(isPaused),
    );
  }, []);

  return isPaused;
};

interface Options {
  /**
   * Controls the animation of the re-render overlay.
   * When set to "fade-out", the overlay will fade out after appearing.
   * When false, no animation will be applied.
   * Note: Enabling animations may impact performance.
   * @default false */
  animationWhenFlashing?: 'fade-out' | false;
}

export type ReactNativeScanOptions = Options &
  Omit<
    typeof ReactScanInternals.options,
    | 'playSound'
    | 'runInProduction'
    | 'includeChildren'
    | 'onPaintFinish'
    | 'onPaintStart'
    | 'animationSpeed'
  >;

const OptionsContext = createContext<
  ReactNativeScanOptions & Required<Options>
>({
  animationWhenFlashing: false,
});

const defaultOptions = {
  alwaysShowLabels: false,
  animationWhenFlashing: false as const,
  enabled: true,
  log: false,
  maxRenders: 20,
  renderCountThreshold: 0,
  report: false,
  resetCountTimeout: 5000,
  showToolbar: true,
};
type ReactScanProps = {
  children: React.ReactNode;
  options?: ReactNativeScanOptions;
};

export const ReactScan = (props: ReactScanProps) => {
  if (process.env.NODE_ENV === 'production' || !__DEV__) {
    return props.children;
  }
  return <ReactScanEntry {...props} />;
};
const ReactScanEntry = ({
  children,
  options = defaultOptions,
}: ReactScanProps) => {
  const withDefaultOptions = useMemo(
    () => ({ ...defaultOptions, ...options }),
    [
      options.alwaysShowLabels,
      options.animationWhenFlashing,
      options.enabled,
      options.log,
      options.maxRenders,
      options.report,
      options.resetCountTimeout,
      options.showToolbar,
      options.onCommitFinish,
      options.onCommitStart,
      options.onRender,
    ],
  );

  // todo: get rid of this sync, model internals as taking in context object (potentially)
  // todo: replace isPaused with options .enabled
  useEffect(() => {
    ReactScanInternals.options = withDefaultOptions;
    instrumentNative();
  }, [withDefaultOptions]);

  // explicitly only sync enabled when the enabled option chnages
  useEffect(() => {
    ReactScanInternals.isPaused = !withDefaultOptions.enabled;
  }, [withDefaultOptions.enabled]);

  const isPaused = useIsPaused();

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;

      const newActive = ReactScanInternals.activeOutlines.filter(
        (x) => Date.now() - x.updatedAt < 500,
      );
      if (newActive.length !== ReactScanInternals.activeOutlines.length) {
        ReactScanInternals.set('activeOutlines', newActive);
      }
    }, 200);
    return () => {
      clearInterval(interval);
    };
  }, [isPaused]);

  if (!withDefaultOptions.enabled) {
    return children;
  }

  return (
    <>
      {children}
      <OptionsContext.Provider value={withDefaultOptions}>
        {!isPaused && <ReactScanCanvas scanTag="react-scan-no-traverse" />}
        {withDefaultOptions.showToolbar && (
          <ReactScanToolbar
            scanTag="react-scan-no-traverse"
            isPaused={isPaused}
          />
        )}
      </OptionsContext.Provider>
    </>
  );
};

const ReactScanToolbar = ({
  isPaused,
}: {
  isPaused: boolean;
  scanTag: string;
}) => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          // @ts-expect-error its fine...
          x: pan.x._value,
          // @ts-expect-error its fine...
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  return (
    <Animated.View
      id="react-scan-no-traverse"
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 999999,
        transform: pan.getTranslateTransform(),
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={() =>
          (ReactScanInternals.isPaused = !ReactScanInternals.isPaused)
        }
        style={{
          backgroundColor: 'rgba(0,0,0,1)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: !isPaused ? '#4ADE80' : '#666',
          }}
        />
        <RNText
          style={{
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: Platform.select({
              ios: 'Courier',
              default: 'monospace',
            }),
          }}
        >
          React Scan
        </RNText>
      </Pressable>
    </Animated.View>
  );
};
const dimensions = Dimensions.get('window');
const isVisible = (x: number, y: number) => {
  return x >= 0 && x <= dimensions.width && y >= 0 && y <= dimensions.height;
};
const font = matchFont({
  fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  fontSize: 11,
  fontWeight: 'bold',
});
const getTextWidth = (text: string) => {
  return (text || 'unknown').length * 7;
};

const useOutlines = (opacity: { value: number }) => {
  const [outlines, setOutlines] = useState<
    (typeof ReactScanInternals)['activeOutlines']
  >([]);
  const options = useContext(OptionsContext);
  // cannot use useSyncExternalStore for back compat
  useEffect(() => {
    ReactScanInternals.subscribe('activeOutlines', (activeOutlines) => {
      setOutlines(activeOutlines);
      if (options.animationWhenFlashing !== false) {
        // we only support fade-out for now
        opacity.value = 1;
        opacity.value = withTiming(0, {
          duration: 500,
        });
      }
    });
  }, []);
  return outlines;
};
const ReactScanCanvas = (_: { scanTag: string }) => {
  const opacity = useSharedValue(1);
  const outlines = useOutlines(opacity);
  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: 999999,
        pointerEvents: 'none',
      }}
    >
      <Group opacity={opacity}>
        {outlines
          .filter(({ outline }) => {
            const measurement = assertNative(outline.latestMeasurement).value;
            const vis = isVisible(measurement.x, measurement.y);
            return vis;
          })
          .map((render) => {
            const textWidth = getTextWidth(render.text ?? 'unknown');
            const labelPadding = 4;
            const labelWidth = textWidth + labelPadding * 2;
            const labelHeight = 12;
            return (
              <Group key={render.id}>
                <Rect
                  x={assertNative(render.outline.latestMeasurement).value.pageX}
                  y={assertNative(render.outline.latestMeasurement).value.pageY}
                  width={
                    assertNative(render.outline.latestMeasurement).value.width
                  }
                  height={
                    assertNative(render.outline.latestMeasurement).value.height
                  }
                  color="rgba(88, 82, 185, 0.1)"
                />
                <Rect
                  x={assertNative(render.outline.latestMeasurement).value.pageX}
                  y={assertNative(render.outline.latestMeasurement).value.pageY}
                  width={
                    assertNative(render.outline.latestMeasurement).value.width
                  }
                  height={
                    assertNative(render.outline.latestMeasurement).value.height
                  }
                  color="rgba(147, 141, 255, 0.6)"
                  style="stroke"
                  strokeWidth={1}
                />
                <Rect
                  x={assertNative(render.outline.latestMeasurement).value.pageX}
                  y={
                    assertNative(render.outline.latestMeasurement).value.pageY -
                    labelHeight -
                    2
                  }
                  width={labelWidth}
                  height={labelHeight}
                  color="rgba(88, 82, 185, 0.9)"
                />
                <Text
                  x={
                    assertNative(render.outline.latestMeasurement).value.pageX +
                    labelPadding
                  }
                  y={
                    assertNative(render.outline.latestMeasurement).value.pageY -
                    5
                  }
                  // eslint-disable-next-line
                  text={render.text || 'unknown'}
                  font={font}
                  color="#FFFFFF"
                />
              </Group>
            );
          })}
      </Group>
    </Canvas>
  );
};
