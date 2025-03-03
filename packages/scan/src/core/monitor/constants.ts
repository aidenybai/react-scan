/**
 * We do prototype caching for highly performant code, do not put browser specific code here without a guard.
 *
 * _{global} is also a hack that reduces the size of the bundle
 *
 * Examples:
 * @see https://github.com/ged-odoo/blockdom/blob/5849f0887ff8dc7f3f173f870ed850a89946fcfd/src/block_compiler.ts#L9
 * @see https://github.com/localvoid/ivi/blob/bd5bbe8c6b39a7be1051c16ea0a07b3df9a178bd/packages/ivi/src/client/core.ts#L13
 */

/**
 * Do not destructure exports or import React from "react" here.
 * From empirical ad-hoc testing, this breaks in certain scenarios.
 */
import * as React from 'react';
import { IS_CLIENT } from '~web/utils/constants';

/**
 * useRef will be undefined in "use server"
 *
 * @see https://nextjs.org/docs/messages/react-client-hook-in-server-component
 */
const isRSC = () => !React.useRef;
export const isSSR = () => !IS_CLIENT || isRSC();

interface WindowWithCypress extends Window {
  Cypress?: unknown;
}

export const isTest =
  (IS_CLIENT &&
    /**
     * @see https://docs.cypress.io/faq/questions/using-cypress-faq#Is-there-any-way-to-detect-if-my-app-is-running-under-Cypress
     */
    ((window as WindowWithCypress).Cypress ||
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver
       */
      navigator.webdriver)) ||
  /**
   * @see https://stackoverflow.com/a/60491322
   */
  // @ts-expect-error jest is a global in test
  typeof jest !== 'undefined';

export const VERSION = null; // todo
export const PAYLOAD_VERSION = null; // todo

export const MAX_QUEUE_SIZE = 300;
export const FLUSH_TIMEOUT = isTest
  ? 100 // Make sure there is no data loss in tests
  : process.env.NODE_ENV === 'production'
    ? 5000
    : 1000;
export const SESSION_EXPIRE_TIMEOUT = 300000; // 5 minutes
export const GZIP_MIN_LEN = 1000;
export const GZIP_MAX_LEN = 60000; // 1 minute
export const MAX_PENDING_REQUESTS = 15;
