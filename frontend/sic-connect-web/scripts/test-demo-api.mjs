// Exercises every endpoint of the in-browser demo API (src/demo/mockServer.js) in Node.
// Run with: node scripts/test-demo-api.mjs
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { demoAdapter, resetDemo } = await import('../src/demo/mockServer.js');

let failures = 0;
const ok = (cond, label) => {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
};

async function call(method, url, { token, data, params } = {}) {
  try {
    const res = await demoAdapter({
      method, url, params, data: data === undefined ? undefined : JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: res.status, data: res.data };
  } catch (e) {
    return { status: e.response?.status ?? 0, data: e.response?.data, error: e.message };
  }
}

async function login(email, password) {
  const r = await call('post', '/auth/login', { data: { email, password } });
  return r.data?.token;
}

resetDemo();

// ---- auth
const alumni = await login('alumni@sicconnect.example', 'Alumni#12345');
const mentor = await login('mentor@sicconnect.example', 'Mentor#12345');
const admin = await login('admin@sicconnect.example', 'Admin#12345');
ok(alumni && mentor && admin, 'all three demo accounts sign in');
ok((await call('post', '/auth/login', { data: { email: 'alumni@sicconnect.example', password: 'wrong' } })).status === 401, 'wrong password is rejected (401)');
const pending = await call('post', '/auth/login', { data: { email: 'pending1@sicconnect.example', password: 'Pending#12345' } });
ok(pending.status === 403 && pending.data.status === 'Pending', 'pending account is blocked with status Pending');
ok((await call('get', '/profiles/me')).status === 401, 'unauthenticated request is rejected (401)');

// ---- every GET endpoint returns 200 for the right role
const gets = [
  ['/profiles/me', alumni], ['/projects', alumni], ['/directory', alumni], ['/opportunities', alumni],
  ['/opportunities/recommendations', alumni], ['/applications/me', alumni], ['/events', alumni],
  ['/announcements', alumni], ['/networking/connections', alumni], ['/networking/suggestions', alumni],
  ['/messages/conversations', alumni], ['/messages/unread-count', alumni], ['/notifications', alumni],
  ['/notifications/unread-count', alumni], ['/leaderboard', alumni], ['/mentor/eligibility', alumni],
  ['/admin/users', admin], ['/admin/mentorships', admin], ['/admin/approvals', admin],
  ['/analytics/summary', admin], ['/analytics/dashboard', admin],
];
for (const [url, token] of gets) {
  const r = await call('get', url, { token });
  ok(r.status === 200, `GET ${url} -> ${r.status}`);
}

// ---- permissions
ok((await call('get', '/admin/users', { token: alumni })).status === 403, 'alumnus cannot open admin users (403)');
ok((await call('post', '/opportunities', { token: alumni, data: { title: 'x', organisation: 'y' } })).status === 403, 'alumnus cannot create opportunities (403)');

// ---- directory filters
const dir = (await call('get', '/directory', { token: alumni, params: { mentorsOnly: true } })).data;
ok(dir.items.length === 4 && dir.items.every((i) => i.isMentor), `mentors-only filter returns 4 mentors (${dir.items.length})`);
const py = (await call('get', '/directory', { token: alumni, params: { skill: 'Python' } })).data;
ok(py.items.length === 3, `skill filter "Python" returns 3 people (${py.items.length})`);

// ---- recommendations & suggestions
const recs = (await call('get', '/opportunities/recommendations', { token: alumni })).data;
ok(recs.length > 0 && recs[0].reasons.length > 0, `recommendations have scores and reasons (top: ${recs[0]?.opportunity.title} — ${recs[0]?.reasons.join('; ')})`);
ok(!recs.some((r) => r.opportunity.title.startsWith('Software Engineering Intern')), 'already-applied opportunity is excluded from recommendations');
const sugg = (await call('get', '/networking/suggestions', { token: alumni })).data;
ok(sugg.length > 0 && !sugg.some((s) => s.fullName === 'Thandiwe Mokoena'), 'suggestions exclude existing connections');

// ---- apply and withdraw
const opps = (await call('get', '/opportunities', { token: alumni })).data;
const frontend = opps.find((o) => o.title === 'Junior Frontend Developer');
const applied = await call('post', `/opportunities/${frontend.id}/apply`, { token: alumni, data: { coverNote: 'Keen!' } });
ok(applied.status === 200 && applied.data.status === 'Submitted', 'alumnus applies to an opportunity');
ok((await call('post', `/opportunities/${frontend.id}/apply`, { token: alumni, data: {} })).status === 409, 'duplicate application is rejected (409)');
const appsForOpp = (await call('get', `/opportunities/${frontend.id}/applications`, { token: admin })).data;
ok(appsForOpp.length === 1, 'admin sees the new application');
ok((await call('put', `/applications/${applied.data.id}/status`, { token: admin, data: { status: 'UnderReview' } })).data.status === 'UnderReview', 'admin moves application to Under Review');
const notes = (await call('get', '/notifications', { token: alumni })).data;
ok(notes.some((n) => n.message.includes('under review')), 'applicant is notified of the status change');
ok((await call('delete', `/applications/${applied.data.id}`, { token: alumni })).status === 204, 'alumnus withdraws the application');

// ---- events
const events = (await call('get', '/events', { token: alumni })).data;
const clinic = events.find((e) => e.title === 'CV & LinkedIn Clinic');
const xpBefore = (await call('get', '/mentor/eligibility', { token: alumni })).data.xp;
ok((await call('post', `/events/${clinic.id}/register`, { token: alumni })).status === 204, 'register for an event');
const clinicAfter = (await call('get', '/events', { token: alumni })).data.find((e) => e.id === clinic.id);
ok(clinicAfter.isRegistered && clinicAfter.registrationCount === clinic.registrationCount + 1, 'registration count and flag update');
const xpAfter = (await call('get', '/mentor/eligibility', { token: alumni })).data.xp;
ok(xpAfter === xpBefore + 15, `event registration earns 15 XP (${xpBefore} -> ${xpAfter})`);
ok((await call('get', `/events/${clinic.id}/attendees`, { token: admin })).data.some((a) => a.fullName === 'Sipho Ndlovu'), 'admin sees the attendee');
ok((await call('delete', `/events/${clinic.id}/register`, { token: alumni })).status === 204, 'cancel event registration');

// ---- networking and messaging
const conns = (await call('get', '/networking/connections', { token: alumni })).data;
const incoming = conns.find((c) => c.isIncoming && c.status === 'Pending');
ok(incoming?.counterpartName === 'Lerato Mahlangu', 'alumnus has an incoming request from Lerato');
ok((await call('post', `/networking/connections/${incoming.id}/respond`, { token: alumni, data: { accept: true } })).data.status === 'Accepted', 'accept the connection request');
const lerato = incoming.counterpartUserId;
const sent = await call('post', `/messages/${lerato}`, { token: alumni, data: { body: 'Hi Lerato!' } });
ok(sent.status === 200 && sent.data.isMine, 'message a new connection');
const stranger = dir.items.find((i) => i.fullName === 'Bongani Nkosi').userId;
ok((await call('post', `/messages/${stranger}`, { token: alumni, data: { body: 'Hi' } })).status === 403, 'cannot message someone you are not connected with (403)');
const mentorReq = await call('post', '/networking/connections', { token: alumni, data: { addresseeUserId: stranger, type: 'Mentorship', message: 'Hello' } });
ok(mentorReq.status === 200 && mentorReq.data.status === 'Pending', 'send a mentorship request to a mentor');
const mentorThread = (await call('get', '/messages/conversations', { token: mentor })).data;
ok(mentorThread.some((c) => c.otherName === 'Sipho Ndlovu'), 'mentor sees the conversation with Sipho');
ok((await call('get', '/messages/unread-count', { token: mentor })).data >= 0, 'unread message count is a number');

// ---- profile and projects
const me = (await call('get', '/profiles/me', { token: alumni })).data;
const updated = await call('put', '/profiles/me', { token: alumni, data: { ...me, headline: 'Frontend Developer', skills: [...me.skills, { name: 'TypeScript' }] } });
ok(updated.data.skills.some((s) => s.name === 'TypeScript'), 'update profile skills');
const proj = await call('post', '/projects', { token: alumni, data: { title: 'Portfolio Site', techStack: 'HTML, CSS' } });
ok(proj.status === 200, 'add a project');
ok((await call('delete', `/projects/${proj.data.id}`, { token: alumni })).status === 204, 'delete the project');

// ---- leaderboard
const lb = (await call('get', '/leaderboard', { token: alumni, params: { board: 'alumni', top: 3 } })).data;
ok(lb.top.length === 3 && lb.me?.fullName === 'Sipho Ndlovu', `leaderboard shows top 3 plus "me" (rank ${lb.me?.rank})`);
const mlb = (await call('get', '/leaderboard', { token: mentor, params: { board: 'mentor' } })).data;
ok(mlb.top.every((e) => e.isMentor), 'mentor leaderboard contains only mentors');

// ---- admin workflows
const approvals = (await call('get', '/admin/approvals', { token: admin })).data;
ok(approvals.length === 2, 'two accounts awaiting approval');
ok((await call('post', `/admin/approvals/${approvals[0].userId}/approve`, { token: admin })).data.status === 'Approved', 'approve an account');
ok(Boolean(await login('pending1@sicconnect.example', 'Pending#12345')), 'approved account can now sign in');
ok((await call('post', `/admin/approvals/${approvals[1].userId}/request-info`, { token: admin, data: { note: 'Please add your cohort.' } })).data.status === 'InfoRequested', 'request more information');
const reg = await call('post', '/auth/register', { data: { email: 'new.person@example.com', password: 'Password1!', fullName: 'New Person' } });
ok(reg.data?.requiresApproval === true, 'registration creates a pending account');
const newOpp = await call('post', '/opportunities', { token: admin, data: { type: 'Job', title: 'Test Role', organisation: 'Test Org' } });
ok(newOpp.status === 200, 'admin creates an opportunity');
ok((await call('put', `/opportunities/${newOpp.data.id}`, { token: admin, data: { ...newOpp.data, title: 'Edited Role' } })).data.title === 'Edited Role', 'admin edits the opportunity');
ok((await call('delete', `/opportunities/${newOpp.data.id}`, { token: admin })).status === 204, 'admin deletes the opportunity');
const newEvent = await call('post', '/events', { token: admin, data: { title: 'Test Event', startsAt: new Date(Date.now() + 86400000).toISOString() } });
ok(newEvent.status === 200, 'admin creates an event');
ok((await call('put', `/events/${newEvent.data.id}`, { token: admin, data: { title: 'Edited Event', startsAt: newEvent.data.startsAt } })).data.title === 'Edited Event', 'admin edits the event');
ok((await call('delete', `/events/${newEvent.data.id}`, { token: admin })).status === 204, 'admin deletes the event');
const ann = await call('post', '/announcements', { token: admin, data: { title: 'Hello', body: 'World', audience: 'All' } });
ok(ann.status === 200, 'admin posts an announcement');
ok((await call('delete', `/announcements/${ann.data.id}`, { token: admin })).status === 204, 'admin deletes the announcement');
const users = (await call('get', '/admin/users', { token: admin })).data;
const thabo = users.find((u) => u.fullName === 'Thabo Molefe');
ok((await call('put', `/admin/users/${thabo.id}/role`, { token: admin, data: { role: 'Mentor' } })).data.role === 'Mentor', 'admin promotes a user to mentor');
ok((await call('delete', `/admin/users/${users.find((u) => u.role === 'Admin').id}`, { token: admin })).status === 400, 'admin cannot delete own account (400)');
ok((await call('delete', `/admin/users/${thabo.id}`, { token: admin })).status === 204, 'admin deletes a user');
const dash = (await call('get', '/analytics/dashboard', { token: admin })).data;
const engagementTotal = dash.engagement.reduce((s, e) => s + e.count, 0);
ok(engagementTotal === dash.kpis.totalAlumni, `engagement buckets add up to total alumni (${engagementTotal} = ${dash.kpis.totalAlumni})`);
ok(dash.registrationsOverTime.length === 6 && dash.topSkills.length > 0, 'dashboard charts have data');

// ---- misc
ok((await call('post', '/contact', { data: { name: 'A', email: 'a@example.com', message: 'Hi' } })).status === 200, 'public contact form works');
ok((await call('post', '/notifications/read-all', { token: alumni })).status === 204, 'mark all notifications read');
ok((await call('get', '/notifications/unread-count', { token: alumni })).data === 0, 'unread notifications reset to 0');
ok((await call('post', '/mentor/apply', { token: alumni })).status === 400, 'ineligible alumnus cannot apply to mentor (400)');
ok((await call('get', '/does/not/exist', { token: alumni })).status === 404, 'unknown endpoint returns 404');

// ---- persistence and reset
ok(store.has('sic_connect_demo_state_v1'), 'state is saved to localStorage');
resetDemo();
ok((await call('get', '/admin/approvals', { token: admin })).data.length === 2, 'reset restores the original sample data');

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
