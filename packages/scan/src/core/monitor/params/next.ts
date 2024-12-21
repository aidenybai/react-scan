'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation.js';
import { createElement, Suspense } from 'react';
import {
  Monitoring as BaseMonitoring,
  type MonitoringWithoutRouteProps,
} from '..';
import { computeRoute } from './utils';

/**
 * This hook works in both Next.js Pages and App Router:
 * - App Router: Uses the new useParams() hook directly
 * - Pages Router: useParams() returns empty object, falls back to searchParams
 * This fallback behavior ensures compatibility across both routing systems
 */
const useRoute = (): {
  route: string | null;
  path: string;
} => {
  const params = useParams();
  const searchParams = useSearchParams();
  const path = usePathname();

  // Until we have route parameters, we don't compute the route
  if (!params) {
    return { route: null, path };
  }
  // in Next.js@13, useParams() could return an empty object for pages router, and we default to searchParams.
  const finalParams = Object.keys(params).length
    ? (params as Record<string, string | Array<string>>)
    : Object.fromEntries(searchParams.entries());
  return { route: computeRoute(path, finalParams), path };
};
export function MonitoringInner(props: MonitoringWithoutRouteProps) {
  const { route, path } = useRoute();

  // we need to fix build so this doesn't get compiled to preact jsx
  return createElement(BaseMonitoring, {
    ...props,
    route,
    path,
  });
}

/**
 * The double 'use client' directive pattern is intentional:
 * 1. Top-level directive marks the entire module as client-side
 * 2. IIFE-wrapped component with its own directive ensures:
 *    - Component is properly tree-shaken (via @__PURE__)
 *    - Component maintains client context when code-split
 *    - Execution scope is preserved
 *
 * This pattern is particularly important for Next.js's module
 * system and its handling of Server/Client Components.
 */
export const Monitoring = /* @__PURE__ */ (() => {
  'use client';
  return function Monitoring(props: MonitoringWithoutRouteProps) {
    return createElement(
      Suspense,
      { fallback: null },
      createElement(MonitoringInner, props),
    );
  };
})();
