import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../../../components/Field.jsx';

/**
 * Forgot-password screen — user interface only. There is no reset endpoint yet, so submitting
 * shows a neutral confirmation (which does not reveal whether an account exists). The email
 * delivery + reset-token flow is a planned backend enhancement.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    // UI-only prototype: simulate the request. No account information is revealed.
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
        <p className="mt-3 text-sm text-slate-600">
          If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a
          link to reset your password. The link expires in 30 minutes.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button
            type="button"
            className="font-semibold text-brand-600 hover:text-brand-700"
            onClick={() => setSent(false)}
          >
            try another email
          </button>
          .
        </p>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Forgot your password?</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter the email linked to your account and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          placeholder="you@example.com"
        />
        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
