import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowLeft, Send, User } from 'lucide-react';
import { Field } from '../../components/Field.jsx';
import { useSubmitContact } from './api.js';

/** Brand mark, matching the landing and auth layouts. */
function Logo({ className = 'text-brand-700' }) {
  return <span className={`text-lg font-bold tracking-tight ${className}`}>SIC Connect</span>;
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const submitContact = useSubmitContact();
  const sending = submitContact.isPending;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSent(false);
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.message.trim()) e.message = 'Please enter a message.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    await submitContact.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    });
    setForm({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Home
        </Link>
      </header>

      <section className="bg-brand-600 py-14 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Get in touch</h1>
          <p className="mt-2 max-w-xl text-white/80">
            Questions about SIC Connect or the alumni programme? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={form.name} onChange={set('name')} error={errors.name} />
                <Field label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
              </div>
              <Field label="Subject" value={form.subject} onChange={set('subject')} />
              <Field as="textarea" rows={5} label="Message" value={form.message} onChange={set('message')} error={errors.message} />
              <button type="submit" className="btn-primary" disabled={sending}>
                <Send size={16} /> {sending ? 'Sending…' : 'Send message'}
              </button>
              {sent && (
                <p className="text-sm text-emerald-600">
                  {submitContact.data?.message || "Thanks! We'll be in touch soon."}
                </p>
              )}
              {submitContact.isError && (
                <p className="text-sm text-red-600">{submitContact.error.message}</p>
              )}
            </form>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-base font-semibold text-slate-900">Contact details</h2>
              <p className="mt-1 text-xs text-slate-400">Messages reach the SIC Connect system administrator.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><User className="text-brand-600" size={16} /> SIC Administrator</li>
                <li className="flex items-center gap-2">
                  <Mail className="text-brand-600" size={16} />
                  <a href="mailto:admin@sicconnect.example" className="hover:text-brand-700">admin@sicconnect.example</a>
                </li>
                <li className="flex items-center gap-2"><MapPin className="text-brand-600" size={16} /> Samsung Innovation Campus</li>
              </ul>
            </div>
            <div className="card p-6">
              <h2 className="text-base font-semibold text-slate-900">New here?</h2>
              <p className="mt-2 text-sm text-slate-500">Create an account to join the alumni community.</p>
              <Link to="/register" className="btn-secondary mt-3">Sign up</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
