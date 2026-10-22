import { Link, useLocation } from 'react-router-dom';
import { titleForPath } from '../lib/navigation.js';

/** Home → Section breadcrumb derived from the current route. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const title = titleForPath(pathname);
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Breadcrumb">
      <Link to="/dashboard" className="hover:text-slate-600">
        Home
      </Link>
      {!isDashboard && (
        <>
          <span>/</span>
          <span className="font-medium text-slate-600">{title}</span>
        </>
      )}
    </nav>
  );
}
