import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import { Skeleton } from '@/components/ui';
import styles from './LoginPage.module.css';

/**
 * DevNest Academy — Login Page.
 * Full-page centered login with brand gradient background accent.
 */
export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show skeleton while checking auth state
  if (authLoading) {
    return (
      <div className={styles.page}>
        <Skeleton variant="card" width="420px" height="380px" />
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin' : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  const handleLogin = async (identifier, password) => {
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glowAccent} aria-hidden="true" />
      <LoginForm onSubmit={handleLogin} isLoading={isSubmitting} />
    </div>
  );
}
