// Mirrors the backend enums so the UI can render friendly labels and populate selects.

export const EMPLOYMENT_STATUS = [
  { value: 'Unspecified', label: 'Unspecified' },
  { value: 'Student', label: 'Student' },
  { value: 'Employed', label: 'Employed' },
  { value: 'SelfEmployed', label: 'Self-employed' },
  { value: 'Freelancing', label: 'Freelancing' },
  { value: 'SeekingWork', label: 'Seeking work' },
  { value: 'Internship', label: 'Internship' },
];

// Samsung Innovation Campus cohorts (newest first). Extend as new cohorts graduate.
export const SIC_COHORTS = [
  'SIC-Cohort-2027',
  'SIC-Cohort-2026',
  'SIC-Cohort-2025',
  'SIC-Cohort-2024',
  'SIC-Cohort-2023',
  'SIC-Cohort-2022',
];

// Predefined IT / technology industries for the profile industry dropdown.
export const IT_INDUSTRIES = [
  'Software Development',
  'Web Development',
  'Mobile Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cloud Computing',
  'Cybersecurity',
  'DevOps',
  'IT Support & Infrastructure',
  'Networking',
  'Database Administration',
  'UI/UX Design',
  'Game Development',
  'Embedded Systems / IoT',
  'Telecommunications',
  'Fintech',
  'E-commerce',
  'Quality Assurance / Testing',
  'Blockchain',
  'Other',
];

export const OPPORTUNITY_TYPES = [
  { value: 'Job', label: 'Job', tone: 'brand' },
  { value: 'Internship', label: 'Internship', tone: 'green' },
  { value: 'GraduateProgramme', label: 'Graduate programme', tone: 'purple' },
  { value: 'Hackathon', label: 'Hackathon', tone: 'amber' },
  { value: 'Scholarship', label: 'Scholarship', tone: 'slate' },
];

export const APPLICATION_STATUS = [
  { value: 'Submitted', label: 'Submitted', tone: 'brand' },
  { value: 'UnderReview', label: 'Under review', tone: 'amber' },
  { value: 'Accepted', label: 'Accepted', tone: 'green' },
  { value: 'Rejected', label: 'Rejected', tone: 'red' },
  { value: 'Withdrawn', label: 'Withdrawn', tone: 'slate' },
];

export const CONNECTION_STATUS = [
  { value: 'Pending', label: 'Pending', tone: 'amber' },
  { value: 'Accepted', label: 'Connected', tone: 'green' },
  { value: 'Declined', label: 'Declined', tone: 'slate' },
];

export const CONNECTION_TYPE = [
  { value: 'Connection', label: 'Connection', tone: 'brand' },
  { value: 'Mentorship', label: 'Mentorship', tone: 'purple' },
];

export function labelFor(list, value) {
  return list.find((x) => x.value === value)?.label || value;
}

export function toneFor(list, value) {
  return list.find((x) => x.value === value)?.tone || 'slate';
}

export function formatDate(value, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, opts);
}

export function formatDateTime(value) {
  return formatDate(value, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.round((Date.now() - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(value);
}
