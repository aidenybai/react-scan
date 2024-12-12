import { createElement } from 'react';
import { useRouteMatch, useLocation } from 'react-router';
import { Monitoring as BaseMonitoring, type MonitoringWithoutRouteProps} from '..';
import { computeRoute } from './utils';
import type { RouteInfo } from './types';

const useRoute = (): RouteInfo => {
  const match = useRouteMatch();
  const { pathname } = useLocation();
  const params = match?.params || {};

  if (!params) {
    return { route: null, path: pathname };
  }

  return {
    route: computeRoute(pathname, params),
    path: pathname,
  };
};

function ReactRouterV5Monitor(props: MonitoringWithoutRouteProps) {
  const { route, path } = useRoute();
  return createElement(BaseMonitoring, {
    ...props,
    route,
    path,
  });
}

export { ReactRouterV5Monitor as Monitoring };
