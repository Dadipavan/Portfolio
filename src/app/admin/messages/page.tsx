'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, Reply, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { PageBanner } from '@/components/admin/kit';

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
        <PageBanner
          icon={Mail}
          title="Messages"
          subtitle="Sent through the contact form on your site"
          chips={messages.length > 0 ? [`${messages.length} message${messages.length === 1 ? '' : 's'}`, `${unread} unread`] : []}
        >
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </PageBanner>

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
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-gray-500">Messages from your contact form will appear here.</p>
          </div>
        )}

        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${m.is_read ? 'border-gray-200/80 bg-white' : 'border-purple-200 bg-purple-50/50 ring-1 ring-purple-100'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {!m.is_read && (
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100"
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
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/70 p-0.5">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}`}
                    className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm"
                    title="Reply by email"
                  >
                    <Reply size={16} />
                  </a>
                  <button
                    onClick={() => toggleRead(m)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-green-600 hover:shadow-sm"
                    title={m.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {m.is_read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-600 hover:shadow-sm"
                    title="Delete message"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-4 break-words whitespace-pre-wrap rounded-xl bg-white/70 p-3 text-sm leading-relaxed text-gray-800 ring-1 ring-gray-100">{m.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
