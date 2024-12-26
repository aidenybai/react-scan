/**
 * We do prototype caching for highly performant code, do not put browser specific code here without a guard.
 *
 * _{global} is also a hack that reduces the size of the bundle
 *
 * Examples:
 * @see https://github.com/ged-odoo/blockdom/blob/5849f0887ff8dc7f3f173f870ed850a89946fcfd/src/block_compiler.ts#L9
 * @see https://github.com/localvoid/ivi/blob/bd5bbe8c6b39a7be1051c16ea0a07b3df9a178bd/packages/ivi/src/client/core.ts#L13
 */

/* eslint-disable prefer-const */
/* eslint-disable import/no-mutable-exports */

/**
 * Do not destructure exports or import React from "react" here.
 * From empirical ad-hoc testing, this breaks in certain scenarios.
 */
import * as React from 'react';

/**
 * useRef will be undefined in "use server"
 *
 * @see https://nextjs.org/docs/messages/react-client-hook-in-server-component
 */
export let isRSC = !React.useRef;
export let isSSR = typeof window === 'undefined' || isRSC;

export let isTest =
  (typeof window !== 'undefined' &&
    /**
     * @see https://docs.cypress.io/faq/questions/using-cypress-faq#Is-there-any-way-to-detect-if-my-app-is-running-under-Cypress
     */
    ((window as any).Cypress ||
      /**
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver
       */
      navigator.webdriver)) ||
  /**
   * @see https://stackoverflow.com/a/60491322
   */
  // @ts-expect-error jest is a global in test
  typeof jest !== 'undefined';

export let VERSION = null!; // todo
export let PAYLOAD_VERSION = null!; // todo

export let MAX_QUEUE_SIZE = 300;
export let FLUSH_TIMEOUT = isTest
  ? 100 // Make sure there is no data loss in tests
  : process.env.NODE_ENV === 'production'
    ? 5000
    : 1000;
export let SESSION_EXPIRE_TIMEOUT = 300000; // 5 minutes
export let GZIP_MIN_LEN = 1000;
export let GZIP_MAX_LEN = 60000; // 1 minute
export let MAX_PENDING_REQUESTS = 15;
