import { useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner.jsx';
import { ErrorState } from '../../components/EmptyState.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Field } from '../../components/Field.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EMPLOYMENT_STATUS, formatDate, labelFor } from '../../lib/constants.js';
import { useAdminUsers, useDeleteUser, useUpdateUserRole } from './api.js';

const ROLES = ['Alumni', 'Mentor', 'Admin'];

function roleTone(role) {
  return role === 'Admin' ? 'purple' : role === 'Mentor' ? 'amber' : 'brand';
}

function SortHeader({ label, sortKey, active, dir, onSort, className = '' }) {
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-slate-700" onClick={() => onSort(sortKey)}>
        {label}
        <span className="text-slate-300">{active ? (dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}

export function UsersManagementSection() {
  const { user: me } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [cohort, setCohort] = useState('');
  const [employment, setEmployment] = useState('');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });

  const cohorts = useMemo(
    () => [...new Set((data || []).map((u) => u.cohort).filter(Boolean))].sort(),
    [data],
  );

  const rows = useMemo(() => {
    let list = data || [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          (u.skills || []).some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (role) list = list.filter((u) => u.role === role);
    if (cohort) list = list.filter((u) => u.cohort === cohort);
    if (employment) list = list.filter((u) => u.employmentStatus === employment);
    if (location) list = list.filter((u) => (u.location || '').toLowerCase().includes(location.trim().toLowerCase()));

    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });
  }, [data, search, role, cohort, employment, location, sort]);

  const onSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const onRoleChange = (id, newRole) => updateRole.mutate({ id, role: newRole });
  const onDelete = (id) => {
    if (window.confirm('Delete this user? This cannot be undone.')) deleteUser.mutate(id);
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Search, filter, sort, and manage alumni accounts.</p>
        </div>
        <Badge tone="slate">{rows.length} shown</Badge>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, skill…" />
        <Field label="Role" as="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Field>
        <Field label="Cohort" as="select" value={cohort} onChange={(e) => setCohort(e.target.value)}>
          <option value="">All cohorts</option>
          {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
        </Field>
        <Field label="Employment" as="select" value={employment} onChange={(e) => setEmployment(e.target.value)}>
          <option value="">Any status</option>
          {EMPLOYMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Field>
        <Field label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cape Town" />
      </div>

      {isLoading ? (
        <Spinner label="Loading users…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <SortHeader label="Name" sortKey="fullName" active={sort.key === 'fullName'} dir={sort.dir} onSort={onSort} />
                <SortHeader label="Email" sortKey="email" active={sort.key === 'email'} dir={sort.dir} onSort={onSort} />
                <SortHeader label="Cohort" sortKey="cohort" active={sort.key === 'cohort'} dir={sort.dir} onSort={onSort} />
                <th className="px-4 py-3">Employment</th>
                <SortHeader label="Joined" sortKey="createdAt" active={sort.key === 'createdAt'} dir={sort.dir} onSort={onSort} />
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => {
                const isMe = u.id === me.userId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.fullName || '—'}
                      {u.isMentor && <Badge tone="amber" className="ml-2">Mentor</Badge>}
                      {u.status && u.status !== 'Approved' && (
                        <Badge tone={u.status === 'Rejected' ? 'red' : 'amber'} className="ml-2">{u.status}</Badge>
                      )}
                      {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                      {u.location && <div className="text-xs font-normal text-slate-400">📍 {u.location}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.cohort || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{labelFor(EMPLOYMENT_STATUS, u.employmentStatus)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                        <select
                          className="input max-w-[8rem] py-1"
                          value={u.role}
                          disabled={isMe || updateRole.isPending}
                          onChange={(e) => onRoleChange(u.id, e.target.value)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        onClick={() => onDelete(u.id)}
                        disabled={isMe || deleteUser.isPending}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {(updateRole.isError || deleteUser.isError) && (
        <p className="mt-3 text-sm text-red-600">{(updateRole.error || deleteUser.error)?.message}</p>
      )}
    </section>
  );
}
