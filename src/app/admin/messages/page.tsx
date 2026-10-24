'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, Reply, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setMessages(result.messages);
        setSetupRequired(false);
      } else {
        setSetupRequired(Boolean(result.setupRequired));
        setError(result.error || 'Failed to load messages');
      }
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRead = async (message: Message) => {
    const response = await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: message.id, isRead: !message.is_read }),
    });
    if (response.ok) {
      setMessages((current) =>
        current.map((m) => (m.id === message.id ? { ...m, is_read: !m.is_read } : m))
      );
    } else {
      alert('Could not update the message. Please try again.');
    }
  };

  const remove = async (message: Message) => {
    if (!confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;
    const response = await fetch(`/api/messages?id=${encodeURIComponent(message.id)}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setMessages((current) => current.filter((m) => m.id !== message.id));
    } else {
      alert('Could not delete the message. Please try again.');
    }
  };

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-500">
                Sent through the contact form on your site
                {messages.length > 0 ? ` · ${unread} unread` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"></div>
          </div>
        )}

        {!loading && setupRequired && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
          >
            <p className="font-semibold">One-time setup needed</p>
            <p className="mt-1">
              The <code>contact_messages</code> table does not exist yet. In Supabase, open{' '}
              <strong>SQL Editor</strong>, paste the contents of{' '}
              <code>database/contact_messages.sql</code> and run it. Until then the contact form on
              your site shows a &quot;temporarily unavailable&quot; message.
            </p>
          </div>
        )}

        {!loading && error && !setupRequired && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-gray-500">Messages from your contact form will appear here.</p>
          </div>
        )}

        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${m.is_read ? 'border-gray-200' : 'border-purple-300'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {!m.is_read && (
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full bg-purple-500"
                        aria-label="Unread"
                      />
                    )}
                    {m.name}
                    <span className="ml-2 font-normal break-all text-gray-500">
                      &lt;{m.email}&gt;
                    </span>
                  </p>
                  {m.subject && (
                    <p className="mt-0.5 text-sm font-medium text-gray-700">{m.subject}</p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}`}
                    className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                    title="Reply by email"
                  >
                    <Reply size={16} />
                  </a>
                  <button
                    onClick={() => toggleRead(m)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                    title={m.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {m.is_read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete message"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-3 break-words whitespace-pre-wrap text-gray-800">{m.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
