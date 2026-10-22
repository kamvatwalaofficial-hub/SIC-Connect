import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import { NotificationBell } from '../features/notifications/NotificationBell.jsx';
import { navSectionsForRole } from '../lib/navigation.js';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function NavItem({ item, onNavigate }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  const Icon = item.icon;

  return (
    <NavLink to={item.to} className={linkClass} onClick={onNavigate} end={item.end}>
      <span className="flex h-5 w-5 items-center justify-center">
        <Icon
          size={20}
          strokeWidth={2}
          className="text-current"
        />
      </span>
      {item.label}
    </NavLink>
  );
}

function Sidebar({ sections, onNavigate }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
          SC
        </div>
        <svg class="icon" focusable="false" aria-hidden="true" width="130" height="29" viewBox="0 0 130 29" data-di-res-id="a27f4635-94bb251f" data-di-rand="1784818166494">
              <g transform="translate(-250 -7)">
                <path d="M0,13.835V12.482H4.609V14.2a1.558,1.558,0,0,0,1.724,1.6A1.509,1.509,0,0,0,8,14.6a2.237,2.237,0,0,0-.03-1.322C7.076,10.976.981,9.931.208,6.333a6.531,6.531,0,0,1-.029-2.4C.654,1.045,3.122,0,6.184,0c2.438,0,5.8.585,5.8,4.458V5.719H7.7V4.612a1.492,1.492,0,0,0-1.605-1.6,1.452,1.452,0,0,0-1.575,1.2,2.468,2.468,0,0,0,.03.922c.5,2.059,7.017,3.167,7.73,6.887a8.481,8.481,0,0,1,.029,2.921C11.892,17.893,9.336,19,6.244,19,3,19,0,17.8,0,13.835Zm55.837-.062V12.421h4.549v1.691a1.533,1.533,0,0,0,1.695,1.6,1.49,1.49,0,0,0,1.665-1.168,2.147,2.147,0,0,0-.029-1.292c-.863-2.274-6.9-3.319-7.671-6.917a6.37,6.37,0,0,1-.03-2.367c.476-2.859,2.944-3.9,5.946-3.9,2.409,0,5.739.615,5.739,4.427v1.23H63.449V4.643a1.485,1.485,0,0,0-1.575-1.6,1.4,1.4,0,0,0-1.546,1.168,2.463,2.463,0,0,0,.029.922C60.832,7.194,67.284,8.27,68,11.959a8.314,8.314,0,0,1,.029,2.89c-.416,2.952-2.943,4.028-6.005,4.028C58.811,18.877,55.837,17.678,55.837,13.773Zm16.293.647A7.18,7.18,0,0,1,72.1,13.25V.523h4.341V13.65a5.023,5.023,0,0,0,.029.677,1.682,1.682,0,0,0,3.271,0,4.852,4.852,0,0,0,.03-.677V.523h4.341V13.25c0,.339-.03.984-.03,1.169-.3,3.319-2.825,4.4-5.976,4.4S72.428,17.739,72.13,14.419Zm35.739-.185a9.539,9.539,0,0,1-.059-1.168V5.6c0-.308.029-.861.059-1.169.386-3.319,2.973-4.365,6.036-4.365,3.033,0,5.708,1.045,6.006,4.365A8.781,8.781,0,0,1,119.94,5.6v.584H115.6V5.2a3.791,3.791,0,0,0-.059-.677,1.777,1.777,0,0,0-3.42,0,3.772,3.772,0,0,0-.059.829v8.117a5.1,5.1,0,0,0,.03.677,1.707,1.707,0,0,0,1.813,1.291,1.633,1.633,0,0,0,1.754-1.291,2.554,2.554,0,0,0,.03-.677V10.883h-1.754V8.3H120v4.765a9.377,9.377,0,0,1-.06,1.168c-.3,3.228-3,4.366-6.036,4.366S108.166,17.462,107.869,14.235Zm-60.5,4.027L47.245,1.845,44.272,18.262H39.931L36.987,1.845l-.118,16.417H32.587L32.943.554h6.988L42.1,14.388,44.272.554h6.987l.386,17.708Zm-22.835,0L22.211,1.845,19.831,18.262H15.194L18.344.554h7.642l3.152,17.708Zm72.665-.184L92.884,3.352l.238,14.726H88.9V.554h6.363l4.044,14.265L99.068.554h4.251V18.078Z" transform="translate(255 12)"></path>
              </g>
            </svg>
      </div>

      <nav className="space-y-5">
        {sections.map((section) => (
          <div key={section.heading}>
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.heading}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const sections = navSectionsForRole(user?.role);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar sections={sections} onNavigate={() => setOpen(false)} />
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="btn-secondary lg:hidden" onClick={() => setOpen(true)} type="button" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="hidden min-w-0 sm:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="hidden min-w-0 text-right md:block">
              <div className="max-w-[10rem] truncate text-sm font-semibold text-slate-800 lg:max-w-[16rem]">{user?.fullName}</div>
              <div className="max-w-[10rem] truncate text-xs text-slate-500 lg:max-w-[16rem]">{user?.email}</div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {initials(user?.fullName) || '👤'}
            </div>
            <Badge
              tone={user?.role === 'Admin' ? 'purple' : user?.role === 'Mentor' ? 'amber' : 'brand'}
              className="hidden sm:inline-flex"
            >
              {user?.role}
            </Badge>
            <button className="btn-secondary inline-flex shrink-0 items-center gap-1.5" onClick={handleLogout} type="button">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          <div key={location.pathname} className="enter">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 lg:px-8">
          SIC Connect · Samsung Innovation Campus Alumni Digital Ecosystem
        </footer>
      </div>
    </div>
  );
}
