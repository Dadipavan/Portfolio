'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send, TriangleAlert } from 'lucide-react';
import { usePortfolio } from './PortfolioProvider';

type Status = 'idle' | 'sending' | 'success' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

export default function ContactForm({ fallbackEmail }: { fallbackEmail: string }) {
  const { t, settings } = usePortfolio();
  const topics = settings.contactTopics;
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    // the first topic is the ordinary one and is not added to the subject
    const reason = data.reason && data.reason !== topics[0] ? data.reason : '';
    const body = {
      name: data.name,
      email: data.email,
      subject: [reason, data.subject].filter(Boolean).join(': '),
      message: data.message,
      website: data.website ?? '',
    };

    setStatus('sending');
    setErrors({});
    setMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        setStatus('success');
        setMessage(t('contact.form.success'));
        form.reset();
        return;
      }

      setStatus('error');
      setErrors(result.fieldErrors ?? {});
      setMessage(result.error || 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setMessage(`Could not reach the server. Please email ${fallbackEmail} instead.`);
    }
  };

  const describedBy = (name: keyof FieldErrors) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form
      onSubmit={onSubmit}
      noValidate={false}
      className="card space-y-5 p-6 sm:p-8"
      aria-label="Contact form"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-ink mb-1.5 block text-sm font-medium">
            {t('contact.form.name')}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name')}
            className="field"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-ink mb-1.5 block text-sm font-medium">
            {t('contact.form.email')}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy('email')}
            className="field"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-5 ${topics.length > 0 ? 'sm:grid-cols-2' : ''}`}>
        {topics.length > 0 && (
          <div>
            <label htmlFor="contact-reason" className="text-ink mb-1.5 block text-sm font-medium">
              {t('contact.form.topic')}
            </label>
            <select id="contact-reason" name="reason" defaultValue={topics[0]} className="field">
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="contact-subject" className="text-ink mb-1.5 block text-sm font-medium">
            {t('contact.form.subject')}{' '}
            <span className="text-muted font-normal">{t('contact.form.optional')}</span>
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            maxLength={120}
            className="field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-ink mb-1.5 block text-sm font-medium">
          {t('contact.form.message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={6}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
          className="field resize-y"
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive technology, bots tend to fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-primary disabled:opacity-60"
        >
          {status === 'sending' ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Send aria-hidden="true" className="h-4 w-4" />
          )}
          {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
        </button>

        <div aria-live="polite" className="text-sm">
          {status === 'success' && (
            <p role="status" className="flex items-center gap-2 font-medium text-green-700">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {message}
            </p>
          )}
          {status === 'error' && (
            <p role="alert" className="flex items-center gap-2 font-medium text-red-600">
              <TriangleAlert aria-hidden="true" className="h-4 w-4" />
              {message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
