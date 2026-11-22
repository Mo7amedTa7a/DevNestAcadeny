import { useState, useEffect } from 'react';
import {
  Modal,
  Badge,
  Button,
} from '@/components/ui';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Copy,
  Check,
  Save,
  BookOpen,
  Target,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { updateApplicantStatus } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './ApplicantDetailsModal.module.css';

const PAYMENT_METHODS_META = {
  vodafone_cash: {
    label: 'فودافون كاش / محافظ إلكترونية ذكية',
    desc: 'تحويل عبر محفظة الهاتف (Vodafone Cash, Orange, Etisalat, WE Pay)',
    badgeColor: 'primary',
  },
  instapay: {
    label: 'إنستاباي (InstaPay)',
    desc: 'تحويل لحظي عبر الحساب البنكي أو عنوان الدفع اللحظي IPA',
    badgeColor: 'accent',
  },
  bank_transfer: {
    label: 'تحويل بنكي مباشر',
    desc: 'إيداع أو تحويل على الحساب البنكي الرسمي للأكاديمية',
    badgeColor: 'neutral',
  },
  installments: {
    label: 'السداد على دفعتين (تقسيط)',
    desc: 'سداد نصف المبلغ الآن والنصف الآخر بعد شهر من بدء الدراسة',
    badgeColor: 'warning',
  },
  credit_card: {
    label: 'بطاقة دفع إلكتروني (فيزا / ماستركارد)',
    desc: 'سداد إلكتروني مباشر عبر البطاقة البنكية',
    badgeColor: 'primary',
  },
};

const EXPERIENCE_META = {
  beginner: {
    label: 'مبتدئ تماماً',
    sub: 'ليس لديه خلفية أو خبرة برمجية سابقة',
  },
  some_basics: {
    label: 'لديه أساسيات أولية',
    sub: 'جرّب كتابة أكواد بسيطة أو قرأ في البرمجة',
  },
  intermediate: {
    label: 'مستوى متوسط',
    sub: 'لديه معرفة برمجية ويريد الجاهزية لسوق العمل والاحتراف',
  },
};

const STATUS_LABELS = {
  pending: { label: 'جديد (بانتظار المتابعة)', variant: 'warning' },
  contacted: { label: 'تم التواصل', variant: 'neutral' },
  approved: { label: 'مقبول ومفعل', variant: 'success' },
  rejected: { label: 'ملغي / مرفوض', variant: 'danger' },
};

