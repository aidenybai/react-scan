import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

/**
 * Add a user to the waitlist
 *
 * @example
 * fetch("/api/waitlist", {
 *   method: "POST",
 *   body: JSON.stringify({ email, name }),
 * })
 * name is optional, if provided it will be split into first and last name
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = schema.parse(body);
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName: name?.split(' ')[0],
        lastName: name?.split(' ')[1],
        source: 'monitoring waitlist',
      }),
    };

    const response = await fetch(
      'https://app.loops.so/api/v1/contacts/create',
      options,
    );
    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({ error: data.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 },
    );
  }
}
