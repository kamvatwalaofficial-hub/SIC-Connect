/**
 * In-browser mock of the SIC Connect API, used only by the demo build (VITE_DEMO=true).
 *
 * It plugs into Axios as a custom adapter, so the rest of the app is unchanged. Routes,
 * response shapes, permissions and scoring mirror the ASP.NET Core API (see backend/).
 * State lives in the visitor's own localStorage, so each visitor gets a private sandbox
 * that can be reset at any time. Nothing is sent over the network.
 */
import { AxiosError } from 'axios';
import { buildInitialState } from './data.js';

const STORAGE_KEY = 'sic_connect_demo_state_v1';
const LATENCY_MS = 180;

// Same weights as backend RecognitionScoring.
const XP = { skill: 10, certification: 25, project: 20, connection: 5, event: 15 };
const MENTOR_XP_THRESHOLD = 150;

// ---------------------------------------------------------------- state

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 1) {
        // Blob URLs for uploaded CVs do not survive a page reload.
        parsed.users.forEach((u) => {
          if (u.profile?.cvUrl?.startsWith('blob:')) u.profile.cvUrl = null;
        });
        return parsed;
      }
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return buildInitialState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota: the demo still works for this session */
  }
}

/** Restore the original sample data (used by the demo banner's Reset button). */
export function resetDemo() {
  state = buildInitialState();
  save();
}

const nextId = () => state.seq++;
const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------- errors

class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const badRequest = (m) => new ApiError(400, m);
const unauthorized = (m = 'Your session has expired. Please sign in again.') => new ApiError(401, m);
const forbidden = (m = 'You do not have permission to do that.') => new ApiError(403, m);
const notFound = (m) => new ApiError(404, m);
const conflict = (m) => new ApiError(409, m);

// ---------------------------------------------------------------- helpers

const userById = (id) => state.users.find((u) => u.id === Number(id));
const must = (value, message) => {
  if (!value) throw notFound(message);
  return value;
};
const lc = (s) => (s ?? '').toString().trim().toLowerCase();

function isConnected(a, b) {
  return state.connections.some(
    (c) =>
      c.status === 'Accepted' &&
      ((c.requesterId === a && c.addresseeId === b) || (c.requesterId === b && c.addresseeId === a)),
  );
}

function notify(userId, message, link = null) {
  state.notifications.push({ id: nextId(), userId, message, link, isRead: false, createdAt: nowIso() });
}
function notifyAdmins(message, link) {
  state.users.filter((u) => u.role === 'Admin').forEach((a) => notify(a.id, message, link));
}

function xpFor(user) {
  const p = user.profile;
  const connections = state.connections.filter(
    (c) => c.status === 'Accepted' && (c.requesterId === user.id || c.addresseeId === user.id),
  ).length;
  const events = state.registrations.filter((r) => r.userId === user.id).length;
  return (
    p.skills.length * XP.skill +
    p.certifications.length * XP.certification +
    p.projects.length * XP.project +
    connections * XP.connection +
    events * XP.event
  );
}

// ---------------------------------------------------------------- DTO mappers

const projectDto = (p) => ({ ...p });
const opportunityDto = (o) => ({ ...o });

function profileDto(u) {
  const p = u.profile;
  return {
    id: p.id,
    userId: u.id,
    email: u.email,
    fullName: p.fullName,
    cohort: p.cohort,
    location: p.location,
    industry: p.industry,
    employmentStatus: p.employmentStatus,
    bio: p.bio,
    headline: p.headline,
    avatarUrl: p.avatarUrl,
    linkedInUrl: p.linkedInUrl,
    gitHubUrl: p.gitHubUrl,
    cvUrl: p.cvUrl,
    isMentor: p.isMentor,
    role: u.role,
    skills: p.skills.map((s) => ({ ...s })),
    certifications: p.certifications.map((c) => ({ ...c })),
    projects: p.projects.map(projectDto),
  };
}

function directoryItem(u) {
  const p = u.profile;
  return {
    userId: u.id,
    fullName: p.fullName,
    cohort: p.cohort,
    location: p.location,
    industry: p.industry,
    employmentStatus: p.employmentStatus,
    headline: p.headline,
    avatarUrl: p.avatarUrl,
    isMentor: p.isMentor,
    skills: p.skills.map((s) => s.name),
    linkedInUrl: p.linkedInUrl,
    gitHubUrl: p.gitHubUrl,
  };
}

function adminUserDto(u) {
  const p = u.profile;
  return {
    id: u.id,
    email: u.email,
    fullName: p.fullName,
    role: u.role,
    status: u.status,
    cohort: p.cohort,
    location: p.location,
    employmentStatus: p.employmentStatus,
    isMentor: p.isMentor,
    skills: p.skills.map((s) => s.name),
    createdAt: u.createdAt,
  };
}

function approvalDto(u) {
  const p = u.profile;
  return {
    userId: u.id,
    email: u.email,
    fullName: p.fullName,
    role: u.role,
    cohort: p.cohort,
    location: p.location,
    industry: p.industry,
    headline: p.headline,
    skills: p.skills.map((s) => s.name),
    status: u.status,
    reviewNote: u.reviewNote,
    requestedAt: u.createdAt,
    reviewedAt: u.reviewedAt,
  };
}

