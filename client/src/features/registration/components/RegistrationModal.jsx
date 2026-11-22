import { useState, useEffect } from 'react';
import { CheckCircle2, ClipboardList, ArrowLeft } from 'lucide-react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { submitRegistration } from '../api/registration.api';
import { useToast } from '@/components/ui/Toast';
import styles from './RegistrationModal.module.css';

/**
 * Dynamic Course Registration Modal.
 * Accepts course object & full courses list, allowing student to select their desired track.
 */
export default function RegistrationModal({ isOpen, onClose, course, courses = [] }) {
  const { addToast } = useToast();

  const [selectedCourseId, setSelectedCourseId] = useState(course?._id || '');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    background: '',
    experienceLevel: 'beginner',
    goals: '',
    referralSource: 'social_media',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (course?._id) {
      setSelectedCourseId(course._id);
    } else if (courses.length > 0 && !selectedCourseId) {
      const openCourse = courses.find((c) => c.isRegistrationOpen);
      setSelectedCourseId(openCourse ? openCourse._id : courses[0]._id);
    }
  }, [course, courses]);

  const activeCourse =
    courses.find((c) => c._id === selectedCourseId) || course || courses[0];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errs.fullName = 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    const phoneClean = formData.phone.trim().replace(/\s+/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      errs.phone = 'يرجى إدخال رقم هاتف/واتساب صحيح (9 أرقام على الأقل)';
    }

    if (formData.age && (Number(formData.age) < 14 || Number(formData.age) > 70)) {
      errs.age = 'العمر يجب أن يكون بين 14 و 70 عاماً';
    }

    if (!selectedCourseId) {
      errs.courseId = 'يرجى اختيار المسار التدريبي';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !selectedCourseId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        courseId: selectedCourseId,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        background: formData.background.trim(),
        experienceLevel: formData.experienceLevel,
        goals: formData.goals.trim(),
        referralSource: formData.referralSource,
      };

      const res = await submitRegistration(payload);
      setIsSuccess(true);
      setSuccessInfo(res.data);
      addToast({
        type: 'success',
        message: 'تم استلام طلب تسجيلك بنجاح!',
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setSuccessInfo(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      age: '',
      background: '',
      experienceLevel: 'beginner',
      goals: '',
      referralSource: 'social_media',
    });
    setErrors({});
    onClose();
  };

  if (!activeCourse) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={isSuccess ? 'تم تأكيد استلام طلبك!' : `التسجيل في معسكرات DevNest Academy`}
      size="md"
    >
      {isSuccess ? (
        <div className={styles.successWrapper}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={40} />
          </div>
          <h3 className={styles.successTitle}>أهلاً بك يا {successInfo?.fullName || formData.fullName}!</h3>
          <p className={styles.successDesc}>
            تم تسجيل طلبك بنجاح في <strong>{activeCourse.title}</strong>.
          </p>

          <div className={styles.nextStepsCard}>
            <h4 className={styles.nextStepsTitle}>
              <ClipboardList size={16} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
              الخطوات التالية:
            </h4>
            <ol className={styles.stepsList}>
              <li>سيقوم فريق القبول بالتواصل معك عبر <strong>واتساب</strong> خلال 24 ساعة لتأكيد الحجز.</li>
              <li>سيتم إرسال تفاصيل وطرق الدفع المتاحة (فودافون كاش / إنستاباي / تحويل بنكي).</li>
              <li>بمجرد تأكيد الدفع، سيتم تفعيل حسابك وإنشاء كود الطالب الفريد الخاص بك للدخول إلى المنصة.</li>
            </ol>
          </div>

          <div className={styles.successActions}>
            <Button variant="primary" size="md" fullWidth onClick={handleResetAndClose}>
              تم، شكراً لك!
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Track Selection Dropdown */}
          {courses.length > 0 && (
            <div className={styles.field}>
              <label htmlFor="trackSelect" className={styles.label}>
                المسار التدريبي المطلوب (Track / Bootcamp) *
              </label>
              <select
                id="trackSelect"
                className={styles.selectInput}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.isRegistrationOpen
                      ? `${c.title} [متاح للتسجيل]`
                      : `${c.title} [يبدأ قريباً — حجز مسبق]`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cohort & Price badge header */}
          <div className={styles.courseMetaBanner}>
            <div>
              <span className={styles.metaLabel}>المسار المختار:</span>
              <strong className={styles.metaTitle}>{activeCourse.title}</strong>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className={styles.metaCohort}>{activeCourse.cohortName || 'دفعة 2026'}</span>
                {activeCourse.isRegistrationOpen ? (
                  <Badge variant="success" size="sm">مفتوح للدفعة الحالية</Badge>
                ) : (
                  <Badge variant="warning" size="sm">يبدأ قريباً • حجز مسبق</Badge>
                )}
              </div>
            </div>
            <div className={styles.priceTag}>
              <span className={styles.priceAmount}>{activeCourse.price}</span>
              <span className={styles.priceCurrency}>{activeCourse.currency || 'EGP'}</span>
            </div>
          </div>

          {/* Full Name */}
          <div className={styles.field}>
            <label htmlFor="regFullName" className={styles.label}>
              الاسم الكامل (ثلاثي أو رباعي) *
            </label>
            <Input
              id="regFullName"
              type="text"
              placeholder="مثال: أحمد محمد علي"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={errors.fullName}
              required
            />
          </div>

          {/* Contact Row: Email + Phone */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="regEmail" className={styles.label}>
                البريد الإلكتروني *
              </label>
              <Input
                id="regEmail"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                dir="ltr"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="regPhone" className={styles.label}>
                رقم الهاتف / واتساب *
              </label>
              <Input
                id="regPhone"
                type="tel"
                placeholder="01012345678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Age & Background */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="regAge" className={styles.label}>
                العمر (سنوات)
              </label>
              <Input
                id="regAge"
                type="number"
                placeholder="مثال: 22"
                min="14"
                max="70"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                error={errors.age}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="regBackground" className={styles.label}>
                الخلفية الدراسية أو الوظيفة الحالية
              </label>
              <Input
                id="regBackground"
                type="text"
                placeholder="مثال: حاسبات ومعلومات / طالب / خريج تجارة"
                value={formData.background}
                onChange={(e) => handleChange('background', e.target.value)}
              />
            </div>
          </div>

          {/* Experience Level */}
          <div className={styles.field}>
            <label className={styles.label}>مستواك الحالي في البرمجة</label>
            <div className={styles.radioGroup}>
              {[
                { value: 'beginner', label: 'مبتدئ تماماً (من الصفر)' },
                { value: 'some_basics', label: 'لدي بعض المبادئ الأساسية' },
                { value: 'intermediate', label: 'مستوى متوسط (بنيت مشاريع بسيطة)' },
              ].map((opt) => (
                <label key={opt.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={opt.value}
                    checked={formData.experienceLevel === opt.value}
                    onChange={(e) => handleChange('experienceLevel', e.target.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className={styles.field}>
            <label htmlFor="regGoals" className={styles.label}>
              هدفك من الانضمام للمعسكر (اختياري)
            </label>
            <textarea
              id="regGoals"
              className={styles.textarea}
              rows={2}
              placeholder="مثال: الحصول على وظيفة كـ Junior Engineer خلال 6 أشهر / العمل الحر Freelancing..."
              value={formData.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
            />
          </div>

          {/* Referral Source */}
          <div className={styles.field}>
            <label htmlFor="regReferral" className={styles.label}>
              كيف سمعت عن DevNest Academy؟
            </label>
            <select
              id="regReferral"
              className={styles.selectInput}
              value={formData.referralSource}
              onChange={(e) => handleChange('referralSource', e.target.value)}
            >
              <option value="social_media">وسائل التواصل الاجتماعي (فيسبوك / لينكد إن)</option>
              <option value="friend">ترشيح من صديق أو زميل</option>
              <option value="search_engine">بحث جوجل (Google Search)</option>
              <option value="youtube">يوتيوب (YouTube)</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          {/* Submit Actions */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
            >
              تأكيد وإرسال طلب التسجيل
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
