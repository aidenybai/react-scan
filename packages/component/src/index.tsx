'use client';
import { JSX, useEffect } from 'react';
import { Options, Store, scan } from 'react-scan';

export interface ReactScanProps extends Options {
  isInIFrame?: boolean;
}

export function ReactScan({
  isInIFrame,
  enabled,
  dangerouslyForceRunInProduction,
  log,
  showToolbar,
  animationSpeed,
  trackUnnecessaryRenders,
  onCommitFinish,
  onCommitStart,
  onPaintFinish,
  onPaintStart,
  onRender,
}: ReactScanProps): JSX.Element {
  useEffect(() => {
    Store.isInIframe.value = !!isInIFrame;
  }, [isInIFrame]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    scan({
      enabled,
      dangerouslyForceRunInProduction,
      log,
      showToolbar,
      animationSpeed,
      trackUnnecessaryRenders,
      onCommitFinish,
      onCommitStart,
      onPaintFinish,
      onPaintStart,
      onRender,
    });
    return () => {
      scan({ enabled: false });
    };
  }, [
    enabled,
    dangerouslyForceRunInProduction,
    log,
    showToolbar,
    animationSpeed,
    trackUnnecessaryRenders,
    onCommitFinish,
    onCommitStart,
    onPaintFinish,
    onPaintStart,
    onRender,
  ]);
  return <></>;
}
