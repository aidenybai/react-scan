'use client';
import React from 'react';
import { scan, Store } from '..';
import { initPerformanceMonitoring } from './performance';
import { getSession } from './utils';
import { computeRoute } from './params/utils';

export const BaseMonitor = ({
  url,
  apiKey,
  path,
  route,
}: { url?: string; apiKey: string } & {
  path: string;
  route: string | null;
}) => {
  if (!apiKey)
    throw new Error('Please provide a valid API key for React Scan monitoring');
  url ??= 'https://monitoring.react-scan.com/api/v1/ingest';

  Store.monitor.value ??= {
    // components: new Map(),
    pendingRequests: 0,
    url,
    apiKey,
    interactions: [],
    session: getSession().catch(() => null),
    route,
    path,
  };
  Store.monitor.value.route = route;
  Store.monitor.value.path = path;

  React.useEffect(() => {
    scan({
      enabled: true,
      showToolbar: false,
    });
    return initPerformanceMonitoring();
  }, []);

  return null;
};

export const Monitoring = ({
  url,
  apiKey,
  params,
  path,
}: { url?: string; apiKey: string } & {
  params: Record<string, string | Array<string>>;
  path: string;
}) => {
  if (!apiKey)
    throw new Error('Please provide a valid API key for React Scan monitoring');
  url ??= 'https://monitoring.react-scan.com/api/v1/ingest';

  const route = computeRoute(path, params);
  Store.monitor.value ??= {
    pendingRequests: 0,
    url,
    apiKey,
    interactions: [],
    session: getSession().catch(() => null),
    route,
    path,
  };
  Store.monitor.value.route = route;
  Store.monitor.value.path = path;

  React.useEffect(() => {
    scan({
      enabled: true,
      showToolbar: false,
    });
    return initPerformanceMonitoring();
  }, []);

  return null;
};
