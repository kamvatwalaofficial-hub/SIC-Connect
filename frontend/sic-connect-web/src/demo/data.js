/**
 * Fictional sample data for the in-browser demo. It mirrors the backend's DbSeeder
 * (same people, same .example email domain) plus a little extra history so the
 * dashboards and charts have something to show. No real person's details are used.
 *
 * Dates are generated relative to "now" when a visitor first opens the demo.
 */

export const DEMO_PASSWORD = 'Demo#12345';

export const DEMO_ACCOUNTS = [
  { role: 'Alumni', name: 'Sipho Ndlovu', email: 'alumni@sicconnect.example', password: 'Alumni#12345' },
  { role: 'Mentor', name: 'Thandiwe Mokoena', email: 'mentor@sicconnect.example', password: 'Mentor#12345' },
  { role: 'Admin', name: 'SIC Administrator', email: 'admin@sicconnect.example', password: 'Admin#12345' },
];

const DAY = 24 * 60 * 60 * 1000;

export function buildInitialState(now = Date.now()) {
  const ago = (days, hours = 0) => new Date(now - days * DAY - hours * 3600 * 1000).toISOString();
  const ahead = (days, hours = 0) => new Date(now + days * DAY + hours * 3600 * 1000).toISOString();

  let seq = 1;
  const id = () => seq++;

  const skills = (...items) =>
    items.map((s) => (typeof s === 'string' ? { id: id(), name: s, level: null } : { id: id(), ...s }));
  const certs = (...items) =>
    items.map(([name, issuer, daysAgo]) => ({ id: id(), name, issuer, issuedOn: ago(daysAgo), credentialUrl: null }));
  const projects = (...items) =>
    items.map(([title, techStack, summary = null]) => ({
      id: id(),
      title,
      summary,
      techStack,
      gitHubUrl: null,
      demoUrl: null,
      achievements: null,
      createdAt: ago(60),
    }));

  const user = (email, password, role, createdDaysAgo, profile, status = 'Approved') => ({
    id: id(),
    email,
    password,
    role,
    status,
    reviewNote: null,
    reviewedAt: null,
    createdAt: ago(createdDaysAgo),
    profile: {
      id: id(),
      cohort: null,
      location: null,
      industry: null,
      employmentStatus: 'Unspecified',
      bio: null,
      headline: null,
      avatarUrl: null,
      linkedInUrl: null,
      gitHubUrl: null,
      cvUrl: null,
      isMentor: false,
      skills: [],
      certifications: [],
      projects: [],
      ...profile,
    },
  });

  const admin = user('admin@sicconnect.example', 'Admin#12345', 'Admin', 170, {
    fullName: 'SIC Administrator',
    cohort: 'Staff',
    industry: 'Programme Management',
    employmentStatus: 'Employed',
    headline: 'Samsung Innovation Campus — Programme Team',
  });

  const mentor = user('mentor@sicconnect.example', 'Mentor#12345', 'Mentor', 160, {
    fullName: 'Thandiwe Mokoena',
    cohort: '2023',
    location: 'Johannesburg, ZA',
    industry: 'Software',
    employmentStatus: 'Employed',
    headline: 'Backend Engineer · SIC Mentor',
    bio: 'Backend engineer who enjoys helping new graduates find their feet in API and database work.',
    isMentor: true,
    skills: skills({ name: 'C#', level: 'Expert' }, { name: 'ASP.NET Core', level: 'Advanced' }, { name: 'SQL Server', level: 'Advanced' }),
    certifications: certs(['Microsoft Certified: Azure Developer Associate', 'Microsoft', 300]),
    projects: projects(['Mentorship Matching Engine', 'ASP.NET Core, SQL Server', 'Pairs mentees with mentors by skills and goals.']),
  });

  const alumni = user('alumni@sicconnect.example', 'Alumni#12345', 'Alumni', 120, {
    fullName: 'Sipho Ndlovu',
    cohort: '2024',
    location: 'Cape Town, ZA',
    industry: 'Web Development',
    employmentStatus: 'SeekingWork',
    headline: 'Frontend Developer · React & Tailwind',
    bio: 'Frontend developer building accessible React interfaces. Looking for my first full-time role.',
    skills: skills({ name: 'React', level: 'Advanced' }, { name: 'JavaScript', level: 'Advanced' }, { name: 'Tailwind CSS', level: 'Intermediate' }),
    projects: projects(['SIC Study Buddy', 'React, Vite, Tailwind, ASP.NET Core', 'A collaborative study planner built during the programme.']),
  });

  const pendingOne = user('pending1@sicconnect.example', 'Pending#12345', 'Alumni', 2, {
    fullName: 'Lerato Khumalo',
    cohort: '2025',
    location: 'Durban, ZA',
    industry: 'Data Science',
    headline: 'Aspiring Data Analyst',
    skills: skills('Python', 'SQL'),
  }, 'Pending');

  const pendingTwo = user('pending2@sicconnect.example', 'Pending#12345', 'Alumni', 1, {
    fullName: 'Ayanda Mthembu',
    cohort: '2025',
    location: 'Pretoria, ZA',
    industry: 'Software',
    headline: 'Junior Software Engineer',
    skills: skills('Java', 'Spring'),
  }, 'Pending');

  const r = (email, role, created, profile) => user(email, DEMO_PASSWORD, role, created, profile);
  const roster = [
    r('naledi.dlamini@sicconnect.example', 'Mentor', 150, {
      fullName: 'Naledi Dlamini', cohort: 'SIC-Cohort-2022', location: 'Johannesburg, ZA',
      industry: 'Artificial Intelligence & Machine Learning', employmentStatus: 'Employed',
      headline: 'Machine Learning Engineer · SIC Mentor', isMentor: true,
      bio: 'ML engineer working on recommender systems.',
      linkedInUrl: 'https://example.com/linkedin/naledi-dlamini', gitHubUrl: 'https://example.com/github/naledi-dlamini',
      skills: skills('Python', 'TensorFlow', 'SQL', 'Docker', 'Pandas'),
      certifications: certs(['TensorFlow Developer Certificate', 'Google', 400], ['Azure AI Engineer Associate', 'Microsoft', 250]),
      projects: projects(['Alumni Skill Recommender', 'React, FastAPI, scikit-learn'], ['Vision Attendance', 'Python, OpenCV']),
    }),
    r('bongani.nkosi@sicconnect.example', 'Mentor', 140, {
      fullName: 'Bongani Nkosi', cohort: 'SIC-Cohort-2022', location: 'Pretoria, ZA',
      industry: 'DevOps', employmentStatus: 'Employed', headline: 'DevOps Lead · SIC Mentor', isMentor: true,
      bio: 'Platform engineer focused on CI/CD and cloud infrastructure.',
      linkedInUrl: 'https://example.com/linkedin/bongani-nkosi', gitHubUrl: 'https://example.com/github/bongani-nkosi',
      skills: skills('Kubernetes', 'AWS', 'Terraform', 'Docker'),
      certifications: certs(['AWS Solutions Architect', 'Amazon', 300], ['Certified Kubernetes Administrator', 'CNCF', 180]),
      projects: projects(['GitOps Starter Kit', 'Terraform, ArgoCD, AWS']),
    }),
    r('zanele.khumalo@sicconnect.example', 'Mentor', 130, {
      fullName: 'Zanele Khumalo', cohort: 'SIC-Cohort-2023', location: 'Cape Town, ZA',
      industry: 'Cybersecurity', employmentStatus: 'Employed', headline: 'Security Analyst · SIC Mentor', isMentor: true,
      bio: 'Blue-team analyst. Happy to talk SOC careers and certifications.',
      linkedInUrl: 'https://example.com/linkedin/zanele-khumalo', gitHubUrl: 'https://example.com/github/zanele-khumalo',
      skills: skills('Network Security', 'Python', 'SIEM'),
      certifications: certs(['CompTIA Security+', 'CompTIA', 220], ['Certified Ethical Hacker', 'EC-Council', 260]),
      projects: projects(['Phishing Detector', 'Python, scikit-learn']),
    }),
    r('kabelo.sithole@sicconnect.example', 'Alumni', 110, {
      fullName: 'Kabelo Sithole', cohort: 'SIC-Cohort-2024', location: 'Johannesburg, ZA',
      industry: 'Cloud Computing', employmentStatus: 'Employed', headline: 'Cloud Engineer',
      linkedInUrl: 'https://example.com/linkedin/kabelo-sithole', gitHubUrl: 'https://example.com/github/kabelo-sithole',
      skills: skills('Azure', 'C#', 'Docker', 'Kubernetes'),
      certifications: certs(['Azure Fundamentals', 'Microsoft', 200], ['Azure Administrator', 'Microsoft', 120]),
      projects: projects(['Serverless Alumni API', 'Azure Functions, C#'], ['Cost Dashboard', 'React, Azure']),
    }),
    r('nomsa.zulu@sicconnect.example', 'Alumni', 95, {
      fullName: 'Nomsa Zulu', cohort: 'SIC-Cohort-2025', location: 'Durban, ZA',
      industry: 'Data Science & Analytics', employmentStatus: 'SeekingWork', headline: 'Data Analyst',
      linkedInUrl: 'https://example.com/linkedin/nomsa-zulu', gitHubUrl: 'https://example.com/github/nomsa-zulu',
      skills: skills('Python', 'SQL', 'Power BI'),
      certifications: certs(['Google Data Analytics', 'Google', 150]),
      projects: projects(['Township Retail Insights', 'Python, Power BI']),
    }),
    r('ayanda.mokoena@sicconnect.example', 'Alumni', 80, {
      fullName: 'Ayanda Mokoena', cohort: 'SIC-Cohort-2024', location: 'Cape Town, ZA',
      industry: 'Mobile Development', employmentStatus: 'Employed', headline: 'Mobile Developer',
      linkedInUrl: 'https://example.com/linkedin/ayanda-mokoena', gitHubUrl: 'https://example.com/github/ayanda-mokoena',
      skills: skills('Kotlin', 'Flutter', 'Firebase'),
      projects: projects(['SIC Events App', 'Flutter, Firebase'], ['Study Timer', 'Kotlin']),
    }),
    r('thabo.molefe@sicconnect.example', 'Alumni', 60, {
      fullName: 'Thabo Molefe', cohort: 'SIC-Cohort-2023', location: 'Johannesburg, ZA',
      industry: 'Quality Assurance / Testing', employmentStatus: 'Employed', headline: 'QA Automation Engineer',
      linkedInUrl: 'https://example.com/linkedin/thabo-molefe', gitHubUrl: 'https://example.com/github/thabo-molefe',
      skills: skills('Selenium', 'Cypress', 'Playwright'),
      certifications: certs(['ISTQB Foundation', 'ISTQB', 90]),
    }),
    r('lerato.mahlangu@sicconnect.example', 'Alumni', 40, {
      fullName: 'Lerato Mahlangu', cohort: 'SIC-Cohort-2025', location: 'Pretoria, ZA',
      industry: 'UI/UX Design', employmentStatus: 'Freelancing', headline: 'UI/UX Designer',
      linkedInUrl: 'https://example.com/linkedin/lerato-mahlangu', gitHubUrl: 'https://example.com/github/lerato-mahlangu',
      skills: skills('Figma', 'Design Systems', 'HTML/CSS'),
      projects: projects(['SIC Connect Design Kit', 'Figma']),
    }),
    r('sizwe.dube@sicconnect.example', 'Alumni', 20, {
      fullName: 'Sizwe Dube', cohort: 'SIC-Cohort-2024', location: 'Durban, ZA',
      industry: 'Software Development', employmentStatus: 'Employed', headline: 'Backend Developer',
      linkedInUrl: 'https://example.com/linkedin/sizwe-dube', gitHubUrl: 'https://example.com/github/sizwe-dube',
      skills: skills('C#', 'ASP.NET Core', 'PostgreSQL', 'Redis'),
      certifications: certs(['Microsoft Certified: .NET', 'Microsoft', 140], ['Scrum Fundamentals', 'Scrum.org', 60]),
      projects: projects(['Alumni Jobs Aggregator', 'ASP.NET Core, PostgreSQL'], ['Realtime Chat', 'SignalR, Redis']),
    }),
  ];

  const users = [admin, mentor, alumni, pendingOne, pendingTwo, ...roster];
  const byEmail = (e) => users.find((u) => u.email === e);

  const opp = (type, title, organisation, description, location, createdDaysAgo, extra = {}) => ({
    id: id(), type, title, organisation, description, location,
    applyUrl: null, deadline: null, isMentorshipTagged: false, createdAt: ago(createdDaysAgo), ...extra,
  });
  const internship = opp('Internship', 'Software Engineering Intern (React & .NET)', 'Samsung R&D',
    '6-month internship working on Android tooling with React and ASP.NET Core.', 'Remote / Hybrid', 30,
    { isMentorshipTagged: true, deadline: ahead(25) });
  const opportunities = [
    internship,
    opp('Hackathon', 'SIC Alumni Hackathon 2026', 'Samsung Innovation Campus',
      '48-hour hackathon open to all alumni. Build with IoT, AI or mobile.', 'Johannesburg', 10, { deadline: ahead(20) }),
    opp('GraduateProgramme', 'Graduate Developer Programme', 'Fictional Bank Group',
      'Twelve-month rotation across web, data and cloud teams for recent graduates with JavaScript or C# skills.', 'Cape Town', 6,
      { deadline: ahead(14) }),
    opp('Job', 'Junior Frontend Developer', 'Example Digital Studio',
      'Build React and Tailwind CSS interfaces for client products in a small, supportive team.', 'Cape Town / Hybrid', 4),
    opp('Job', 'Cloud Support Engineer', 'Example Cloud Partners',
      'First-line support for Azure workloads; Docker and Kubernetes exposure is a plus.', 'Johannesburg', 45),
    opp('Scholarship', 'Postgraduate Cybersecurity Bursary', 'Example Skills Foundation',
      'Bursary covering tuition for an honours or postgraduate diploma in cybersecurity.', 'South Africa', 70,
      { deadline: ahead(40), isMentorshipTagged: true }),
  ];

  const ev = (title, description, startsInDays, venue, isOnline, capacity, createdDaysAgo) => ({
    id: id(), title, description,
    startsAt: startsInDays >= 0 ? ahead(startsInDays, 2) : ago(-startsInDays),
    endsAt: null, venue, isOnline, capacity, createdAt: ago(createdDaysAgo),
  });
  const networkingEvening = ev('Alumni Networking Evening', 'Meet fellow graduates and Samsung engineers.', 21,
    'Samsung Offices, Bryanston', false, 100, 12);
  const cvClinic = ev('CV & LinkedIn Clinic', 'Mentors review your CV and LinkedIn profile live.', 9, 'Online (link sent on registration)', true, 40, 8);
  const pastWorkshop = ev('Intro to Docker Workshop', 'Hands-on containers workshop for alumni.', -35, 'Online', true, 60, 60);
  const pastMeetup = ev('Cape Town Alumni Meetup', 'Informal meetup for Western Cape alumni.', -70, 'Cape Town', false, 50, 90);
  const events = [networkingEvening, cvClinic, pastWorkshop, pastMeetup];

  const registrations = [
    { eventId: networkingEvening.id, userId: mentor.id, registeredAt: ago(5) },
    { eventId: networkingEvening.id, userId: byEmail('kabelo.sithole@sicconnect.example').id, registeredAt: ago(4) },
    { eventId: networkingEvening.id, userId: byEmail('nomsa.zulu@sicconnect.example').id, registeredAt: ago(3) },
    { eventId: cvClinic.id, userId: byEmail('zanele.khumalo@sicconnect.example').id, registeredAt: ago(2) },
    { eventId: pastWorkshop.id, userId: alumni.id, registeredAt: ago(45) },
    { eventId: pastWorkshop.id, userId: byEmail('sizwe.dube@sicconnect.example').id, registeredAt: ago(44) },
    { eventId: pastWorkshop.id, userId: byEmail('bongani.nkosi@sicconnect.example').id, registeredAt: ago(44) },
    { eventId: pastMeetup.id, userId: byEmail('ayanda.mokoena@sicconnect.example').id, registeredAt: ago(80) },
    { eventId: pastMeetup.id, userId: byEmail('lerato.mahlangu@sicconnect.example').id, registeredAt: ago(78) },
  ];

  const announcements = [
    { id: id(), title: 'Welcome to SIC Connect', body: 'The alumni platform is live — complete your profile and explore opportunities.', audience: 'All', publishedAt: ago(30) },
    { id: id(), title: 'Mentor applications are open', body: 'Alumni who reach 150 XP with a complete profile can now apply to become mentors.', audience: 'Alumni', publishedAt: ago(7) },
    { id: id(), title: 'Hackathon registrations closing soon', body: 'The SIC Alumni Hackathon 2026 closes for entries in less than three weeks.', audience: 'All', publishedAt: ago(2) },
  ];

  const applications = [
    { id: id(), opportunityId: internship.id, userId: alumni.id, status: 'Submitted', coverNote: 'Keen to apply my React and .NET skills on real Samsung tooling.', createdAt: ago(3) },
    { id: id(), opportunityId: internship.id, userId: byEmail('nomsa.zulu@sicconnect.example').id, status: 'UnderReview', coverNote: 'I would love to bring data skills to tooling analytics.', createdAt: ago(6) },
  ];

  const conn = (requester, addressee, type, status, message, createdDaysAgo) => ({
    id: id(), requesterId: requester.id, addresseeId: addressee.id, type, status, message,
    createdAt: ago(createdDaysAgo), respondedAt: status === 'Pending' ? null : ago(createdDaysAgo - 1),
  });
  const E = byEmail;
  const connections = [
    conn(alumni, mentor, 'Mentorship', 'Pending', "Hi Thandiwe, I'd love your guidance as I break into backend work.", 1),
    conn(alumni, mentor, 'Connection', 'Accepted', null, 3),
    conn(E('kabelo.sithole@sicconnect.example'), E('nomsa.zulu@sicconnect.example'), 'Connection', 'Accepted', null, 20),
    conn(E('kabelo.sithole@sicconnect.example'), E('sizwe.dube@sicconnect.example'), 'Connection', 'Accepted', null, 15),
    conn(E('sizwe.dube@sicconnect.example'), E('ayanda.mokoena@sicconnect.example'), 'Connection', 'Accepted', null, 10),
    conn(E('nomsa.zulu@sicconnect.example'), E('lerato.mahlangu@sicconnect.example'), 'Connection', 'Accepted', null, 8),
    conn(E('nomsa.zulu@sicconnect.example'), E('naledi.dlamini@sicconnect.example'), 'Mentorship', 'Accepted', 'Would love guidance on ML roles.', 25),
    conn(E('kabelo.sithole@sicconnect.example'), E('bongani.nkosi@sicconnect.example'), 'Mentorship', 'Accepted', 'Keen to grow into DevOps.', 18),
    conn(E('lerato.mahlangu@sicconnect.example'), alumni, 'Connection', 'Pending', 'Hi Sipho, fellow frontend person here!', 0),
  ];

  const messages = [
    { id: id(), senderId: alumni.id, recipientId: mentor.id, body: 'Hi Thandiwe! Thanks for connecting. Could I ask you a couple of questions about backend roles?', sentAt: ago(0, 3), readAt: ago(0, 2) },
    { id: id(), senderId: mentor.id, recipientId: alumni.id, body: 'Of course, Sipho — happy to help. What are you working on at the moment?', sentAt: ago(0, 2), readAt: null },
  ];

  const notifications = [
    { id: id(), userId: alumni.id, message: 'Welcome to SIC Connect! Complete your profile to get better recommendations.', link: '/profile', isRead: false, createdAt: ago(5) },
    { id: id(), userId: alumni.id, message: 'Lerato Mahlangu sent you a connection request.', link: '/networking', isRead: false, createdAt: ago(0, 1) },
    { id: id(), userId: mentor.id, message: 'Sipho Ndlovu sent you a mentorship request.', link: '/networking', isRead: false, createdAt: ago(1) },
    { id: id(), userId: admin.id, message: 'Two new accounts are awaiting approval.', link: '/approvals', isRead: false, createdAt: ago(1) },
    { id: id(), userId: admin.id, message: 'Sipho Ndlovu applied for Software Engineering Intern (React & .NET).', link: '/opportunities', isRead: true, createdAt: ago(3) },
  ];

  return {
    version: 1,
    seq,
    users,
    opportunities,
    events,
    registrations,
    announcements,
    applications,
    connections,
    messages,
    notifications,
  };
}
