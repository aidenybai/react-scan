'use client';

import { useState } from 'react';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join waitlist');
    }
  };

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={handleSubmit} className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full border-2 border-black p-2"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-block whitespace-nowrap bg-black px-5 py-2 text-center font-medium text-white disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining...' : 'Join waitlist'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
      {status === 'success' && (
        <p className="text-sm text-green-500">Successfully joined waitlist!</p>
      )}
    </div>
  );
}
