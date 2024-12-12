import { createElement } from 'react';
import { Monitoring as BaseMonitoring, type MonitoringWithoutRouteProps } from '../..';
import { computeRoute } from '../utils';

export function AstroMonitor(props: {
  url?: string;
  apiKey: string;
  pathname: string;
  params: Record<string, string>;
} & MonitoringWithoutRouteProps) {
  const path = props.pathname;
  const route = computeRoute(path, props.params);

  return createElement(BaseMonitoring, {
    ...props,
    route,
    path,
  });
}
