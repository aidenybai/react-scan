import { z } from 'zod';

/**
 *  Incoming messages (from popup to content)
 */
export const IncomingMessageSchema = z.object({
  type: z.enum(['OPEN_PANEL', 'START_SCAN', 'STOP_SCAN']),
});

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

/**
 * Outgoing messages (from content to popup)
 */
export const OutgoingMessageSchema = z.union([
  z.object({
    type: z.literal('SCAN_UPDATE'),
    reactVersion: z.string().optional(),
    componentCount: z.number().optional(),
    rerenderCount: z.number().optional(),
    status: z.string().optional(),
  }),
  z.object({
    type: z.literal('SCAN_COMPLETE'),
  }),
]);

export type OutgoingMessage = z.infer<typeof OutgoingMessageSchema>;
