import { useState } from 'react';
import { Button, Input, Card, Logo } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import styles from './LoginForm.module.css';

/**
 * DevNest Academy — Login Form component.
 * Accepts email/student-code + password.
 */
export default function LoginForm({ onSubmit, isLoading = false }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  const validate = () => {
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'البريد الإلكتروني أو رمز الطالب مطلوب';
    }

    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(identifier.trim(), password);
      addToast({ type: 'success', message: 'تم تسجيل الدخول بنجاح!' });
    } catch (error) {
      const message =
        error.response?.data?.message || 'فشل تسجيل الدخول. حاول مرة أخرى.';
      addToast({ type: 'error', message });
    }
  };

  return (
    <Card variant="elevated" padding="lg" className={styles.card}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
          <Logo size="md" />
        </div>
        <h1 className={styles.title}>تسجيل الدخول</h1>
        <p className={styles.subtitle}>مرحباً بك في المنصة التعليمية</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          label="البريد الإلكتروني أو رمز الطالب"
          type="text"
          placeholder="example@email.com أو DN-FE-26-001"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          dir="ltr"
          autoComplete="username"
          autoFocus
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          dir="ltr"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        >
          دخول
        </Button>
      </form>
    </Card>
  );
}
