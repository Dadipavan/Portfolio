'use client';

import { TriangleAlert } from 'lucide-react';

// Shown instead of an editor when saved content could not be loaded, so nothing can be overwritten.
export default function AdminLoadError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-red-600" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-red-900">Your saved content could not be loaded</h2>
      <p className="mt-2 text-sm text-red-800">
        {message} Editing is disabled so that nothing is overwritten with sample content. Check your
        connection and the Supabase settings, then try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
