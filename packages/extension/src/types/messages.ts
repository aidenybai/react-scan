import { z } from 'zod';

export const BroadcastSchema = z.object({
  type: z.enum([
    'react-scan:ping',
    'react-scan:is-running',
    'react-scan:toggle-state',
    'react-scan:react-version',
    'react-scan:is-focused',
  ]),
  data: z.any().optional(),
});

export type BroadcastMessage = z.infer<typeof BroadcastSchema>;
