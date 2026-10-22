import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  Briefcase,
  CalendarDays,
  Megaphone,
  Handshake,
  Bell,
  User,
  Home,
  Compass,
  MessagesSquare,
  Send,
  Rocket,
  GraduationCap,
} from 'lucide-react';

// Role-aware navigation. Every role shares the same styling/branding (rendered by AppLayout);
// only the links differ. Keyed by the JWT role: Admin | Alumni | Mentor.

const ADMIN_NAV = [
  {
    heading: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    heading: 'Management',
    items: [
      { to: '/approvals', label: 'Account Approvals', icon: CheckCircle2 },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
      { to: '/events', label: 'Events', icon: CalendarDays },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/mentorships', label: 'Mentorships', icon: Handshake },
    ],
  },
  {
    heading: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
];

const ALUMNI_NAV = [
  {
    heading: 'Community',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: Home, end: true },
      { to: '/directory', label: 'Community', icon: Compass },
      { to: '/networking', label: 'Mentors & Network', icon: Handshake },
      { to: '/messages', label: 'Messages', icon: MessagesSquare },
    ],
  },
  {
    heading: 'Grow',
    items: [
      { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
      { to: '/applications', label: 'My Applications', icon: Send },
      { to: '/events', label: 'Events', icon: CalendarDays },
      { to: '/projects', label: 'My Projects', icon: Rocket },
    ],
  },
  {
    heading: 'Updates',
    items: [
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'My Profile', icon: User },
    ],
  },
];

const MENTOR_NAV = [
  {
    heading: 'Mentoring',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: Home, end: true },
      { to: '/networking', label: 'Mentees & Requests', icon: GraduationCap },
      { to: '/messages', label: 'Messages', icon: MessagesSquare },
    ],
  },
  {
    heading: 'Community',
    items: [{ to: '/directory', label: 'Community', icon: Compass }],
  },
  {
    heading: 'Explore',
    items: [
      { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
      { to: '/events', label: 'Events', icon: CalendarDays },
    ],
  },
  {
    heading: 'Updates',
    items: [
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'My Profile', icon: User },
    ],
  },
];

export function navSectionsForRole(role) {
  if (role === 'Admin') return ADMIN_NAV;
  if (role === 'Mentor') return MENTOR_NAV;
  return ALUMNI_NAV;
}

// Path → human label, for breadcrumbs and tab titles.
export const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/directory': 'Community',
  '/networking': 'Mentors & Network',
  '/opportunities': 'Opportunities',
  '/applications': 'My Applications',
  '/events': 'Events',
  '/projects': 'My Projects',
  '/announcements': 'Announcements',
  '/notifications': 'Notifications',
  '/messages': 'Messages',
  '/profile': 'Profile',
  '/mentorships': 'Mentorship Management',
  '/approvals': 'Account Approvals',
  '/admin/users': 'Users',
};

export function titleForPath(pathname) {
  return ROUTE_TITLES[pathname] || 'SIC Connect';
}
