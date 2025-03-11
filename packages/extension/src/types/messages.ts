import { z } from 'zod';

export const BroadcastSchema = z.object({
  type: z.enum([
    'react-scan:ping',
    'react-scan:is-enabled',
    'react-scan:toggle-state',
    'react-scan:page-reload',
  ]),
  data: z.any().optional(),
});

export type BroadcastMessage = z.infer<typeof BroadcastSchema>;

export interface IEvents {
  'react-scan:toggle-state': {
    topic: 'react-scan:toggle-state';
    message: undefined;
  };
  'react-scan:send-to-background': {
    topic: 'react-scan:send-to-background';
    message: BroadcastMessage;
  };
}
