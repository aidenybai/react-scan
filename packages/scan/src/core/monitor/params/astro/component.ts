import { createElement } from 'react';
import { BaseMonitor } from '../..';
import { computeRoute } from '../utils';

export function AstroMonitor(props: {
  url?: string;
  apiKey: string;
  pathname: string;
  params: Record<string, string>;
}) {
  const path = props.pathname;
  const route = computeRoute(path, props.params);

  return createElement(BaseMonitor, {
    ...props,
    route,
    path,
  });
}
