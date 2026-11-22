import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CreditCard, GraduationCap, Video } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import StatCard from '../components/StatCard';
import { getAdminOverview } from '../api/admin.api';
import styles from './AdminOverviewPage.module.css';

/**
 * Admin Overview & KPI Dashboard Page.
 */
export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await getAdminOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingStack}>
        <div className={styles.statsGrid}>
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
        </div>
        <Skeleton variant="card" height="300px" />
      </div>
    );
  }

  const { kpis, recentApplicants } = data || {};

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>لوحة القيادة والمؤشرات الرئيسية</h1>
          <p className={styles.pageSubtitle}>متابعة لحظية لأداء التسجيلات، الطلاب المؤكدين، ومحتوى المعسكر.</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/applicants">
            <Button variant="primary" size="md" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} />
              <span>إدارة المتقدمين ({kpis?.pendingApplicants || 0} بانتظار المتابعة)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="إجمالي المتقدمين"
          value={kpis?.totalApplicants || 0}
          icon={<Users size={22} />}
          subtitle="منذ إطلاق الدفعة"
          variant="primary"
        />
        <StatCard
          title="الطلاب المؤكدين (تم الدفع)"
          value={kpis?.paidApplicants || 0}
          icon={<CreditCard size={22} />}
          subtitle={`نسبة التحويل: ${kpis?.conversionRate || 0}%`}
          variant="success"
        />
        <StatCard
          title="حسابات الطلاب النشطة"
          value={kpis?.totalStudents || 0}
          icon={<GraduationCap size={22} />}
          subtitle="أكواد طلاب مفعلة بالمنصة"
          variant="brand"
        />
        <StatCard
          title="المحاضرات المنشورة"
          value={kpis?.publishedLessons || 0}
          icon={<Video size={22} />}
          subtitle="متاحة للمشاهدة الآن"
          variant="accent"
        />
      </div>

      {/* Recent Applicants Section */}
      <Card variant="elevated" padding="lg" className={styles.recentCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>أحدث طلبات التسجيل الواصلة</h2>
          <Link to="/admin/applicants" className={styles.viewAllLink}>
            عرض كافة المتقدمين ←
          </Link>
        </div>

        {recentApplicants && recentApplicants.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>الاسم الكامل</th>
                  <th>البريد الإلكتروني</th>
                  <th>رقم الهاتف</th>
                  <th>الكورس</th>
                  <th>حالة الدفع</th>
                  <th>حالة الطلب</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.map((a) => (
                  <tr key={a._id}>
                    <td><strong>{a.fullName}</strong></td>
                    <td dir="ltr">{a.email}</td>
                    <td dir="ltr">{a.phone}</td>
                    <td>{a.courseId?.cohortName || 'دفعة شتاء 2026'}</td>
                    <td>
                      <Badge variant={a.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {a.paymentStatus === 'paid' ? 'تم الدفع' : 'غير مدفوع'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={a.status === 'approved' ? 'success' : a.status === 'contacted' ? 'info' : 'neutral'}>
                        {a.status === 'approved' ? 'مقبول ومفعل' : a.status === 'contacted' ? 'تم التواصل' : 'جديد'}
                      </Badge>
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>لا توجد طلبات تسجيل حتى الآن.</p>
        )}
      </Card>
    </div>
  );
}
