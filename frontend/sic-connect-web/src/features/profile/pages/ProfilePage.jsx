import { useEffect, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { ErrorState } from '../../../components/EmptyState.jsx';
import { Field } from '../../../components/Field.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { SkillSelect } from '../../../components/SkillSelect.jsx';
import { EMPLOYMENT_STATUS, IT_INDUSTRIES, SIC_COHORTS, formatDate } from '../../../lib/constants.js';
import { useMyProfile, useUpdateProfile, useUploadCv, useDeleteCv } from '../api.js';
import { useApplyForMentor, useMentorEligibility } from '../../mentor/eligibilityApi.js';

const EMPTY = {
  firstName: '',
  surname: '',
  cohort: '',
  streetAddress: '',
  suburb: '',
  province: '',
  country: '',
  industry: '',
  employmentStatus: 'Unspecified',
  headline: '',
  bio: '',
  linkedInUrl: '',
  gitHubUrl: '',
  avatarUrl: '', // preserved from the API; no longer edited directly (field removed)
  cvUrl: '',
  isMentor: false,
};

// The API stores a single fullName / location string. We collect these atomically in the
// UI (for correct data entry) and compose/decompose them here, keeping the backend contract
// unchanged and fully backward-compatible.
function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', surname: parts.slice(1).join(' ') };
}
function joinName(firstName, surname) {
  return `${(firstName || '').trim()} ${(surname || '').trim()}`.trim();
}
function splitLocation(location = '') {
  const p = location.split(',').map((t) => t.trim());
  return {
    streetAddress: p[0] || '',
    suburb: p[1] || '',
    province: p[2] || '',
    country: p.slice(3).join(', '),
  };
}
function joinLocation(f) {
  return [f.streetAddress, f.suburb, f.province, f.country]
    .map((t) => (t || '').trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Alumni-only card: real "Apply to Become a Mentor" flow gated on recognition XP and a
 * complete profile. The button stays disabled (grey) with live progress until the alumnus
 * qualifies, then submits an application that notifies administrators to review.
 */
function AlumniMentorCard() {
  const { data: elig, isLoading } = useMentorEligibility();
  const apply = useApplyForMentor();

  const pct = elig && elig.requiredXp > 0
    ? Math.min(100, Math.round((elig.xp / elig.requiredXp) * 100))
    : 0;
  const applied = apply.isSuccess;
  const canApply = Boolean(elig?.isEligible) && !applied;

  return (
    <div className="card space-y-3 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mentorship</h3>
        {elig && !elig.alreadyMentor && (
          <Badge tone={elig.isEligible ? 'green' : 'slate'}>{elig.isEligible ? 'Eligible' : 'Locked'}</Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Checking your eligibility…</p>
      ) : elig?.alreadyMentor ? (
        <p className="text-sm text-slate-500">You’re already a mentor. Thank you for giving back! 🎓</p>
      ) : (
        <>
          {/* XP progress toward the mentor threshold. */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Recognition XP</span>
              <span className="font-semibold text-slate-700">{elig.xp} / {elig.requiredXp} XP</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${elig.isEligible ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button
            className={`w-full ${canApply ? 'btn-primary' : 'btn-secondary cursor-not-allowed opacity-60'}`}
            type="button"
            disabled={!canApply || apply.isPending}
            onClick={() => canApply && apply.mutate()}
            title={canApply ? 'Submit your mentor application' : 'Reach the required XP and complete your profile to apply.'}
          >
            {applied ? 'Application submitted ✓' : apply.isPending ? 'Submitting…' : 'Apply to Become a Mentor'}
          </button>

          {applied ? (
            <p className="text-xs text-emerald-600">{apply.data?.message || 'Your application has been submitted for review.'}</p>
          ) : apply.isError ? (
            <p className="text-xs text-red-600">{apply.error.message}</p>
          ) : elig.isEligible ? (
            <p className="text-xs text-slate-500">You’ve met the requirements — submit your application and an admin will review it.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">To unlock mentor applications:</p>
              <ul className="space-y-0.5 text-xs text-slate-500">
                {(elig.unmetRequirements || []).map((r) => (
                  <li key={r} className="flex items-start gap-1.5">
                    <span className="text-slate-300">○</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadCv = useUploadCv();
  const deleteCv = useDeleteCv();

  const [form, setForm] = useState(EMPTY);
  const [skills, setSkills] = useState([]);
  const [certs, setCerts] = useState([]);
  const [saved, setSaved] = useState(false);
  const [cvError, setCvError] = useState('');
  const cvInputRef = useRef(null);

  const onCvSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setCvError('');
    if (file.type !== 'application/pdf') { setCvError('Please choose a PDF file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setCvError('The CV must be 5 MB or smaller.'); return; }
    try {
      const res = await uploadCv.mutateAsync(file);
      setForm((f) => ({ ...f, cvUrl: res.cvUrl || '' }));
      setSaved(false);
    } catch (err) {
      setCvError(err.message || 'Upload failed. Please try again.');
    }
  };

  const onCvRemove = async () => {
    setCvError('');
    try {
      await deleteCv.mutateAsync();
      setForm((f) => ({ ...f, cvUrl: '' }));
    } catch (err) {
      setCvError(err.message || 'Could not remove the CV.');
    }
  };

  useEffect(() => {
    if (profile) {
      const { firstName, surname } = splitName(profile.fullName || '');
      const addr = splitLocation(profile.location || '');
      setForm({
        firstName,
        surname,
        cohort: profile.cohort || '',
        streetAddress: addr.streetAddress,
        suburb: addr.suburb,
        province: addr.province,
        country: addr.country,
        industry: profile.industry || '',
        employmentStatus: profile.employmentStatus || 'Unspecified',
        headline: profile.headline || '',
        bio: profile.bio || '',
        linkedInUrl: profile.linkedInUrl || '',
        gitHubUrl: profile.gitHubUrl || '',
        avatarUrl: profile.avatarUrl || '',
        cvUrl: profile.cvUrl || '',
        isMentor: Boolean(profile.isMentor),
      });
      setSkills((profile.skills || []).map((s) => s.name).filter(Boolean));
      setCerts((profile.certifications || []).map((c) => ({
        name: c.name || '',
        issuer: c.issuer || '',
        issuedOn: c.issuedOn ? c.issuedOn.slice(0, 10) : '',
        credentialUrl: c.credentialUrl || '',
      })));
    }
  }, [profile]);

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const setCert = (idx, key) => (e) => {
    const value = e.target.value;
    setCerts((list) => list.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
    setSaved(false);
  };
  const addCert = () => setCerts((list) => [...list, { name: '', issuer: '', issuedOn: '', credentialUrl: '' }]);
  const removeCert = (idx) => setCerts((list) => list.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    const skillsPayload = skills.map((name) => ({ name, level: null }));

    const certifications = certs
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        issuer: c.issuer || null,
        issuedOn: c.issuedOn || null,
        credentialUrl: c.credentialUrl || null,
      }));

    await updateProfile.mutateAsync({
      fullName: joinName(form.firstName, form.surname),
      cohort: form.cohort || null,
      location: joinLocation(form) || null,
      industry: form.industry || null,
      employmentStatus: form.employmentStatus,
      headline: form.headline || null,
      bio: form.bio || null,
      linkedInUrl: form.linkedInUrl || null,
      gitHubUrl: form.gitHubUrl || null,
      avatarUrl: form.avatarUrl || null, // preserved (field removed from the UI)
      cvUrl: form.cvUrl || null,
      isMentor: form.isMentor,
      skills: skillsPayload,
      certifications,
    });
    setSaved(true);
  };

  if (isLoading) return <Spinner label="Loading your profile…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Keep your details current so the community and Samsung can find you."
        actions={<Badge tone={profile.role === 'Admin' ? 'purple' : profile.role === 'Mentor' ? 'amber' : 'brand'}>{profile.role}</Badge>}
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card space-y-4 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Basics</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" required value={form.firstName} onChange={update('firstName')} placeholder="e.g. Grace" />
              <Field label="Surname" required value={form.surname} onChange={update('surname')} placeholder="e.g. Dlamini" />
              <Field label="Headline" value={form.headline} onChange={update('headline')} placeholder="e.g. Frontend Developer" />
              <Field label="Cohort" as="select" value={form.cohort} onChange={update('cohort')}>
                <option value="">Select cohort…</option>
                {form.cohort && !SIC_COHORTS.includes(form.cohort) && <option value={form.cohort}>{form.cohort}</option>}
                {SIC_COHORTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Field>
              <Field label="Industry" as="select" value={form.industry} onChange={update('industry')}>
                <option value="">Select industry…</option>
                {form.industry && !IT_INDUSTRIES.includes(form.industry) && <option value={form.industry}>{form.industry}</option>}
                {IT_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </Field>
              <Field label="Employment status" as="select" value={form.employmentStatus} onChange={update('employmentStatus')}>
                {EMPLOYMENT_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Field>
            </div>

            <div>
              <label className="label">Address</label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address" value={form.streetAddress} onChange={update('streetAddress')} placeholder="e.g. 12 Innovation Street" />
                </div>
                <Field label="Suburb" value={form.suburb} onChange={update('suburb')} placeholder="e.g. Braamfontein" />
                <Field label="Province" value={form.province} onChange={update('province')} placeholder="e.g. Gauteng" />
                <Field label="Country" value={form.country} onChange={update('country')} placeholder="e.g. South Africa" />
              </div>
            </div>

            <Field label="Bio" as="textarea" rows={4} value={form.bio} onChange={update('bio')} placeholder="Tell the community about yourself…" />
            <div>
              <label className="label">Skills</label>
              <SkillSelect value={skills} onChange={(next) => { setSkills(next); setSaved(false); }} />
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Certifications</h3>
              <button className="btn-secondary" type="button" onClick={addCert}>+ Add</button>
            </div>
            {certs.length === 0 && <p className="text-sm text-slate-400">No certifications added yet.</p>}
            {certs.map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-2">
                <Field label="Name" value={c.name} onChange={setCert(idx, 'name')} placeholder="e.g. Azure Fundamentals" />
                <Field label="Issuer" value={c.issuer} onChange={setCert(idx, 'issuer')} placeholder="e.g. Microsoft" />
                <Field label="Issued on" type="date" value={c.issuedOn} onChange={setCert(idx, 'issuedOn')} />
                <Field label="Credential URL" value={c.credentialUrl} onChange={setCert(idx, 'credentialUrl')} placeholder="https://…" />
                <button className="text-left text-xs text-red-600 hover:underline" type="button" onClick={() => removeCert(idx)}>
                  Remove certification
                </button>
              </div>
            ))}
          </div>

          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Digital Achievement Badges</h3>
              {(profile.badges?.length ?? 0) > 0 && <Badge tone="amber">{profile.badges.length} earned</Badge>}
            </div>
            {(profile.badges?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">
                No badges yet — earn badges by completing your profile, uploading projects, attending
                events, and growing your network.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.badges.map((b) => (
                  <div key={b.id ?? b.title} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xl">{b.icon || '🏆'}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-slate-800">{b.title}</span>
                        {b.rarity && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{b.rarity}</span>}
                      </div>
                      {b.description && <p className="text-xs text-slate-500">{b.description}</p>}
                      {b.unlockedAt && <p className="mt-0.5 text-[11px] text-slate-400">Unlocked {formatDate(b.unlockedAt)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Links & CV</h3>
            <Field label="LinkedIn URL" value={form.linkedInUrl} onChange={update('linkedInUrl')} placeholder="https://linkedin.com/in/…" />
            <Field label="GitHub URL" value={form.gitHubUrl} onChange={update('gitHubUrl')} placeholder="https://github.com/…" />
            <div>
              <label className="label">CV / résumé (PDF)</label>
              {form.cvUrl ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
                  <a
                    href={form.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <FileText size={16} className="shrink-0" />
                    <span className="truncate">View current CV</span>
                  </a>
                  <button
                    type="button"
                    onClick={onCvRemove}
                    disabled={deleteCv.isPending}
                    className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-60"
                  >
                    {deleteCv.isPending ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No CV uploaded yet.</p>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onCvSelect}
              />
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                disabled={uploadCv.isPending}
                className="btn-secondary mt-2 w-full"
              >
                <Upload size={16} />
                {uploadCv.isPending ? 'Uploading…' : form.cvUrl ? 'Replace PDF' : 'Upload PDF'}
              </button>
              {cvError && <p className="mt-1 text-xs text-red-600">{cvError}</p>}
              <p className="mt-1 text-xs text-slate-400">PDF only, up to 5 MB — uploaded from your device.</p>
            </div>
          </div>

          {profile.role === 'Mentor' && (
            <div className="card space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mentor Availability</h3>
                <Badge tone={form.isMentor ? 'green' : 'slate'}>{form.isMentor ? 'Available' : 'Unavailable'}</Badge>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.isMentor} onChange={update('isMentor')} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Available to Mentor
              </label>
              <p className="text-xs text-slate-500">
                {form.isMentor
                  ? 'You’re marked Available — alumni searching for mentors can find you in mentor discovery.'
                  : 'You’re marked Unavailable — you’re hidden from the mentor discovery list. Tick the box to become discoverable.'}
              </p>
            </div>
          )}

          {profile.role === 'Alumni' && <AlumniMentorCard />}

          <div>
            <button className="btn-primary w-full" type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </button>
            {saved && <p className="mt-2 text-center text-sm text-emerald-600">Profile saved.</p>}
            {updateProfile.isError && <p className="mt-2 text-center text-sm text-red-600">{updateProfile.error.message}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
