import { z } from 'zod';

declare global {
  // eslint-disable-next-line no-var
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: Window['__REACT_DEVTOOLS_GLOBAL_HOOK__'];
  type TTimer = ReturnType<typeof setTimeout | typeof setInterval>;
}

export const IncomingMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PING'),
  }),
  z.object({
    type: z.literal('CSP_RULES_CHANGED'),
    data: z.object({
      enabled: z.boolean(),
      domain: z.string(),
    }),
  }),
  z.object({
    type: z.literal('IS_CSP_RULES_ENABLED'),
    data: z.object({
      domain: z.string(),
    }),
  }),
  z.object({
    type: z.literal('CHECK_REACT_VERSION'),
  }),
]);

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

export type OutgoingMessage = {
  type: 'SCAN_UPDATE';
  reactVersion: string;
};