function eventDto(e, me) {
  const regs = state.registrations.filter((r) => r.eventId === e.id);
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    venue: e.venue,
    isOnline: e.isOnline,
    capacity: e.capacity,
    registrationCount: regs.length,
    isRegistered: regs.some((r) => r.userId === me.id),
    createdAt: e.createdAt,
  };
}

function applicationDto(a) {
  const o = state.opportunities.find((x) => x.id === a.opportunityId);
  const applicant = userById(a.userId);
  return {
    id: a.id,
    opportunityId: a.opportunityId,
    opportunityTitle: o?.title ?? 'Removed opportunity',
    organisation: o?.organisation ?? '',
    opportunityType: o?.type ?? 'Job',
    applicantUserId: a.userId,
    applicantName: applicant?.profile.fullName ?? applicant?.email ?? 'Unknown',
    status: a.status,
    coverNote: a.coverNote,
    createdAt: a.createdAt,
  };
}

function connectionDto(c, meId) {
  const isIncoming = c.addresseeId === meId;
  const other = userById(isIncoming ? c.requesterId : c.addresseeId);
  return {
    id: c.id,
    counterpartUserId: other.id,
    counterpartName: other.profile.fullName ?? other.email,
    counterpartHeadline: other.profile.headline,
    type: c.type,
    status: c.status,
    message: c.message,
    isIncoming,
    createdAt: c.createdAt,
    counterpartIsMentor: other.profile.isMentor,
  };
}

function leaderboardEntry(u, rank, meId) {
  return {
    rank,
    userId: u.id,
    fullName: u.profile.fullName,
    headline: u.profile.headline,
    avatarUrl: u.profile.avatarUrl,
    cohort: u.profile.cohort,
    isMentor: u.profile.isMentor,
    xp: xpFor(u),
    isMe: u.id === meId,
  };
}

// ---------------------------------------------------------------- analytics helpers

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastSixMonths() {
  const out = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ y: m.getFullYear(), m: m.getMonth(), label: MONTHS[m.getMonth()] });
  }
  return out;
}

function seriesBy(items, dateOf) {
  return lastSixMonths().map(({ y, m, label }) => ({
    label,
    value: items.filter((it) => {
      const d = new Date(dateOf(it));
      return d.getFullYear() === y && d.getMonth() === m;
    }).length,
  }));
}

