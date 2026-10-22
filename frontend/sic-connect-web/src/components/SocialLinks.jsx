// LinkedIn / GitHub buttons for a professional profile. Each button is rendered only
// when its URL is present, so no empty placeholders are left behind. Opens in a new tab.

function normalise(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const LinkedInIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
  </svg>
);

const GitHubIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

export function SocialLinks({ linkedInUrl, gitHubUrl, size = 'md', className = '' }) {
  const linkedin = normalise(linkedInUrl);
  const github = normalise(gitHubUrl);
  if (!linkedin && !github) return null;

  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 rounded-lg font-semibold text-white transition-colors ${pad}`}
          style={{ backgroundColor: '#0a66c2' }}
        >
          {LinkedInIcon} LinkedIn
        </a>
      )}
      {github && (
        <a
          href={github}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-800 font-semibold text-white transition-colors hover:bg-slate-900 ${pad}`}
        >
          {GitHubIcon} GitHub
        </a>
      )}
    </div>
  );
}