export default function ApplicantDetailsModal({
  isOpen,
  onClose,
  applicant,
  onApprovePayment,
  onUpdateApplicant,
}) {
  const { addToast } = useToast();

  const [status, setStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (applicant) {
      setStatus(applicant.status || 'pending');
      setAdminNotes(applicant.adminNotes || '');
    }
  }, [applicant]);

  if (!applicant) return null;

  // Extract payment method preference
  let methodKey = applicant.preferredPaymentMethod;
  if (!methodKey && applicant.background) {
    if (applicant.background.includes('vodafone_cash')) methodKey = 'vodafone_cash';
    else if (applicant.background.includes('instapay')) methodKey = 'instapay';
    else if (applicant.background.includes('bank_transfer')) methodKey = 'bank_transfer';
    else if (applicant.background.includes('installments')) methodKey = 'installments';
    else if (applicant.background.includes('credit_card')) methodKey = 'credit_card';
  }
  const paymentMeta = PAYMENT_METHODS_META[methodKey] || {
    label: applicant.preferredPaymentMethod || applicant.background || 'فودافون كاش ومحافظ ذكية',
    desc: 'طريقة الدفع المحددة من الطالب عند إرسال الاستمارة',
    badgeColor: 'primary',
  };

  const isPaid = applicant.paymentStatus === 'paid';
  const isApproved = applicant.status === 'approved';

  // Format phone for WhatsApp
  let cleanPhone = (applicant.phone || '').replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '2' + cleanPhone;
  }

  const courseTitle = applicant.courseId?.title || 'معسكر تطوير الواجهات الأمامية (Front-End)';
  const cohortName = applicant.courseId?.cohortName || 'دفعة 2026';
  const priceDisplay =
    applicant.courseId?.offerPrice || applicant.courseId?.price || 3500;

  const waMessage = `أهلاً بك يا ${applicant.fullName} في أكاديمية DevNest!\nنحن فريق القبول بخصوص طلب تسجيلك في "${courseTitle}" (${cohortName}).\nطريقة السداد المفضلة التي حددتها: [${paymentMeta.label}].\nهل تود استكمال تفعيل مقعدك الآن؟`;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast({ type: 'info', message: `تم نسخ ${fieldName} إلى الحافظة` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveNotesAndStatus = async () => {
    setIsSaving(true);
    try {
      await updateApplicantStatus(applicant._id, {
        status,
        adminNotes: adminNotes.trim(),
      });
      addToast({ type: 'success', message: 'تم تحديث حالة وملاحظات المتقدم بنجاح' });
      if (onUpdateApplicant) {
        onUpdateApplicant();
      }
    } catch (err) {
      addToast({ type: 'error', message: 'فشل حفظ بيانات المتقدم' });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = applicant.createdAt
    ? new Date(applicant.createdAt).toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'غير متوفر';

  const expInfo = EXPERIENCE_META[applicant.experienceLevel] || EXPERIENCE_META.beginner;
  const statusInfo = STATUS_LABELS[applicant.status] || STATUS_LABELS.pending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل طلب التقديم الكاملة"
      size="lg"
    >
      <div className={styles.modalContent}>
        {/* Profile Header Summary */}
        <div className={styles.headerSummary}>
          <div className={styles.applicantProfile}>
            <div className={styles.avatarCircle}>
              {applicant.fullName?.charAt(0) || 'ط'}
            </div>
            <div className={styles.profileMeta}>
              <h3 className={styles.applicantName}>{applicant.fullName}</h3>
              <span className={styles.courseBadge}>
                {courseTitle} — {cohortName}
              </span>
            </div>
          </div>

          <div className={styles.statusBadges}>
            <Badge variant={isPaid ? 'success' : 'warning'}>
              {isPaid ? (
                <>
                  <CheckCircle2 size={12} style={{ marginInlineEnd: 4 }} />
                  <span>تم الدفع</span>
                </>
              ) : (
                <>
                  <Clock size={12} style={{ marginInlineEnd: 4 }} />
                  <span>غير مدفوع</span>
                </>
              )}
            </Badge>

            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* ========================================================
            1. HIGHLIGHTED PAYMENT PREFERENCE & FINANCIALS
            ======================================================== */}
        <div className={styles.paymentHighlightCard}>
          <div className={styles.paymentCardHeader}>
            <div className={styles.paymentCardTitleBox}>
              <div className={styles.paymentIconBox}>
                <Wallet size={18} />
              </div>
              <div>
                <span className={styles.paymentCardTitle}>
                  طريقة الدفع وتأكيد الحجز المفضلة للطالب:
                </span>
                <span className={styles.paymentCardSubtitle} style={{ display: 'block' }}>
                  {paymentMeta.desc}
                </span>
              </div>
            </div>

            <Badge variant={isPaid ? 'success' : 'warning'} size="sm">
              {isPaid ? 'الرسوم مسددة بالكامل' : 'بانتظار استلام التحويل'}
            </Badge>
          </div>

          <div className={styles.paymentMethodBox}>
            <div className={styles.methodLabelGroup}>
              <span className={styles.methodLabel}>الوسيلة المختارة في الاستمارة:</span>
              <span className={styles.methodValue}>
                <CreditCard size={15} color="#0077d7" />
                <span>{paymentMeta.label}</span>
              </span>
            </div>

            <div className={styles.priceGroup}>
              <span className={styles.priceLabel}>قيمة الاشتراك المستحقة:</span>
              <span className={styles.priceValue}>
                {priceDisplay} {applicant.courseId?.currency || 'ج.م'}
              </span>
            </div>
          </div>

          {!isPaid && onApprovePayment && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onApprovePayment(applicant);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={14} />
                <span>تأكيد استلام المبلغ وتفعيل كود الطالب الآن</span>
              </Button>
            </div>
          )}
        </div>

        {/* ========================================================
            2. DETAILED GRIDS: PERSONAL & EDUCATIONAL INFO
            ======================================================== */}
        <div className={styles.detailsGrid}>
          {/* Personal & Contact Box */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <User size={15} color="#0047ab" />
              <span className={styles.sectionTitle}>بيانات التواصل والهوية</span>
            </div>

            <div className={styles.fieldsList}>
              {/* Full Name */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>الاسم بالكامل:</span>
                <span className={styles.fieldValue}>{applicant.fullName}</span>
              </div>

              {/* Phone & WhatsApp */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>الهاتف / واتساب:</span>
                <div className={styles.fieldActionRow}>
                  <strong dir="ltr" className={styles.fieldValue}>{applicant.phone}</strong>
                  <button
                    type="button"
                    className={`${styles.iconMiniBtn} ${copiedField === 'الهاتف' ? styles['iconMiniBtn--copied'] : ''}`}
                    onClick={() => handleCopy(applicant.phone, 'الهاتف')}
                    title="نسخ رقم الهاتف"
                  >
                    {copiedField === 'الهاتف' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappDirectBtn}
                      title="مراسلة سريعة عبر واتساب"
                    >
                      <MessageSquare size={12} />
                      <span>واتساب</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>البريد الإلكتروني:</span>
                <div className={styles.fieldActionRow}>
                  <span dir="ltr" className={styles.fieldValue}>{applicant.email}</span>
                  <button
                    type="button"
                    className={`${styles.iconMiniBtn} ${copiedField === 'البريد' ? styles['iconMiniBtn--copied'] : ''}`}
                    onClick={() => handleCopy(applicant.email, 'البريد')}
                    title="نسخ البريد الإلكتروني"
                  >
                    {copiedField === 'البريد' ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Age */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>السن / العمر:</span>
                <span className={styles.fieldValue}>
                  {applicant.age ? `${applicant.age} عاماً` : 'لم يُحدد'}
                </span>
              </div>

              {/* Application Date */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>تاريخ التقديم:</span>
                <span className={styles.fieldValue} style={{ fontSize: '11px' }}>
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Educational Background & Level */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <BookOpen size={15} color="#0077d7" />
              <span className={styles.sectionTitle}>المسار والمستوى الأكاديمي</span>
            </div>

            <div className={styles.fieldsList}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>المسار التدريبي:</span>
                <span className={styles.fieldValue}>{courseTitle}</span>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>الدفعة:</span>
                <span className={styles.fieldValue}>{cohortName}</span>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>المستوى في البرمجة:</span>
                <div style={{ textAlign: 'left' }}>
                  <Badge variant="neutral" size="sm">
                    {expInfo.label}
                  </Badge>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {expInfo.sub}
                  </span>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>مصدر التسجيل:</span>
                <span className={styles.fieldValue}>
                  {applicant.referralSource === 'social_media_registration_page'
                    ? 'صفحة التسجيل المباشرة عبر السوشيال ميديا'
                    : applicant.referralSource || 'الموقع الرسمي'}
                </span>
              </div>

              {applicant.ipAddress && (
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>عنوان الـ IP:</span>
                  <span className={styles.fieldValue} dir="ltr" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {applicant.ipAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Goals & Motivation Box */}
          <div className={styles.goalsCard}>
            <div className={styles.sectionHeader}>
              <Target size={15} color="#00c2ff" />
              <span className={styles.sectionTitle}>الهدف الأساسي من الانضمام للمعسكر:</span>
            </div>
            {applicant.goals ? (
              <p className={styles.goalsText}>{applicant.goals}</p>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                لم يكتب الطالب أهدافاً محددة في استمارة التسجيل.
              </span>
            )}
          </div>

          {/* Admin Management & Notes Box */}
          <div className={styles.adminManageBox}>
            <div className={styles.sectionHeader}>
              <Save size={15} color="#0047ab" />
              <span className={styles.sectionTitle}>إدارة الطلب وملاحظات المتابعة</span>
            </div>

            <div className={styles.adminManageGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>حالة الطلب:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={styles.selectInput}
                  disabled={isApproved}
                >
                  <option value="pending">جديد (بانتظار المتابعة)</option>
                  <option value="contacted">تم التواصل معه</option>
                  <option value="approved">مقبول ومفعل</option>
                  <option value="rejected">ملغي / مرفوض</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>ملاحظات الإدارة الخاصة بالطالب:</label>
                <input
                  type="text"
                  placeholder="مثال: تم التواصل وتأكيد التحويل غداً عبر إنستاباي..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className={styles.notesInput}
                />
              </div>

              <button
                type="button"
                className={styles.saveNotesBtn}
                onClick={handleSaveNotesAndStatus}
                disabled={isSaving}
              >
                <Save size={14} />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التحديث'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <Button variant="ghost" size="md" onClick={onClose}>
              إغلاق
            </Button>
          </div>

          <div className={styles.footerRight}>
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappDirectBtn}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <MessageSquare size={15} />
                <span>مراسلة عبر واتساب</span>
              </a>
            )}

            {!isPaid && onApprovePayment && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onApprovePayment(applicant);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                <span>تأكيد الدفع وتفعيل الكود</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
