import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Skeleton } from '@/components/ui';

/**
 * Route protection guard for Student portal.
 * Allows authenticated students and admins.
 */
export default function StudentRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Skeleton variant="card" width="500px" height="300px" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Non-students (e.g. visitors) redirected to login
  if (user.role !== 'student' && user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
