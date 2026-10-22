import { PageHeader } from '../../../components/PageHeader.jsx';
import { UsersManagementSection } from '../UsersManagementSection.jsx';

export function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="View and manage every SIC Connect account — search, filter, sort, change roles and remove users."
      />
      <UsersManagementSection />
    </div>
  );
}
