import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { canWrite } from '../utils/permissions';

export function ProtectedWriteRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!canWrite()) {
    return <Navigate to="/dashboard/monitors" replace />;
  }
  return children;
}
