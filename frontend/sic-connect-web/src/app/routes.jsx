import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from '../components/RouteGuards.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { AuthLayout } from '../layouts/AuthLayout.jsx';

import { LandingPage } from '../features/landing/LandingPage.jsx';
import { ContactPage } from '../features/contact/ContactPage.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage.jsx';
import { RegisterPage } from '../features/auth/pages/RegisterPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ProfilePage } from '../features/profile/pages/ProfilePage.jsx';
import { DirectoryPage } from '../features/directory/pages/DirectoryPage.jsx';
import { NetworkingPage } from '../features/networking/pages/NetworkingPage.jsx';
import { OpportunitiesPage } from '../features/opportunities/pages/OpportunitiesPage.jsx';
import { ApplicationsPage } from '../features/applications/pages/ApplicationsPage.jsx';
import { EventsPage } from '../features/events/pages/EventsPage.jsx';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage.jsx';
import { AnnouncementsPage } from '../features/announcements/pages/AnnouncementsPage.jsx';
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx';
import { MessagesPage } from '../features/messages/pages/MessagesPage.jsx';
import { AdminMentorshipsPage } from '../features/admin/pages/AdminMentorshipsPage.jsx';
import { AccountApprovalsPage } from '../features/admin/pages/AccountApprovalsPage.jsx';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage.jsx';
import { NotFoundPage } from '../features/misc/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public landing + contact pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Shared across all roles */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Alumni & Mentors only — administrators cannot perform these social actions */}
          <Route element={<RequireRole roles={['Alumni', 'Mentor']} />}>
            <Route path="/networking" element={<NetworkingPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<RequireRole roles={['Admin']} />}>
            <Route path="/mentorships" element={<AdminMentorshipsPage />} />
            <Route path="/approvals" element={<AccountApprovalsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Legacy admin paths now live inside the role-aware Dashboard. */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/analytics" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
