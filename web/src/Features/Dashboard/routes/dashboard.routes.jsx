import { Route, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import MonitorsListPage from '../../Monitors/pages/monitors.pages';
import MonitorDetailPage from '../../Monitors/pages/monitor-detail.pages';
import AlertsPage from '../../Alerts/pages/alerts.pages';
import StatusPagesPage from '../../StatusPages/pages/status-pages.pages';
import BillingPage from '../../Billing/pages/billing.pages';
import TeamPage from '../../Team/pages/team.pages';
import ProfilePage from '../../Profile/pages/profile.pages';

function MonitorEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/monitors/${id}?edit=1`} replace />;
}

export const dashboardRouteElements = (
  <>
    <Route path="/dashboard" element={<Navigate to="/dashboard/monitors" replace />} />
    <Route path="/dashboard/monitors" element={<ProtectedRoute><MonitorsListPage /></ProtectedRoute>} />
    <Route path="/dashboard/monitors/new" element={<Navigate to="/dashboard/monitors?create=1" replace />} />
    <Route path="/dashboard/monitors/:id/edit" element={<MonitorEditRedirect />} />
    <Route path="/dashboard/monitors/:id" element={<ProtectedRoute><MonitorDetailPage /></ProtectedRoute>} />
    <Route path="/dashboard/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
    <Route path="/dashboard/status-pages" element={<ProtectedRoute><StatusPagesPage /></ProtectedRoute>} />
    <Route path="/dashboard/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
    <Route path="/dashboard/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
    <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
  </>
);

export default dashboardRouteElements;
