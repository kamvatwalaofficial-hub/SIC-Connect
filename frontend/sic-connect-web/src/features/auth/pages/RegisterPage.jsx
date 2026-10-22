import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Field } from '../../../components/Field.jsx';

export function RegisterPage() {
  const { register } = useAuth();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', cohort: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        cohort: form.cohort || null,
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">⏳</div>
        <h2 className="text-2xl font-bold text-slate-900">Application received</h2>
        <p className="mt-3 text-sm text-slate-600">
          {result.message ||
            'Your account has been created and is awaiting administrator approval.'}
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Join the community</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create your SIC Connect alumni account. New accounts are reviewed by an administrator
        before activation.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Field
          label="Full name"
          required
          value={form.fullName}
          onChange={update('fullName')}
          placeholder="Sipho Ndlovu"
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
        />
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <Field
    label="Password"
    type="password"
    autoComplete="new-password"
    required
    value={form.password}
    onChange={update('password')}
    placeholder="Min. 8 characters"
  />

  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      Cohort
    </label>
    <select
      value={form.cohort}
      onChange={update('cohort')}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      required
    >
      <option value="">Select a cohort</option>
      <option value="SIC-Cohort-2024">SIC-Cohort-2024</option>
      <option value="SIC-Cohort-2025">SIC-Cohort-2025</option>
      <option value="SIC-Cohort-2026">SIC-Cohort-2026</option>
    </select>
  </div>
</div>
        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
