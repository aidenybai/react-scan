import { IS_CLIENT } from '~web/utils/constants';
import { onIdle } from '~web/utils/helpers';
import { isSSR } from './constants';
import { Device, type Session } from './types';

interface NetworkInformation {
  connection?: {
    effectiveType?: string;
  };
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

const MOBILE_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const TABLET_PATTERN = /iPad|Tablet/i;

const getDeviceType = () => {
  const userAgent = navigator.userAgent;

  if (MOBILE_PATTERN.test(userAgent)) {
    return Device.MOBILE;
  }
  if (TABLET_PATTERN.test(userAgent)) {
    return Device.TABLET;
  }
  return Device.DESKTOP;
};

/**
 * Measure layout time
 */
export const doubleRAF = (callback: (...args: unknown[]) => void) => {
  return requestAnimationFrame(requestAnimationFrame.bind(window, callback));
};

export const generateId = () => {
  const alphabet =
    'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
  let id = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(21));
  for (let i = 0; i < 21; i++) {
    id += alphabet[63 & randomValues[i]];
  }
  return id;
};

/**
 * @see https://deviceandbrowserinfo.com/learning_zone/articles/webgl_renderer_values
 */
const getGpuRenderer = () => {
  if (!('chrome' in window)) return ''; // Prevent WEBGL_debug_renderer_info deprecation warnings in firefox
  const gl = document
    .createElement('canvas')

    // Get the specs for the fastest GPU available. This helps provide a better
    // picture of the device's capabilities.
    .getContext('webgl', { powerPreference: 'high-performance' });
  if (!gl) return '';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
};

/**
 * Session is a loose way to fingerprint / identify a session.
 *
 * Modified from @palette.dev/browser:
 * @see https://gist.github.com/aidenybai/473689493f2d5d01bbc52e2da5950b45#file-palette-dev-browser-dist-palette-dev-mjs-L554
 * DO NOT CALL THIS EVERYTIME
 */
let cachedSession: Session;
export const getSession = async ({
  commit = null,
  branch = null,
}: {
  commit?: string | null;
  branch?: string | null;
}) => {
  if (isSSR()) return null;
  if (cachedSession) {
    return cachedSession;
  }
  const id = generateId();
  const url = window.location.toString();
  /**
   * WiFi connection strength
   *
   * Potential outputs: slow-2g, 2g, 3g, 4g
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
   */
  const connection = (navigator as NetworkInformation).connection;
  const wifi = connection?.effectiveType ?? null;
  /**
   * Number of CPU threads
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency
   */
  const cpu = navigator.hardwareConcurrency;
  /**
   * Device memory (GiB)
   *
   * Potential outputs: 0.25, 0.5, 1, 2, 4, 8
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
   */
  const mem = (navigator as ExtendedNavigator).deviceMemory ?? 0;

  const gpuRendererPromise = new Promise<string | null>((resolve) => {
    onIdle(() => {
      resolve(getGpuRenderer());
    });
  });

  const session = {
    id,
    url,
    route: null,
    device: getDeviceType(),
    wifi: wifi ?? '',
    cpu,
    mem,
    gpu: await gpuRendererPromise,
    agent: navigator.userAgent,
    commit,
    branch,
    version: process.env.NPM_PACKAGE_VERSION,
  };
  cachedSession = session;
  return session;
};

export const not_globally_unique_generateId = () => {
  if (!IS_CLIENT) {
    return '0';
  }

  // @ts-expect-error
  if (window.reactScanIdCounter === undefined) {
    // @ts-expect-error
    window.reactScanIdCounter = 0;
  }
  // @ts-expect-error
  return `${++window.reactScanIdCounter}`;
};
