import { Route, Navigate } from 'react-router-dom';
import { ProtectedAdminRoute } from '../../../components/ProtectedAdminRoute';
import AdminOverviewPage from '../../PlatformAdmin/pages/overview.pages';
import AdminTenantsPage from '../../PlatformAdmin/pages/tenants.pages';
import AdminTenantDetailPage from '../../PlatformAdmin/pages/tenant-detail.pages';
import AdminWorkspacesPage from '../../PlatformAdmin/pages/workspaces.pages';
import AdminBillingPage from '../../PlatformAdmin/pages/billing.pages';
import AdminMonitorsPage from '../../PlatformAdmin/pages/monitors.pages';

export const platformAdminRouteElements = (
  <>
    <Route path="/admin" element={<ProtectedAdminRoute><AdminOverviewPage /></ProtectedAdminRoute>} />
    <Route path="/admin/tenants" element={<ProtectedAdminRoute><AdminTenantsPage /></ProtectedAdminRoute>} />
    <Route path="/admin/tenants/:id" element={<ProtectedAdminRoute><AdminTenantDetailPage /></ProtectedAdminRoute>} />
    <Route path="/admin/workspaces" element={<ProtectedAdminRoute><AdminWorkspacesPage /></ProtectedAdminRoute>} />
    <Route path="/admin/billing" element={<ProtectedAdminRoute><AdminBillingPage /></ProtectedAdminRoute>} />
    <Route path="/admin/monitors" element={<ProtectedAdminRoute><AdminMonitorsPage /></ProtectedAdminRoute>} />
    <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
  </>
);

export default platformAdminRouteElements;
