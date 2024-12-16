import { createElement } from 'react';
import {
  Monitoring as BaseMonitoring,
  type MonitoringWithoutRouteProps,
} from '../..';
import { computeRoute } from '../utils';

export function AstroMonitor(
  props: {
    path: string;
    params: Record<string, string | undefined>;
  } & MonitoringWithoutRouteProps,
) {
  const path = props.path;
  const route = computeRoute(path, props.params);

  return createElement(BaseMonitoring, {
    ...props,
    route,
    path,
  });
}
