import { Card } from '@/components/ui';
import styles from './StatCard.module.css';

/**
 * KPI Metric Stat Card for Admin Overview.
 */
export default function StatCard({ title, value, icon, subtitle, trend, variant = 'primary' }) {
  return (
    <Card variant="elevated" padding="md" className={`${styles.card} ${styles[`card--${variant}`]}`}>
      <div className={styles.top}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.main}>
        <strong className={styles.value}>{value}</strong>
      </div>

      {(subtitle || trend) && (
        <div className={styles.footer}>
          {trend && <span className={styles.trend}>{trend}</span>}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
