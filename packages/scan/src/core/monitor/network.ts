import { Store } from '../..';
import {
  FLOAT_MAX_LEN,
  GZIP_MIN_LEN,
  GZIP_MAX_LEN,
  MAX_PENDING_REQUESTS,
} from './constants';
import { getSession } from './utils';
import type {
  Interaction,
  IngestRequest,
  InternalInteraction,
  Component,
} from './types';

const INTERACTION_TIME_TILL_COMPLETED = 4000;

export const flush = async (): Promise<void> => {
  const monitor = Store.monitor.value;
  if (
    !monitor ||
    !navigator.onLine ||
    !monitor.url ||
    !monitor.interactions.length
  ) {
    return;
  }
  const now = performance.now();
  // We might trigger flush before the interaction is completed,
  // so we need to split them into pending and completed by an arbitrary time.
  const pendingInteractions = new Array<InternalInteraction>();
  const completedInteractions = new Array<InternalInteraction>();

  const interactions = monitor.interactions;
  for (let i = 0; i < interactions.length; i++) {
    const interaction = interactions[i];
    if (
      now - interaction.performanceEntry.startTime <=
      INTERACTION_TIME_TILL_COMPLETED
    ) {
      pendingInteractions.push(interaction);
    } else {
      completedInteractions.push(interaction);
    }
  }

  // nothing to flush
  if (!completedInteractions.length) return;

  // idempotent
  const session = await getSession({
    commit: monitor.commit,
    branch: monitor.branch,
  }).catch(() => null);

  if (!session) return;

  const aggregatedComponents = new Array<Component>();
  const aggregatedInteractions = new Array<Interaction>();
  for (let i = 0; i < completedInteractions.length; i++) {
    const interaction = completedInteractions[i];

    // META INFORMATION IS FOR DEBUGGING THIS MUST BE REMOVED SOON
    const {
      duration,
      entries,
      id,
      inputDelay,
      latency,
      presentationDelay,
      processingDuration,
      processingEnd,
      processingStart,
      referrer,
      startTime,
      target,
      timeOrigin,
      timeSinceTabInactive,
      timestamp,
      type,
      visibilityState,
    } = interaction.performanceEntry;
    aggregatedInteractions.push({
      id: i,
      path: interaction.componentPath,
      name: interaction.componentName,
      time: duration,
      timestamp,
      type,
      // fixme: we can aggregate around url|route|commit|branch better to compress payload
      url: interaction.url,
      route: interaction.route,
      commit: interaction.commit,
      branch: interaction.branch,
      uniqueInteractionId: interaction.uniqueInteractionId,
      meta: {
        performanceEntry: {
          id,
          inputDelay,
          latency,
          presentationDelay,
          processingDuration,
          processingEnd,
          processingStart,
          referrer,
          startTime,
          target,
          timeOrigin,
          timeSinceTabInactive,
          visibilityState,
          duration: duration,
          entries: entries.map((entry) => {
            const {
              duration,
              entryType,
              interactionId,
              name,
              processingEnd,
              processingStart,
              startTime,
            } = entry;
            return {
              duration,
              entryType,
              interactionId,
              name,
              processingEnd,
              processingStart,
              startTime,
            };
          }),
        },
      },
    });

    const components = Array.from(interaction.components.entries());
    for (let j = 0; j < components.length; j++) {
      const [name, component] = components[j];
      aggregatedComponents.push({
        name,
        instances: component.fibers.size,
        interactionId: i,
        renders: component.renders,
        totalTime: component.totalTime,
      });
    }
  }

  const payload: IngestRequest = {
    interactions: aggregatedInteractions,
    components: aggregatedComponents,
    session: {
      ...session,
      url: window.location.toString(),
      route: monitor.route, // this might be inaccurate but used to caculate which paths all the unique sessions are coming from without having to join on the interactions table (expensive)
    },
  };

  monitor.pendingRequests++;
  monitor.interactions = pendingInteractions;
  try {
    transport(monitor.url, payload)
      .then(() => {
        monitor.pendingRequests--;
        // there may still be renders associated with these interaction, so don't flush just yet
      })
      .catch(async () => {
        // we let the next interval handle retrying, instead of explicitly retrying
        monitor.interactions = monitor.interactions.concat(
          completedInteractions,
        );
      });
  } catch {
    /* */
  }

  // Keep only recent interactions
  monitor.interactions = pendingInteractions;
};

const CONTENT_TYPE = 'application/json';
const supportsCompression = typeof CompressionStream === 'function';

export const compress = async (payload: string): Promise<ArrayBuffer> => {
  const stream = new Blob([payload], { type: CONTENT_TYPE })
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
};

/**
 * Modified from @palette.dev/browser:
 *
 * @see https://gist.github.com/aidenybai/473689493f2d5d01bbc52e2da5950b45#file-palette-dev-browser-dist-palette-dev-mjs-L365
 */
export const transport = async (
  url: string,
  payload: IngestRequest,
): Promise<{ ok: boolean }> => {
  const fail = { ok: false };
  /**
   * JSON.stringify replacer function is ~60-80% slower than JSON.stringify
   *
   * Perflink: https://dub.sh/json-replacer-fn
   */
  const json = JSON.stringify(payload, (key, value) => {
    // Truncate floats to 5 decimal places (long floats cause error in ClickHouse)
    if (
      typeof value === 'number' &&
      parseInt(value as any) !== value /* float check */
    ) {
      value = ~~(value * FLOAT_MAX_LEN) / FLOAT_MAX_LEN;
    }
    // Remove falsy (e.g. undefined, null, []), and keys starting with "_"
    // to reduce the size of the payload
    if (
      // eslint-disable-next-line eqeqeq
      (value != null && value !== false) ||
      (Array.isArray(value) && value.length)
    ) {
      return value;
    }
  });
  // gzip may not be worth it for small payloads,
  // only use it if the payload is large enough
  const shouldCompress = json.length > GZIP_MIN_LEN;
  const body =
    shouldCompress && supportsCompression ? await compress(json) : json;

  if (!navigator.onLine) return fail;
  const headers: any = {
    'Content-Type': CONTENT_TYPE,
    'Content-Encoding': shouldCompress ? 'gzip' : undefined,
    'x-api-key': Store.monitor.value?.apiKey,
  };
  if (shouldCompress) url += '?z=1';
  const size = typeof body === 'string' ? body.length : body.byteLength;

  return fetch(url, {
    body,
    method: 'POST',
    referrerPolicy: 'origin',
    /**
     * Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
     * fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
     * The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
     * frequently sending events right before the user is switching pages (e.g., when finishing navigation transactions).
     *
     * This is the modern alternative to the navigator.sendBeacon API.
     * @see https://javascript.info/fetch-api#keepalive
     *
     * Gotchas:
     * - `keepalive` isn't supported by Firefox
     * - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
     *   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
     *   We will therefore only activate the flag when we're below that limit.
     * - There is also a limit of requests that can be open at the same time, so we also limit this to 15.
     *
     * @see https://github.com/getsentry/sentry-javascript/pull/7553
     */
    keepalive:
      GZIP_MAX_LEN > size &&
      MAX_PENDING_REQUESTS > (Store.monitor.value?.pendingRequests ?? 0),
    priority: 'low',
    // mode: 'no-cors',
    headers,
  });
};
