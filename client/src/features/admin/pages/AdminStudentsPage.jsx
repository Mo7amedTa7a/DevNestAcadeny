import { useState, useEffect, useCallback } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import { getStudents, resetStudentSession, toggleStudentActive } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './AdminStudentsPage.module.css';

/**
 * Enrolled Students & Active Sessions Management Page.
 */
export default function AdminStudentsPage() {
  const { addToast } = useToast();

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل قائمة الطلاب' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStudentsList();
  }, [fetchStudentsList]);

  const handleResetSession = async (studentId, studentName) => {
    try {
      await resetStudentSession(studentId);
      addToast({
        type: 'success',
        message: `تمت إعادة ضبط جلسة الطالب (${studentName}) بنجاح. يستطيع الدخول من جهازه الآن.`,
      });
      fetchStudentsList();
    } catch (err) {
      addToast({ type: 'error', message: 'فشل إعادة ضبط الجلسة' });
    }
  };

  const handleToggleActive = async (studentId) => {
    try {
      const res = await toggleStudentActive(studentId);
      addToast({
        type: 'info',
        message: res.isActive ? 'تم تنشيط حساب الطالب' : 'تم تجميد حساب الطالب وإبطال جلسته',
      });
      fetchStudentsList();
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تغيير حالة الحساب' });
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast({ type: 'info', message: `تم نسخ كود الطالب: ${code}` });
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الطلاب وأكواد التفعيل وإدارة الجلسات</h1>
          <p className={styles.pageSubtitle}>
            عرض الحسابات المفعلة، نسخ الأكواد، ومراقبة الجلسات النشطة لفك تعليق الأجهزة المشتركة.
          </p>
        </div>

        <Badge variant="info" size="md">
          إجمالي الطلاب: {students.length}
        </Badge>
      </div>

      <Card variant="elevated" padding="none" className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loadingPadding}>
            <Skeleton variant="card" height="240px" />
          </div>
        ) : students.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>كود الطالب</th>
                    <th>الاسم الكامل</th>
                    <th>بيانات الاتصال</th>
                    <th>الدفعة والمسار</th>
                    <th>نوع الاشتراك</th>
                    <th>الجلسة النشطة</th>
                    <th>حالة الحساب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className={!s.isActive ? styles['tr--suspended'] : ''}>
                      {/* Student Code */}
                      <td>
                        <div className={styles.codeCell}>
                          <strong className={styles.studentCode} dir="ltr">
                            {s.studentCode || 'غير محدد'}
                          </strong>
                          {s.studentCode && (
                            <button
                              type="button"
                              className={styles.copyBtn}
                              onClick={() => handleCopyCode(s.studentCode)}
                              title="نسخ كود الطالب"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td>
                        <strong className={styles.studentName}>{s.fullName}</strong>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className={styles.contactCell}>
                          <span dir="ltr">{s.email}</span>
                          {s.phone && <span className={styles.phone} dir="ltr">{s.phone}</span>}
                        </div>
                      </td>

                      {/* Cohort */}
                      <td>
                        <span>{s.enrollment?.cohortName || 'دفعة شتاء 2026'}</span>
                      </td>

                      {/* Tier */}
                      <td>
                        <Badge variant={s.enrollment?.accessType === 'cohort' ? 'info' : 'neutral'} size="sm">
                          {s.enrollment?.accessType === 'cohort' ? 'دفعة تفاعلية' : 'مسجل فقط'}
                        </Badge>
                      </td>

                      {/* Active Session Indicator */}
                      <td>
                        {s.hasActiveSession ? (
                          <div className={styles.sessionActive}>
                            <span className={styles.onlineDot} />
                            <span>جلسة نشطة</span>
                          </div>
                        ) : (
                          <span className={styles.sessionIdle}>غير متصل</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td>
                        <Badge variant={s.isActive ? 'success' : 'danger'} size="sm">
                          {s.isActive ? 'مفعل' : 'مجمد'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionBtns}>
                          {s.hasActiveSession && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResetSession(s._id, s.fullName)}
                              title="إلغاء الجلسة من السيرفر ليتمكن الطالب من تسجيل الدخول من جهاز آخر"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RotateCcw size={13} />
                              <span>فك تعليق الجلسة</span>
                            </Button>
                          )}
                          <Button
                            variant={s.isActive ? 'ghost' : 'secondary'}
                            size="sm"
                            onClick={() => handleToggleActive(s._id)}
                          >
                            {s.isActive ? 'تجميد' : 'تنشيط'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (< 768px) */}
            <div className={styles.mobileCardsList}>
              {students.map((s) => (
                <div
                  key={s._id}
                  className={`${styles.studentMobileCard} ${!s.isActive ? styles['studentMobileCard--suspended'] : ''}`}
                >
                  {/* Card Header: Student Name & Badges */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderInfo}>
                      <strong className={styles.cardFullName}>{s.fullName}</strong>
                      <span className={styles.cardCohortTag}>{s.enrollment?.cohortName || 'دفعة شتاء 2026'}</span>
                    </div>
                    <div className={styles.cardBadges}>
                      <Badge variant={s.isActive ? 'success' : 'danger'} size="sm">
                        {s.isActive ? 'مفعل' : 'مجمد'}
                      </Badge>
                      <Badge variant={s.enrollment?.accessType === 'cohort' ? 'info' : 'neutral'} size="sm">
                        {s.enrollment?.accessType === 'cohort' ? 'تفاعلية' : 'مسجل'}
                      </Badge>
                    </div>
                  </div>

                  {/* Student Code Row */}
                  <div className={styles.cardCodeRow}>
                    <div className={styles.cardCodeBox}>
                      <span className={styles.cardCodeLabel}>كود التفعيل:</span>
                      <strong className={styles.studentCode} dir="ltr">
                        {s.studentCode || 'غير محدد'}
                      </strong>
                      {s.studentCode && (
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopyCode(s.studentCode)}
                          title="نسخ كود الطالب"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>

                    <div className={styles.cardSessionStatus}>
                      {s.hasActiveSession ? (
                        <div className={styles.sessionActive}>
                          <span className={styles.onlineDot} />
                          <span>جلسة نشطة</span>
                        </div>
                      ) : (
                        <span className={styles.sessionIdle}>غير متصل</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className={styles.cardContactBox}>
                    <div className={styles.cardContactItem}>
                      <span className={styles.contactItemLabel}>البريد:</span>
                      <span className={styles.contactItemVal} dir="ltr">{s.email}</span>
                    </div>
                    {s.phone && (
                      <div className={styles.cardContactItem}>
                        <span className={styles.contactItemLabel}>الهاتف:</span>
                        <a href={`tel:${s.phone}`} className={styles.contactItemPhone} dir="ltr">
                          {s.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className={styles.cardActionsRow}>
                    {s.hasActiveSession && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetSession(s._id, s.fullName)}
                        className={styles.cardActionBtn}
                      >
                        <RotateCcw size={14} />
                        <span>فك تعليق الجلسة</span>
                      </Button>
                    )}
                    <Button
                      variant={s.isActive ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleActive(s._id)}
                      className={styles.cardActionBtn}
                    >
                      {s.isActive ? 'تجميد الحساب' : 'تنشيط الحساب'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyView}>
            <p>لا يوجد طلاب مفعلين بعد. يمكنك تأكيد دفع المتقدمين لتفعيل حساباتهم وتوليد الأكواد.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