function countBy(items, keyOf) {
  const map = new Map();
  items.forEach((it) => {
    const k = keyOf(it);
    if (k == null || k === '') return;
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

/** Mutually exclusive engagement buckets, same rules as backend AnalyticsService. */
function engagementBuckets(community) {
  const b = { mentors: 0, jobSeeking: 0, employed: 0, active: 0, inactive: 0 };
  community.forEach(({ profile: p }) => {
    if (p.isMentor) b.mentors++;
    else if (p.employmentStatus === 'SeekingWork') b.jobSeeking++;
    else if (['Employed', 'SelfEmployed', 'Freelancing'].includes(p.employmentStatus)) b.employed++;
    else if (p.skills.length || p.projects.length) b.active++;
    else b.inactive++;
  });
  return [
    { label: 'Active Alumni', count: b.active },
    { label: 'Job Seeking', count: b.jobSeeking },
    { label: 'Employed', count: b.employed },
    { label: 'Mentors', count: b.mentors },
    { label: 'Inactive Members', count: b.inactive },
  ];
}

// ---------------------------------------------------------------- route table

const routes = [];
const route = (method, pattern, handler, { auth = true, roles = null } = {}) => {
  const keys = [];
  const regex = new RegExp(
    '^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$',
  );
  routes.push({ method, regex, keys, handler, auth, roles });
};
const ADMIN = { roles: ['Admin'] };

// ---- auth
route('post', '/auth/login', ({ body }) => {
  const u = state.users.find((x) => x.email === lc(body?.email));
  if (!u || u.password !== body?.password) throw unauthorized('Invalid email or password.');
  if (u.status !== 'Approved') {
    const messages = {
      Pending: 'Your account is awaiting administrator approval. Please check back once it has been reviewed.',
      Rejected: u.reviewNote ? `Your registration was not approved: ${u.reviewNote}` : 'Your registration was not approved.',
      InfoRequested: u.reviewNote
        ? `An administrator needs more information: ${u.reviewNote}`
        : 'An administrator needs more information before approving your account.',
    };
    throw new ApiError(403, messages[u.status], { status: u.status });
  }
  return {
    token: `demo-token-${u.id}`,
    expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    userId: u.id,
    email: u.email,
    fullName: u.profile.fullName,
    role: u.role,
  };
}, { auth: false });

route('post', '/auth/register', ({ body }) => {
  const email = lc(body?.email);
  if (!email || !body?.password || !body?.fullName) throw badRequest('Email, password and full name are required.');
  if ((body.password ?? '').length < 8) throw badRequest('Password must be at least 8 characters.');
  if (state.users.some((u) => u.email === email)) throw conflict('An account with this email already exists.');
  state.users.push({
    id: nextId(),
    email,
    password: body.password,
    role: 'Alumni',
    status: 'Pending',
    reviewNote: null,
    reviewedAt: null,
    createdAt: nowIso(),
    profile: {
      id: nextId(), fullName: body.fullName.trim(), cohort: body.cohort || null, location: null, industry: null,
      employmentStatus: 'Unspecified', bio: null, headline: null, avatarUrl: null, linkedInUrl: null,
      gitHubUrl: null, cvUrl: null, isMentor: false, skills: [], certifications: [], projects: [],
    },
  });
  notifyAdmins(`${body.fullName.trim()} registered and is awaiting approval.`, '/approvals');
  return {
    status: 'Pending',
    message: 'Thanks for registering! An administrator will review your account. In this demo, sign in as the admin to approve it.',
    requiresApproval: true,
  };
}, { auth: false });

// ---- contact
route('post', '/contact', ({ body }) => {
  if (!body?.name || !body?.email || !body?.message) throw badRequest('Name, email and message are required.');
  notifyAdmins(`New contact message from ${body.name}${body.subject ? `: ${body.subject}` : ''}.`, null);
  return { message: 'Thanks — your message has been sent to the SIC Connect administrators.' };
}, { auth: false });

// ---- profile
route('get', '/profiles/me', ({ me }) => profileDto(me));

route('put', '/profiles/me', ({ me, body }) => {
  if (!body?.fullName?.trim()) throw badRequest('Full name is required.');
  const p = me.profile;
  Object.assign(p, {
    fullName: body.fullName.trim(),
    cohort: body.cohort || null,
    location: body.location || null,
    industry: body.industry || null,
    employmentStatus: body.employmentStatus || 'Unspecified',
    bio: body.bio || null,
    headline: body.headline || null,
    avatarUrl: body.avatarUrl || null,
    linkedInUrl: body.linkedInUrl || null,
    gitHubUrl: body.gitHubUrl || null,
    cvUrl: body.cvUrl || null,
    isMentor: me.role === 'Mentor' ? true : Boolean(body.isMentor) && p.isMentor,
  });
  if (Array.isArray(body.skills)) {
    p.skills = body.skills.filter((s) => s?.name?.trim()).map((s) => ({ id: nextId(), name: s.name.trim(), level: s.level || null }));
  }
  if (Array.isArray(body.certifications)) {
    p.certifications = body.certifications
      .filter((c) => c?.name?.trim())
      .map((c) => ({ id: nextId(), name: c.name.trim(), issuer: c.issuer || null, issuedOn: c.issuedOn || null, credentialUrl: c.credentialUrl || null }));
  }
  return profileDto(me);
});

route('post', '/profiles/me/cv', ({ me, body }) => {
  const file = typeof FormData !== 'undefined' && body instanceof FormData ? body.get('file') : null;
  if (!file) throw badRequest('Choose a PDF file to upload.');
  if (file.type && file.type !== 'application/pdf') throw badRequest('Only PDF files are accepted.');
  me.profile.cvUrl = URL.createObjectURL(file);
  return { cvUrl: me.profile.cvUrl };
});

route('delete', '/profiles/me/cv', ({ me }) => {
  me.profile.cvUrl = null;
  return { cvUrl: null };
});

// ---- projects
route('get', '/projects', ({ me }) => me.profile.projects.map(projectDto));

route('post', '/projects', ({ me, body }) => {
  if (!body?.title?.trim()) throw badRequest('Project title is required.');
  const p = {
    id: nextId(), title: body.title.trim(), summary: body.summary || null, techStack: body.techStack || null,
    gitHubUrl: body.gitHubUrl || null, demoUrl: body.demoUrl || null, achievements: body.achievements || null, createdAt: nowIso(),
  };
  me.profile.projects.push(p);
  return projectDto(p);
});

route('delete', '/projects/:id', ({ me, params }) => {
  const before = me.profile.projects.length;
  me.profile.projects = me.profile.projects.filter((p) => p.id !== Number(params.id));
  if (me.profile.projects.length === before) throw notFound('Project not found.');
  return null;
});

// ---- directory
route('get', '/directory', ({ query }) => {
  let list = state.users.filter((u) => u.status === 'Approved' && u.role !== 'Admin');
  if (query.cohort) list = list.filter((u) => u.profile.cohort === query.cohort);
  if (query.location) list = list.filter((u) => lc(u.profile.location).includes(lc(query.location)));
  if (query.industry) list = list.filter((u) => lc(u.profile.industry).includes(lc(query.industry)));
  if (query.employmentStatus) list = list.filter((u) => u.profile.employmentStatus === query.employmentStatus);
  if (String(query.mentorsOnly) === 'true') list = list.filter((u) => u.profile.isMentor);
  if (query.skill) list = list.filter((u) => u.profile.skills.some((s) => lc(s.name).includes(lc(query.skill))));
  if (query.q) {
    const q = lc(query.q);
    list = list.filter((u) =>
      [u.profile.fullName, u.profile.headline, u.profile.industry, u.profile.location, ...u.profile.skills.map((s) => s.name)]
        .some((f) => lc(f).includes(q)),
    );
  }
  list.sort((a, b) => a.profile.fullName.localeCompare(b.profile.fullName));
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Number(query.pageSize) > 0 && Number(query.pageSize) <= 100 ? Number(query.pageSize) : 20;
  const items = list.slice((page - 1) * pageSize, page * pageSize).map(directoryItem);
  return { items, page, pageSize, totalCount: list.length, totalPages: Math.ceil(list.length / pageSize) };
});

// ---- opportunities & applications
route('get', '/opportunities', () =>
  [...state.opportunities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(opportunityDto));

route('get', '/opportunities/recommendations', ({ me }) => {
  const p = me.profile;
  const applied = new Set(state.applications.filter((a) => a.userId === me.id).map((a) => a.opportunityId));
  const skills = [...new Set(p.skills.map((s) => s.name.trim()).filter(Boolean))];
  const seeking = ['SeekingWork', 'Student', 'Internship'].includes(p.employmentStatus);
  const now = Date.now();
  const results = [];
  for (const o of state.opportunities) {
    if (applied.has(o.id)) continue;
    const hay = lc(`${o.title} ${o.description} ${o.organisation}`);
    const reasons = [];
    let score = 0;
    const matched = skills.filter((s) => hay.includes(lc(s)));
    if (matched.length) {
      score += matched.length * 4;
      reasons.push(`Matches your skills: ${matched.slice(0, 3).join(', ')}`);
    }
    if (p.industry && hay.includes(lc(p.industry))) {
      score += 3;
      reasons.push(`In your industry (${p.industry})`);
    }
    if (seeking && ['Job', 'Internship', 'GraduateProgramme'].includes(o.type)) {
      score += 2;
      reasons.push('Fits your current job search');
    }
    if (p.isMentor && o.isMentorshipTagged) {
      score += 2;
      reasons.push('Flagged for mentors');
    }
    if (o.deadline) {
      const d = new Date(o.deadline).getTime();
      if (d >= now && d <= now + 30 * 86400000) {
        score += 1;
        reasons.push('Closing soon');
      }
    }
    if (new Date(o.createdAt).getTime() >= now - 14 * 86400000) {
      score += 1;
      reasons.push('Recently posted');
    }
    if (score > 0) results.push({ opportunity: opportunityDto(o), score, reasons });
  }
  return results
    .sort((a, b) => b.score - a.score || b.opportunity.createdAt.localeCompare(a.opportunity.createdAt))
    .slice(0, 6);
});

function upsertOpportunity(target, body) {
  if (!body?.title?.trim() || !body?.organisation?.trim()) throw badRequest('Title and organisation are required.');
  Object.assign(target, {
    type: body.type || 'Job',
    title: body.title.trim(),
    organisation: body.organisation.trim(),
    description: body.description || null,
    location: body.location || null,
    applyUrl: body.applyUrl || null,
    deadline: body.deadline || null,
    isMentorshipTagged: Boolean(body.isMentorshipTagged),
  });
  return target;
}

route('post', '/opportunities', ({ body }) => {
  const o = upsertOpportunity({ id: nextId(), createdAt: nowIso() }, body);
  state.opportunities.push(o);
  return opportunityDto(o);
}, ADMIN);

route('put', '/opportunities/:id', ({ params, body }) => {
  const o = must(state.opportunities.find((x) => x.id === Number(params.id)), 'Opportunity not found.');
  return opportunityDto(upsertOpportunity(o, body));
}, ADMIN);

route('delete', '/opportunities/:id', ({ params }) => {
  const id = Number(params.id);
  must(state.opportunities.find((x) => x.id === id), 'Opportunity not found.');
  state.opportunities = state.opportunities.filter((x) => x.id !== id);
  state.applications = state.applications.filter((a) => a.opportunityId !== id);
  return null;
}, ADMIN);

route('post', '/opportunities/:id/apply', ({ me, params, body }) => {
  const o = must(state.opportunities.find((x) => x.id === Number(params.id)), 'Opportunity not found.');
  const existing = state.applications.find((a) => a.opportunityId === o.id && a.userId === me.id && a.status !== 'Withdrawn');
  if (existing) throw conflict('You have already applied to this opportunity.');
  const a = { id: nextId(), opportunityId: o.id, userId: me.id, status: 'Submitted', coverNote: body?.coverNote || null, createdAt: nowIso() };
  state.applications.push(a);
  notifyAdmins(`${me.profile.fullName} applied for ${o.title}.`, '/opportunities');
  return applicationDto(a);
});

route('get', '/opportunities/:id/applications', ({ params }) =>
  state.applications
    .filter((a) => a.opportunityId === Number(params.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(applicationDto), ADMIN);

route('get', '/applications/me', ({ me }) =>
  state.applications
    .filter((a) => a.userId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(applicationDto));

route('delete', '/applications/:id', ({ me, params }) => {
  const a = must(state.applications.find((x) => x.id === Number(params.id)), 'Application not found.');
  if (a.userId !== me.id) throw forbidden('You can only withdraw your own applications.');
  state.applications = state.applications.filter((x) => x.id !== a.id);
  return null;
});

route('put', '/applications/:id/status', ({ params, body }) => {
  const a = must(state.applications.find((x) => x.id === Number(params.id)), 'Application not found.');
  a.status = body?.status || a.status;
  const o = state.opportunities.find((x) => x.id === a.opportunityId);
  const readable = a.status.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  notify(a.userId, `Your application for ${o?.title ?? 'an opportunity'} is now ${readable}.`, '/applications');
  return applicationDto(a);
}, ADMIN);

// ---- events
route('get', '/events', ({ me }) =>
  [...state.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((e) => eventDto(e, me)));

function upsertEvent(target, body) {
  if (!body?.title?.trim() || !body?.startsAt) throw badRequest('Title and start date are required.');
  Object.assign(target, {
    title: body.title.trim(),
    description: body.description || null,
    startsAt: new Date(body.startsAt).toISOString(),
    endsAt: body.endsAt ? new Date(body.endsAt).toISOString() : null,
    venue: body.venue || null,
    isOnline: Boolean(body.isOnline),
    capacity: body.capacity ? Number(body.capacity) : null,
  });
  return target;
}

route('post', '/events', ({ me, body }) => {
  const e = upsertEvent({ id: nextId(), createdAt: nowIso() }, body);
  state.events.push(e);
  return eventDto(e, me);
}, ADMIN);

route('put', '/events/:id', ({ me, params, body }) => {
  const e = must(state.events.find((x) => x.id === Number(params.id)), 'Event not found.');
  return eventDto(upsertEvent(e, body), me);
}, ADMIN);

route('delete', '/events/:id', ({ params }) => {
  const id = Number(params.id);
  must(state.events.find((x) => x.id === id), 'Event not found.');
  state.events = state.events.filter((x) => x.id !== id);
  state.registrations = state.registrations.filter((r) => r.eventId !== id);
  return null;
}, ADMIN);

route('get', '/events/:id/attendees', ({ params }) =>
  state.registrations
    .filter((r) => r.eventId === Number(params.id))
    .map((r) => {
      const u = userById(r.userId);
      return { userId: u.id, fullName: u.profile.fullName, headline: u.profile.headline, email: u.email, registeredAt: r.registeredAt };
    }), ADMIN);

route('post', '/events/:id/register', ({ me, params }) => {
  const e = must(state.events.find((x) => x.id === Number(params.id)), 'Event not found.');
  if (state.registrations.some((r) => r.eventId === e.id && r.userId === me.id)) return null;
  const count = state.registrations.filter((r) => r.eventId === e.id).length;
  if (e.capacity && count >= e.capacity) throw conflict('This event is full.');
  state.registrations.push({ eventId: e.id, userId: me.id, registeredAt: nowIso() });
  return null;
});

route('delete', '/events/:id/register', ({ me, params }) => {
  state.registrations = state.registrations.filter((r) => !(r.eventId === Number(params.id) && r.userId === me.id));
  return null;
});

// ---- announcements
route('get', '/announcements', () =>
  [...state.announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));

route('post', '/announcements', ({ body }) => {
  if (!body?.title?.trim() || !body?.body?.trim()) throw badRequest('Title and message are required.');
  const a = { id: nextId(), title: body.title.trim(), body: body.body.trim(), audience: body.audience || 'All', publishedAt: nowIso() };
  state.announcements.push(a);
  return a;
}, ADMIN);

route('delete', '/announcements/:id', ({ params }) => {
  const id = Number(params.id);
  must(state.announcements.find((x) => x.id === id), `Announcement ${id} not found.`);
  state.announcements = state.announcements.filter((x) => x.id !== id);
  return null;
}, ADMIN);

// ---- networking
route('get', '/networking/connections', ({ me }) =>
  state.connections
    .filter((c) => c.requesterId === me.id || c.addresseeId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => connectionDto(c, me.id)));

route('get', '/networking/suggestions', ({ me }) => {
  const mine = new Set(me.profile.skills.map((s) => lc(s.name)));
  const linked = new Set(
    state.connections
      .filter((c) => c.requesterId === me.id || c.addresseeId === me.id)
      .map((c) => (c.requesterId === me.id ? c.addresseeId : c.requesterId)),
  );
  linked.add(me.id);
  const out = [];
  for (const u of state.users) {
    if (linked.has(u.id) || u.status !== 'Approved' || u.role === 'Admin') continue;
    const p = u.profile;
    const reasons = [];
    let score = 0;
    const shared = [...new Set(p.skills.map((s) => s.name.trim()).filter((n) => mine.has(lc(n))))];
    if (shared.length) {
      score += shared.length * 3;
      reasons.push(`${shared.length} shared skill${shared.length > 1 ? 's' : ''}: ${shared.slice(0, 3).join(', ')}`);
    }
    if (me.profile.cohort && lc(me.profile.cohort) === lc(p.cohort)) {
      score += 2;
      reasons.push(`Same cohort (${p.cohort})`);
    }
    if (me.profile.industry && lc(me.profile.industry) === lc(p.industry)) {
      score += 2;
      reasons.push(`Same industry (${p.industry})`);
    }
    if (p.isMentor) {
      score += 2;
      reasons.push('Available as a mentor');
    }
    if (score > 0) {
      out.push({ userId: u.id, fullName: p.fullName, headline: p.headline, cohort: p.cohort, industry: p.industry, isMentor: p.isMentor, sharedSkills: shared, score, reasons });
    }
  }
  return out.sort((a, b) => b.score - a.score || Number(b.isMentor) - Number(a.isMentor)).slice(0, 8);
});

route('post', '/networking/connections', ({ me, body }) => {
  const target = must(userById(body?.addresseeUserId), 'User not found.');
  if (target.id === me.id) throw badRequest('You cannot connect with yourself.');
  const type = body?.type || 'Connection';
  if (type === 'Mentorship' && !target.profile.isMentor) throw badRequest('That person is not currently available as a mentor.');
  const dup = state.connections.find(
    (c) =>
      c.type === type &&
      c.status !== 'Declined' &&
      ((c.requesterId === me.id && c.addresseeId === target.id) || (c.requesterId === target.id && c.addresseeId === me.id)),
  );
  if (dup) throw conflict('A request already exists between you and this person.');
  const c = { id: nextId(), requesterId: me.id, addresseeId: target.id, type, status: 'Pending', message: body?.message?.trim() || null, createdAt: nowIso(), respondedAt: null };
  state.connections.push(c);
  notify(target.id, `${me.profile.fullName} sent you ${type === 'Mentorship' ? 'a mentorship request' : 'a connection request'}.`, '/networking');
  return connectionDto(c, me.id);
});

route('post', '/networking/connections/:id/respond', ({ me, params, body }) => {
  const c = must(state.connections.find((x) => x.id === Number(params.id)), 'Request not found.');
  if (c.addresseeId !== me.id) throw forbidden('Only the recipient can respond to this request.');
  if (c.status !== 'Pending') throw badRequest('This request has already been answered.');
  c.status = body?.accept ? 'Accepted' : 'Declined';
  c.respondedAt = nowIso();
  if (body?.accept) notify(c.requesterId, `${me.profile.fullName} accepted your request.`, '/networking');
  return connectionDto(c, me.id);
});

route('delete', '/networking/connections/:id', ({ me, params }) => {
  const c = must(state.connections.find((x) => x.id === Number(params.id)), 'Connection not found.');
  if (c.requesterId !== me.id && c.addresseeId !== me.id) throw forbidden();
  state.connections = state.connections.filter((x) => x.id !== c.id);
  return null;
});

// ---- messages
route('get', '/messages/conversations', ({ me }) => {
  const ids = new Set();
  state.connections
    .filter((c) => c.status === 'Accepted' && (c.requesterId === me.id || c.addresseeId === me.id))
    .forEach((c) => ids.add(c.requesterId === me.id ? c.addresseeId : c.requesterId));
  state.messages
    .filter((m) => m.senderId === me.id || m.recipientId === me.id)
    .forEach((m) => ids.add(m.senderId === me.id ? m.recipientId : m.senderId));
  ids.delete(me.id);
  return [...ids]
    .map((id) => {
      const other = userById(id);
      if (!other) return null;
      const thread = state.messages
        .filter((m) => (m.senderId === me.id && m.recipientId === id) || (m.senderId === id && m.recipientId === me.id))
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
      const last = thread[thread.length - 1];
      return {
        otherUserId: id,
        otherName: other.profile.fullName,
        otherHeadline: other.profile.headline,
        lastMessage: last?.body ?? null,
        lastAt: last?.sentAt ?? null,
        unreadCount: thread.filter((m) => m.senderId === id && !m.readAt).length,
        isConnected: isConnected(me.id, id),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? '') || a.otherName.localeCompare(b.otherName));
});

route('get', '/messages/unread-count', ({ me }) =>
  state.messages.filter((m) => m.recipientId === me.id && !m.readAt).length);

route('get', '/messages/:otherId', ({ me, params }) => {
  const other = must(userById(params.otherId), 'User not found.');
  const now = nowIso();
  const thread = state.messages
    .filter((m) => (m.senderId === me.id && m.recipientId === other.id) || (m.senderId === other.id && m.recipientId === me.id))
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  thread.forEach((m) => {
    if (m.recipientId === me.id && !m.readAt) m.readAt = now;
  });
  return {
    otherUserId: other.id,
    otherName: other.profile.fullName,
    otherHeadline: other.profile.headline,
    isConnected: isConnected(me.id, other.id),
    messages: thread.map((m) => ({ id: m.id, senderId: m.senderId, isMine: m.senderId === me.id, body: m.body, sentAt: m.sentAt, readAt: m.readAt })),
  };
});

route('post', '/messages/:otherId', ({ me, params, body }) => {
  const otherId = Number(params.otherId);
  if (otherId === me.id) throw badRequest('You cannot message yourself.');
  must(userById(otherId), 'User not found.');
  if (!isConnected(me.id, otherId)) throw forbidden("You can only message people you're connected with.");
  const text = body?.body?.trim();
  if (!text) throw badRequest('Message cannot be empty.');
  const m = { id: nextId(), senderId: me.id, recipientId: otherId, body: text, sentAt: nowIso(), readAt: null };
  state.messages.push(m);
  notify(otherId, `New message from ${me.profile.fullName}.`, '/messages');
  return { id: m.id, senderId: m.senderId, isMine: true, body: m.body, sentAt: m.sentAt, readAt: null };
});

// ---- notifications
route('get', '/notifications', ({ me }) =>
  state.notifications
    .filter((n) => n.userId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ id, message, link, isRead, createdAt }) => ({ id, message, link, isRead, createdAt })));

route('get', '/notifications/unread-count', ({ me }) =>
  state.notifications.filter((n) => n.userId === me.id && !n.isRead).length);

route('post', '/notifications/read-all', ({ me }) => {
  state.notifications.forEach((n) => {
    if (n.userId === me.id) n.isRead = true;
  });
  return null;
});

route('post', '/notifications/:id/read', ({ me, params }) => {
  const n = state.notifications.find((x) => x.id === Number(params.id) && x.userId === me.id);
  if (n) n.isRead = true;
  return null;
});

// ---- recognition & mentoring
route('get', '/leaderboard', ({ me, query }) => {
  const board = query.board === 'mentor' ? 'mentor' : 'alumni';
  const top = Math.min(Math.max(Number(query.top) || 10, 1), 50);
  const role = board === 'mentor' ? 'Mentor' : 'Alumni';
  const ranked = state.users
    .filter((u) => u.role === role && u.status === 'Approved')
    .map((u) => ({ u, xp: xpFor(u) }))
    .sort((a, b) => b.xp - a.xp || a.u.profile.fullName.localeCompare(b.u.profile.fullName))
    .map(({ u }, i) => leaderboardEntry(u, i + 1, me.id));
  return { board, top: ranked.slice(0, top), me: ranked.find((e) => e.isMe) ?? null, totalCompetitors: ranked.length };
});

function eligibility(me) {
  const p = me.profile;
  const xp = xpFor(me);
  const hasHeadline = Boolean(p.headline?.trim());
  const hasBio = Boolean(p.bio?.trim());
  const profileComplete = hasHeadline && hasBio && p.skills.length >= 3;
  const alreadyMentor = me.role === 'Mentor' || p.isMentor;
  const unmet = [];
  if (xp < MENTOR_XP_THRESHOLD) unmet.push(`Earn ${MENTOR_XP_THRESHOLD - xp} more XP (recognition points).`);
  if (!hasHeadline) unmet.push('Add a professional headline.');
  if (!hasBio) unmet.push('Add a short bio.');
  if (p.skills.length < 3) unmet.push(`List at least 3 skills (you have ${p.skills.length}).`);
  return {
    xp, requiredXp: MENTOR_XP_THRESHOLD, profileComplete, alreadyMentor,
    isEligible: !alreadyMentor && xp >= MENTOR_XP_THRESHOLD && profileComplete, unmetRequirements: unmet,
  };
}

route('get', '/mentor/eligibility', ({ me }) => eligibility(me));

route('post', '/mentor/apply', ({ me }) => {
  const e = eligibility(me);
  if (e.alreadyMentor) throw badRequest('You are already a mentor.');
  if (!e.isEligible) throw badRequest(`You are not yet eligible: ${e.unmetRequirements.join(' ')}`);
  notifyAdmins(`${me.profile.fullName} applied to become a mentor.`, '/admin/users');
  return { message: 'Your mentor application has been sent to the administrators for review.' };
});

// ---- admin
route('get', '/admin/users', () =>
  [...state.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(adminUserDto), ADMIN);

route('put', '/admin/users/:id/role', ({ params, body }) => {
  const u = must(userById(params.id), `User ${params.id} not found.`);
  if (!['Alumni', 'Mentor', 'Admin'].includes(body?.role)) throw badRequest('Choose a valid role.');
  u.role = body.role;
  u.profile.isMentor = body.role === 'Mentor';
  notify(u.id, `Your role has been changed to ${body.role}.`, '/profile');
  return adminUserDto(u);
}, ADMIN);

route('delete', '/admin/users/:id', ({ me, params }) => {
  const id = Number(params.id);
  if (id === me.id) throw badRequest('You cannot delete your own account.');
  must(userById(id), `User ${id} not found.`);
  state.users = state.users.filter((u) => u.id !== id);
  state.connections = state.connections.filter((c) => c.requesterId !== id && c.addresseeId !== id);
  state.messages = state.messages.filter((m) => m.senderId !== id && m.recipientId !== id);
  state.applications = state.applications.filter((a) => a.userId !== id);
  state.registrations = state.registrations.filter((r) => r.userId !== id);
  state.notifications = state.notifications.filter((n) => n.userId !== id);
  return null;
}, ADMIN);

route('get', '/admin/mentorships', () =>
  state.connections
    .filter((c) => c.type === 'Mentorship')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const a = userById(c.requesterId);
      const m = userById(c.addresseeId);
      return {
        id: c.id, alumnusUserId: a.id, alumnusName: a.profile.fullName, mentorUserId: m.id, mentorName: m.profile.fullName,
        status: c.status, message: c.message, createdAt: c.createdAt, respondedAt: c.respondedAt,
      };
    }), ADMIN);

route('get', '/admin/approvals', () =>
  state.users
    .filter((u) => u.status === 'Pending' || u.status === 'InfoRequested')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(approvalDto), ADMIN);

function review(params, status, note) {
  const u = must(userById(params.id), `User ${params.id} not found.`);
  if (u.role === 'Admin') throw badRequest('Administrator accounts do not go through approval.');
  u.status = status;
  u.reviewNote = note?.trim() || null;
  u.reviewedAt = nowIso();
  return approvalDto(u);
}
route('post', '/admin/approvals/:id/approve', ({ params }) => review(params, 'Approved', null), ADMIN);
route('post', '/admin/approvals/:id/reject', ({ params, body }) => review(params, 'Rejected', body?.note), ADMIN);
route('post', '/admin/approvals/:id/request-info', ({ params, body }) => review(params, 'InfoRequested', body?.note), ADMIN);

// ---- analytics
route('get', '/analytics/summary', () => {
  const approved = state.users.filter((u) => u.status === 'Approved');
  const alumni = approved.filter((u) => u.role === 'Alumni');
  return {
    totalUsers: state.users.length,
    totalAlumni: alumni.length,
    totalMentors: approved.filter((u) => u.role === 'Mentor').length,
    totalAdmins: approved.filter((u) => u.role === 'Admin').length,
    totalProfiles: state.users.length,
    totalProjects: state.users.reduce((n, u) => n + u.profile.projects.length, 0),
    totalOpportunities: state.opportunities.length,
    totalEvents: state.events.length,
    totalEventRegistrations: state.registrations.length,
    totalAnnouncements: state.announcements.length,
    totalConnections: state.connections.filter((c) => c.status === 'Accepted').length,
    totalApplications: state.applications.length,
    usersByCohort: countBy(state.users.filter((u) => u.role !== 'Admin'), (u) => u.profile.cohort),
    alumniByEmploymentStatus: countBy(alumni, (u) => u.profile.employmentStatus),
    topEventsByRegistrations: state.events
      .map((e) => ({ eventId: e.id, title: e.title, startsAt: e.startsAt, registrationCount: state.registrations.filter((r) => r.eventId === e.id).length }))
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, 5),
  };
}, ADMIN);

route('get', '/analytics/dashboard', () => {
  const now = new Date();
  const approved = state.users.filter((u) => u.status === 'Approved');
  const community = approved.filter((u) => u.role !== 'Admin');
  const upcoming = state.events.filter((e) => new Date(e.startsAt) >= now);
  const thisMonth = state.users.filter((u) => {
    const d = new Date(u.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const mentors = approved.filter((u) => u.role === 'Mentor');
  const mentorships = state.connections.filter((c) => c.type === 'Mentorship');
  const recent = [
    ...state.users.map((u) => ({ type: 'Registration', title: `${u.profile.fullName} joined SIC Connect`, actor: u.profile.fullName, timestamp: u.createdAt })),
    ...state.applications.map((a) => {
      const d = applicationDto(a);
      return { type: 'Application', title: `Applied for ${d.opportunityTitle}`, actor: d.applicantName, timestamp: a.createdAt };
    }),
    ...state.opportunities.map((o) => ({ type: 'Opportunity', title: `New opportunity: ${o.title}`, actor: o.organisation, timestamp: o.createdAt })),
    ...state.events.map((e) => ({ type: 'Event', title: `Event published: ${e.title}`, actor: 'SIC Administrator', timestamp: e.createdAt })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);

  return {
    kpis: {
      totalAlumni: community.length,
      activeOpportunities: state.opportunities.filter((o) => !o.deadline || new Date(o.deadline) >= now).length,
      upcomingEvents: upcoming.length,
      newRegistrationsThisMonth: thisMonth,
    },
    engagement: engagementBuckets(community),
    totalAlumni: community.length,
    opportunitiesByType: countBy(state.opportunities, (o) => o.type),
    upcomingEvents: upcoming
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => ({
        id: e.id, title: e.title, startsAt: e.startsAt, venue: e.venue, isOnline: e.isOnline,
        attendeeCount: state.registrations.filter((r) => r.eventId === e.id).length, capacity: e.capacity,
      })),
    registrationsOverTime: seriesBy(state.users, (u) => u.createdAt),
    opportunitiesPerMonth: seriesBy(state.opportunities, (o) => o.createdAt),
    eventAttendanceOverTime: seriesBy(state.registrations, (r) => state.events.find((e) => e.id === r.eventId)?.startsAt ?? r.registeredAt),
    topSkills: countBy(community.flatMap((u) => u.profile.skills), (s) => s.name).slice(0, 8),
    employmentStatusDistribution: countBy(community, (u) => u.profile.employmentStatus),
    recentActivity: recent,
    mentorshipStats: {
      pendingRequests: mentorships.filter((c) => c.status === 'Pending').length,
      activeMentorships: mentorships.filter((c) => c.status === 'Accepted').length,
      declinedRequests: mentorships.filter((c) => c.status === 'Declined').length,
      totalMentors: mentors.length,
    },
    mentorWorkload: mentors.map((m) => ({
      mentorUserId: m.id,
      mentorName: m.profile.fullName,
      activeMentees: mentorships.filter((c) => c.addresseeId === m.id && c.status === 'Accepted').length,
      pendingRequests: mentorships.filter((c) => c.addresseeId === m.id && c.status === 'Pending').length,
    })),
    pendingApprovals: state.users.filter((u) => u.status === 'Pending' || u.status === 'InfoRequested').length,
  };
}, ADMIN);

// ---------------------------------------------------------------- adapter

function parseBody(data) {
  if (data == null || data === '') return null;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function currentUser(config) {
  const header = config.headers?.Authorization ?? config.headers?.authorization;
  const match = /^Bearer demo-token-(\d+)$/.exec(header ?? '');
  if (!match) return null;
  const u = userById(match[1]);
  return u && u.status === 'Approved' ? u : null;
}

function respond(config, status, data) {
  return { data, status, statusText: String(status), headers: { 'content-type': 'application/json' }, config, request: {} };
}

/** Axios adapter: resolves each request against the route table above. */
export async function demoAdapter(config) {
  await new Promise((r) => setTimeout(r, LATENCY_MS));

  const method = (config.method ?? 'get').toLowerCase();
  const url = new URL(config.url ?? '', 'http://demo.local/');
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const query = Object.fromEntries(url.searchParams.entries());
  Object.entries(config.params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query[k] = String(v);
  });

  try {
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.regex.exec(path);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const me = currentUser(config);
      if (r.auth && !me) throw unauthorized();
      if (r.roles && !r.roles.includes(me.role)) throw forbidden();
      const result = r.handler({ me, params, query, body: parseBody(config.data) });
      save();
      return respond(config, result === null ? 204 : 200, result === null ? '' : JSON.parse(JSON.stringify(result)));
    }
    throw notFound(`The demo does not support ${method.toUpperCase()} ${path}.`);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'An unexpected error occurred in the demo.';
    if (!(err instanceof ApiError)) console.error('[SIC Connect demo]', err);
    const response = respond(config, status, { error: message, details: null, status: err.extra?.status ?? null });
    throw new AxiosError(message, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response);
  }
}
