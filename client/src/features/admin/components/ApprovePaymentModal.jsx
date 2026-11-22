import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { approvePayment } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './ApprovePaymentModal.module.css';

/**
 * Payment Confirmation & Student Account Activation Modal.
 * Core workflow for activating students and generating their unique code.
 */
export default function ApprovePaymentModal({ isOpen, onClose, applicant, onSuccess }) {
  const { addToast } = useToast();

  const [accessType, setAccessType] = useState('cohort');
  const [initialPassword, setInitialPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activatedData, setActivatedData] = useState(null);

  if (!applicant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await approvePayment(applicant._id, {
        accessType,
        initialPassword: initialPassword.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      setActivatedData(res.data);
      addToast({
        type: 'success',
        message: `تم تفعيل حساب الطالب بنجاح! كود الطالب: ${res.data.student.studentCode}`,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تأكيد الدفع وتفعيل الحساب';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!activatedData) return;
    const { student, courseTitle } = activatedData;
    const message = `مرحباً ${student.fullName}\nتم تأكيد دفع اشتراكك بنجاح في معسكر ${courseTitle} بأكاديمية DevNest!\n\nبيانات الدخول إلى المنصة التعليمية:\nرابط المنصة: ${window.location.origin}/login\nكود الطالب: ${student.studentCode}\nكلمة المرور المؤقتة: ${student.tempPassword}\n\nنتمنى لك رحلة تعليمية موفقة ومثمرة.`;

    navigator.clipboard.writeText(message);
    addToast({ type: 'info', message: 'تم نسخ رسالة التفعيل والبيانات للحافظة!' });
  };

  const handleClose = () => {
    setActivatedData(null);
    setInitialPassword('');
    setAdminNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={activatedData ? 'تم تفعيل حساب الطالب بنجاح' : `تأكيد دفع واشتراك: ${applicant.fullName}`}
      size="md"
    >
      {activatedData ? (
        <div className={styles.successView}>
          <div className={styles.codeCard}>
            <span className={styles.codeLabel}>كود الطالب الفريد (Student Code)</span>
            <strong className={styles.studentCode}>{activatedData.student.studentCode}</strong>
            <span className={styles.codeHint}>يُستخدم لتسجيل الدخول إلى المنصة التعليمية</span>
          </div>

          <div className={styles.credDetails}>
            <div className={styles.credRow}>
              <span>الاسم:</span>
              <strong>{activatedData.student.fullName}</strong>
            </div>
            <div className={styles.credRow}>
              <span>البريد الإلكتروني:</span>
              <span dir="ltr">{activatedData.student.email}</span>
            </div>
            <div className={styles.credRow}>
              <span>رقم الهاتف:</span>
              <span dir="ltr">{activatedData.student.phone}</span>
            </div>
            <div className={styles.credRow}>
              <span>كلمة المرور المؤقتة:</span>
              <strong className={styles.tempPass} dir="ltr">{activatedData.student.tempPassword}</strong>
            </div>
            <div className={styles.credRow}>
              <span>نوع الاشتراك:</span>
              <Badge variant="info">
                {activatedData.enrollment.accessType === 'cohort' ? 'دفعة تفاعلية (Cohort)' : 'مسجل فقط'}
              </Badge>
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" size="lg" fullWidth onClick={handleCopyCredentials} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Copy size={16} />
              <span>نسخ رسالة التفعيل الكاملة للواتساب</span>
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={handleClose}>
              إغلاق
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.applicantSummary}>
            <div>
              <span className={styles.sumLabel}>المتقدم:</span>
              <strong className={styles.sumName}>{applicant.fullName}</strong>
              <span className={styles.sumEmail} dir="ltr">({applicant.email})</span>
            </div>
            <div className={styles.sumBadges}>
              <Badge variant="neutral">{applicant.courseId?.cohortName}</Badge>
              <Badge variant="success">{applicant.courseId?.price} EGP</Badge>
            </div>
          </div>

          {/* Tier Selection */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>نوع الاشتراك والصلاحيات الممنوحة *</label>
            <div className={styles.tierSelect}>
              <label className={`${styles.tierOption} ${accessType === 'cohort' ? styles['tierOption--active'] : ''}`}>
                <input
                  type="radio"
                  name="accessType"
                  value="cohort"
                  checked={accessType === 'cohort'}
                  onChange={(e) => setAccessType(e.target.value)}
                />
                <div>
                  <strong>الدفعة التفاعلية (Cohort) — الوضع الافتراضي</strong>
                  <p>وصول للمحاضرات + تسليم المهام + الاختبارات + الظهور في لوحة المتصدرين.</p>
                </div>
              </label>

              <label className={`${styles.tierOption} ${accessType === 'recorded_only' ? styles['tierOption--active'] : ''}`}>
                <input
                  type="radio"
                  name="accessType"
                  value="recorded_only"
                  checked={accessType === 'recorded_only'}
                  onChange={(e) => setAccessType(e.target.value)}
                />
                <div>
                  <strong>محتوى مسجل فقط (Recorded Only)</strong>
                  <p>مشاهدة الفيديوهات فقط مع حجب المهام والاختبارات ولوحة المتصدرين.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Optional Initial Password */}
          <Input
            label="كلمة المرور الأولية للطالب (اختياري — سيتم توليد كلمة سر تلقائية إذا تُركت فارغة)"
            type="text"
            dir="ltr"
            placeholder="اتركها فارغة للتوليد التلقائي (DevNest@1234)"
            value={initialPassword}
            onChange={(e) => setInitialPassword(e.target.value)}
          />

          {/* Admin notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="adminNotes">ملاحظات الإدارة (طريقة الدفع / رقم الحوالة)</label>
            <textarea
              id="adminNotes"
              className={styles.textarea}
              rows={2}
              placeholder="مثال: تم التحويل عبر فودافون كاش من رقم 010XXXXXXX..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" size="md" onClick={handleClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button variant="primary" size="md" type="submit" loading={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>تأكيد الدفع وتوليد كود الطالب</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
