import { useState, useEffect } from 'react';
import {
  Layout,
  Server,
  Globe,
  Bot,
  BarChart3,
  CheckSquare,
  Code2,
  Megaphone,
  Save,
  Pencil,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  Trash2,
  Target,
  Sparkles,
  Tag,
  Share2,
  Copy,
  Plus,
  Percent,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  getAdminCourses,
  updateAdminCourse,
  toggleCourseRegistration,
  getAdminAnnouncement,
  updateAdminAnnouncement,
} from '../api/admin.api';
import styles from './AdminCoursesPage.module.css';

function getTrackIcon(slug) {
  switch (slug) {
    case 'frontend-development':
      return <Layout size={24} />;
    case 'backend-development':
      return <Server size={24} />;
    case 'fullstack-development':
      return <Globe size={24} />;
    case 'ai-machine-learning':
      return <Bot size={24} />;
    case 'data-analysis':
      return <BarChart3 size={24} />;
    case 'software-testing-qa':
      return <CheckSquare size={24} />;
    default:
      return <Code2 size={24} />;
  }
}

export default function AdminCoursesPage() {
  const { addToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Edit Course Modal state
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, announcementData] = await Promise.all([
        getAdminCourses(),
        getAdminAnnouncement(),
      ]);
      setCourses(coursesData || []);
      setAnnouncement(announcementData || null);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل بيانات المسارات والإعلانات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick toggle course registration
  const handleToggleRegistration = async (courseId) => {
    try {
      const res = await toggleCourseRegistration(courseId);
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, isRegistrationOpen: res.course.isRegistrationOpen } : c))
      );
      addToast({
        type: 'success',
        message: res.course.isRegistrationOpen
          ? `تم فتح باب التسجيل لمسار: ${res.course.title}`
          : `تم إغلاق باب التسجيل لمسار: ${res.course.title}`,
      });
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تعديل حالة التسجيل' });
    }
  };

  // Quick set course as active hero announcement
  const handleSetCourseAsAnnouncement = async (courseSlug) => {
    if (!announcement) return;
    try {
      setSavingAnnouncement(true);
      const updated = await updateAdminAnnouncement({
        isEnabled: true,
        mode: 'course',
        selectedCourseSlug: courseSlug,
      });
      setAnnouncement(updated);
      addToast({ type: 'success', message: 'تم تعيين المسار كإعلان رئيسي في واجهة الموقع بنجاح' });
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تعيين الإعلان' });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Save Announcement Settings
  const handleSaveAnnouncement = async () => {
    try {
      setSavingAnnouncement(true);
      const updated = await updateAdminAnnouncement({
        isEnabled: announcement.isEnabled,
        mode: announcement.mode,
        selectedCourseSlug: announcement.selectedCourseSlug,
        templates: announcement.templates,
        custom: announcement.custom,
      });
      setAnnouncement(updated);
      addToast({ type: 'success', message: 'تم حفظ إعدادات إعلان واجهة الموقع بنجاح' });
    } catch (err) {
      addToast({ type: 'error', message: 'فشل حفظ الإعلان' });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Update current template field
  const handleTemplateChange = (slug, field, value) => {
    setAnnouncement((prev) => {
      const currentTpl = prev.templates?.[slug] || {};
      return {
        ...prev,
        templates: {
          ...prev.templates,
          [slug]: {
            ...currentTpl,
            [field]: value,
          },
        },
      };
    });
  };

  // Update custom announcement field
  const handleCustomChange = (field, value) => {
    setAnnouncement((prev) => ({
      ...prev,
      custom: {
        ...prev.custom,
        [field]: value,
      },
    }));
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      duration: course.duration || '',
      level: course.level || '',
      cohortName: course.cohortName || '',
      price: course.price || 0,
      currency: course.currency || 'EGP',
      isRegistrationOpen: course.isRegistrationOpen ?? false,
      // Limited Time Offer & Pricing fields
      hasOffer: Boolean(course.hasOffer),
      offerPrice: course.offerPrice || 0,
      offerBadge: course.offerBadge || 'عرض الحجز المبكر لفترة محدودة',
      offerNote: course.offerNote || 'متاح للدفعة الحالية أو حتى اكتمال المقاعد',
      offerEndsAt: course.offerEndsAt ? new Date(course.offerEndsAt).toISOString().split('T')[0] : '',
      guaranteeText:
        course.guaranteeText ||
        'ضمان استرداد كامل المصروفات خلال أول 7 أيام إذا لم تجد التجربة مناسبة لتطلعاتك دون أي تعقيد.',
      whatsappSupportNumber: course.whatsappSupportNumber || '201014176434',
      features:
        Array.isArray(course.features) && course.features.length > 0
          ? [...course.features]
          : [
              'تدريب تطبيقي مكثف يركز على متطلبات التوظيف الفعلية',
              'مراجعة كود فردية 1:1 لكل مشروع مع مهندس برمجيات',
              'بناء 5 مشاريع واقعية متكاملة ترفع كودها على GitHub',
              'جلسات إرشاد أسبوعية مباشرة وإجابة على كافة الاستفسارات',
              'شهادة إتمام معتمدة بكود تحقق رقمي رسمي',
            ],
      roadmap: course.roadmap ? JSON.parse(JSON.stringify(course.roadmap)) : [],
    });
  };

  // Copy registration link for social media
  const handleCopyRegisterLink = (courseSlug) => {
    const url = `${window.location.origin}/register/${courseSlug}`;
    navigator.clipboard.writeText(url);
    addToast({
      type: 'success',
      message: `تم نسخ رابط صفحة التسجيل لمشاركته على السوشيال ميديا: ${url}`,
    });
  };

  // Features list manager in modal
  const handleAddFeature = () => {
    setCourseFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), 'ميزة جديدة للمعسكر'],
    }));
  };

  const handleUpdateFeature = (index, value) => {
    setCourseFormData((prev) => {
      const updated = [...(prev.features || [])];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeature = (index) => {
    setCourseFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  // Save Edited Course
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse?._id) return;

    try {
      setSavingCourse(true);
      const updated = await updateAdminCourse(editingCourse._id, courseFormData);
      setCourses((prev) => prev.map((c) => (c._id === editingCourse._id ? updated : c)));
      setEditingCourse(null);
      addToast({ type: 'success', message: 'تم تحديث بيانات ومنهج المسار بنجاح' });
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحديث بيانات المسار' });
    } finally {
      setSavingCourse(false);
    }
  };

  // Module management in modal
  const handleAddModule = () => {
    const nextNum = (courseFormData.roadmap?.length || 0) + 1;
    setCourseFormData((prev) => ({
      ...prev,
      roadmap: [
        ...prev.roadmap,
        {
          moduleNumber: nextNum,
          title: `المرحلة 0${nextNum}: عنوان المرحلة الجديدة`,
          duration: 'أسبوعان',
          topics: ['المحور الأول', 'المحور الثاني'],
          project: 'مشروع تسليم عملي للمرحلة',
        },
      ],
    }));
  };

  const handleUpdateModule = (idx, field, value) => {
    setCourseFormData((prev) => {
      const updated = [...prev.roadmap];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, roadmap: updated };
    });
  };

  const handleRemoveModule = (idx) => {
    setCourseFormData((prev) => ({
      ...prev,
      roadmap: prev.roadmap.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>جاري تحميل المسارات وإعدادات الإعلانات...</p>
      </div>
    );
  }

  // Active announcement preview values
  const activeSlug = announcement?.selectedCourseSlug || 'frontend-development';
  const activeTpl =
    announcement?.mode === 'custom'
      ? announcement?.custom
      : announcement?.templates?.[activeSlug] || {};

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>إدارة المسارات وإعلانات الموقع</h1>
          <p className={styles.subtitle}>
            التحكم في إعلان واجهة الموقع البارز، فتح وإغلاق التسجيل، وتعديل المناهج والمحتويات لكل مسار.
          </p>
        </div>
      </div>

      {/* ========================================================
          SECTION 1: HERO ANNOUNCEMENT CONTROLLER
          ======================================================== */}
      {announcement && (
        <Card variant="elevated" padding="lg" className={styles.announcementSection}>
          <div className={styles.sectionTop}>
            <div className={styles.sectionTitleCol}>
              <span className={styles.tagBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Megaphone size={14} />
                <span>واجهة الموقع</span>
              </span>
              <h2 className={styles.sectionTitle}>التحكم في إعلان أول سكشن (Hero Announcement)</h2>
              <p className={styles.sectionDesc}>
                يمكنك إظهار أو إخفاء الإعلان، واختيار المسار التدريبي المستهدف، أو كتابة إعلان مخصص تماماً.
              </p>
            </div>

            {/* Enable / Disable Master Toggle */}
            <div className={styles.toggleBox}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={announcement.isEnabled}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({ ...prev, isEnabled: e.target.checked }))
                  }
                  className={styles.toggleInput}
                />
                <span className={styles.switchSlider} />
                <span className={styles.switchText}>
                  {announcement.isEnabled ? 'الإعلان مفعّل في واجهة الموقع' : 'الإعلان معطّل ومخفي'}
                </span>
              </label>
            </div>
          </div>

          {/* Announcement Live Preview (Exactly matching screenshot) */}
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitleLabel}>معاينة حية للإعلان (كما يظهر للزائر بأعلى الموقع):</span>
              {!announcement.isEnabled && (
                <Badge variant="danger" size="sm">
                  مخفي حالياً
                </Badge>
              )}
            </div>

            <div
              className={`${styles.officialAnnouncement} ${
                !announcement.isEnabled ? styles['officialAnnouncement--disabled'] : ''
              }`}
            >
              <div className={styles.announcementBadge}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <Megaphone size={14} className={styles.announcementIcon} />
                <span>{activeTpl?.badge || 'إعلان هام ورسمي'}</span>
              </div>

              <div className={styles.announcementContent}>
                <p className={styles.announcementTitle}>
                  {activeTpl?.title || 'عنوان الإعلان الرئيسي'}
                </p>
                <p className={styles.announcementDetails}>
                  {activeTpl?.details || 'تفاصيل وشرح الإعلان والمحتوى التدريبي'}
                </p>
              </div>

              <div className={styles.announcementBtnPreview}>
                <Button variant="primary" size="sm">
                  {activeTpl?.buttonText || 'سجّل مقعدك الآن'}
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Form */}
          <div className={styles.controlsGrid}>
            {/* Mode selection */}
            <div className={styles.fieldCol}>
              <label className={styles.fieldLabel}>نوع الإعلان المعروض:</label>
              <div className={styles.modeTabs}>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${
                    announcement.mode === 'course' ? styles['modeBtn--active'] : ''
                  }`}
                  onClick={() => setAnnouncement((prev) => ({ ...prev, mode: 'course' }))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Target size={14} />
                  <span>ربط بمسار تدريبي محدد</span>
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${
                    announcement.mode === 'custom' ? styles['modeBtn--active'] : ''
                  }`}
                  onClick={() => setAnnouncement((prev) => ({ ...prev, mode: 'custom' }))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} />
                  <span>إعلان عام / مخصص</span>
                </button>
              </div>
            </div>

            {/* Course Selector (If Course Mode) */}
            {announcement.mode === 'course' && (
              <div className={styles.fieldCol}>
                <label className={styles.fieldLabel}>اختر المسار المراد إعلانه في واجهة الموقع:</label>
                <select
                  className={styles.selectBox}
                  value={announcement.selectedCourseSlug}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({ ...prev, selectedCourseSlug: e.target.value }))
                  }
                >
                  {courses.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title} {c.isRegistrationOpen ? '(مفتوح للتسجيل)' : '(يبدأ قريباً)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Content Inputs for Selected Template */}
          <div className={styles.editFieldsGrid}>
            <div className={styles.field}>
              <label className={styles.inputLabel}>نص الشارة (Badge):</label>
              <Input
                value={activeTpl?.badge || ''}
                onChange={(e) => {
                  if (announcement.mode === 'custom') {
                    handleCustomChange('badge', e.target.value);
                  } else {
                    handleTemplateChange(activeSlug, 'badge', e.target.value);
                  }
                }}
                placeholder="مثال: إعلان هام ورسمي"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.inputLabel}>عنوان الإعلان:</label>
              <Input
                value={activeTpl?.title || ''}
                onChange={(e) => {
                  if (announcement.mode === 'custom') {
                    handleCustomChange('title', e.target.value);
                  } else {
                    handleTemplateChange(activeSlug, 'title', e.target.value);
                  }
                }}
                placeholder="عنوان الإعلان في واجهة الموقع"
              />
            </div>

            <div className={`${styles.field} ${styles['field--full']}`}>
              <label className={styles.inputLabel}>تفاصيل وملاحظات الإعلان:</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={activeTpl?.details || ''}
                onChange={(e) => {
                  if (announcement.mode === 'custom') {
                    handleCustomChange('details', e.target.value);
                  } else {
                    handleTemplateChange(activeSlug, 'details', e.target.value);
                  }
                }}
                placeholder="نص تفاصيل الإعلان..."
              />
            </div>

            <div className={styles.field}>
              <label className={styles.inputLabel}>نص زر الإجراء (Button Text):</label>
              <Input
                value={activeTpl?.buttonText || ''}
                onChange={(e) => {
                  if (announcement.mode === 'custom') {
                    handleCustomChange('buttonText', e.target.value);
                  } else {
                    handleTemplateChange(activeSlug, 'buttonText', e.target.value);
                  }
                }}
                placeholder="مثال: سجّل مقعدك الآن"
              />
            </div>

            {announcement.mode === 'custom' && (
              <div className={styles.field}>
                <label className={styles.inputLabel}>رابط الزر (URL / Anchor):</label>
                <Input
                  value={announcement.custom?.buttonLink || '#tracks'}
                  onChange={(e) => handleCustomChange('buttonLink', e.target.value)}
                  placeholder="مثال: #tracks أو https://..."
                />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className={styles.announcementActionsRow}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAnnouncement}
              loading={savingAnnouncement}
              className={styles.saveAnnouncementBtn}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              <span>حفظ وتطبيق إعلان الواجهة</span>
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================
          SECTION 2: TRACKS MANAGEMENT & REGISTRATION CONTROL
          ======================================================== */}
      <div className={styles.tracksSectionHeader}>
        <div>
          <h2 className={styles.tracksSectionTitle}>المسارات التدريبية والتحكم في التسجيل والمحتوى</h2>
          <p className={styles.tracksSectionSubtitle}>
            يمكنك بنقرة واحدة فتح أو إغلاق باب التسجيل لكل مسار، أو تعيينه كإعلان رئيسي، أو تعديل منهجه الدراسي ومحاوره.
          </p>
        </div>
      </div>

      <div className={styles.coursesGrid}>
        {courses.map((course) => {
          const icon = getTrackIcon(course.slug);
          const isOpen = course.isRegistrationOpen;
          const isCurrentAnnouncement =
            announcement?.selectedCourseSlug === course.slug &&
            announcement?.mode === 'course' &&
            announcement?.isEnabled;

          return (
            <Card key={course._id} variant="elevated" padding="lg" className={styles.courseCard}>
              <div className={styles.courseCardTop}>
                <div className={styles.courseIconBox}>{icon}</div>
                <div className={styles.courseStatusCol}>
                  {isOpen ? (
                    <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>التسجيل مفتوح حالياً</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      يبدأ قريباً • مغلق حالياً
                    </Badge>
                  )}
                  {isCurrentAnnouncement && (
                    <Badge variant="info" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Megaphone size={13} />
                      <span>الإعلان المعروض حالياً</span>
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className={styles.courseCardTitle}>{course.title}</h3>
              <p className={styles.courseCardDesc}>{course.shortDescription}</p>

              <div className={styles.courseCardMeta}>
                <div className={styles.metaCol}>
                  <span className={styles.metaLabel}>المدة:</span>
                  <strong className={styles.metaVal}>{course.duration}</strong>
                </div>
                <div className={styles.metaCol}>
                  <span className={styles.metaLabel}>السعر:</span>
                  {course.hasOffer && course.offerPrice ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        style={{
                          textDecoration: 'line-through',
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {course.price} {course.currency}
                      </span>
                      <strong className={styles.metaVal} style={{ color: '#00c2ff' }}>
                        {course.offerPrice} {course.currency}
                      </strong>
                      <span className={styles.offerPriceBadge}>
                        <Sparkles size={10} />
                        <span>{course.offerBadge || 'عرض لفترة محدودة'}</span>
                      </span>
                    </div>
                  ) : (
                    <strong className={styles.metaVal}>
                      {course.price} {course.currency}
                    </strong>
                  )}
                </div>
                <div className={styles.metaCol}>
                  <span className={styles.metaLabel}>المراحل الدراسية:</span>
                  <strong className={styles.metaVal}>{course.roadmap?.length || 0} مراحل</strong>
                </div>
              </div>

              {/* Actions Button Grid */}
              <div className={styles.courseActions}>
                {/* Copy Registration Page Link for Social Media */}
                <button
                  type="button"
                  onClick={() => handleCopyRegisterLink(course.slug)}
                  className={styles.shareBtn}
                  title="نسخ رابط صفحة التسجيل لهذا المسار لمشاركته على السوشيال ميديا"
                >
                  <Share2 size={13} />
                  <span>نسخ رابط صفحة التسجيل للمشاركة</span>
                </button>

                {/* Toggle Registration */}
                <Button
                  variant={isOpen ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => handleToggleRegistration(course._id)}
                  className={styles.toggleRegBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isOpen ? (
                    <>
                      <Lock size={14} />
                      <span>إغلاق باب التسجيل</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={14} />
                      <span>فتح باب التسجيل</span>
                    </>
                  )}
                </Button>

                {/* Set as Active Hero Announcement */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetCourseAsAnnouncement(course.slug)}
                  disabled={isCurrentAnnouncement}
                  className={styles.setAnnouncementBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isCurrentAnnouncement ? (
                    <>
                      <Check size={14} />
                      <span>هو الإعلان الحالي</span>
                    </>
                  ) : (
                    <>
                      <Megaphone size={14} />
                      <span>تعيين كإعلان الواجهة</span>
                    </>
                  )}
                </Button>

                {/* Edit Content & Curriculum */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEditCourse(course)}
                  className={styles.editBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} />
                  <span>تعديل المسار والمنهج</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ========================================================
          EDIT COURSE & CURRICULUM MODAL
          ======================================================== */}
      {editingCourse && courseFormData && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCourse(null)}
          title={`تعديل مسار: ${editingCourse.title}`}
          maxWidth="900px"
        >
          <form onSubmit={handleSaveCourse} className={styles.modalForm}>
            <div className={styles.modalGrid}>
              <div className={styles.field}>
                <label className={styles.inputLabel}>عنوان المسار التدريبي:</label>
                <Input
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.inputLabel}>المدة التدريبية (Duration):</label>
                <Input
                  value={courseFormData.duration}
                  onChange={(e) => setCourseFormData({ ...courseFormData, duration: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.inputLabel}>اسم الدفعة (Cohort Name):</label>
                <Input
                  value={courseFormData.cohortName}
                  onChange={(e) => setCourseFormData({ ...courseFormData, cohortName: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.inputLabel}>المستوى (Level):</label>
                <Input
                  value={courseFormData.level}
                  onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.inputLabel}>حالة باب التسجيل:</label>
                <select
                  className={styles.selectBox}
                  value={courseFormData.isRegistrationOpen ? 'open' : 'closed'}
                  onChange={(e) =>
                    setCourseFormData({ ...courseFormData, isRegistrationOpen: e.target.value === 'open' })
                  }
                >
                  <option value="open">التسجيل مفتوح للزوار</option>
                  <option value="closed">التسجيل مغلق (يبدأ قريباً)</option>
                </select>
              </div>

              {/* ========================================================
                  PRICING & LIMITED-TIME OFFER CONTROLS
                  ======================================================== */}
              <div
                className={`${styles.pricingEditorCard} ${
                  courseFormData.hasOffer ? styles.offerActiveGlow : ''
                }`}
              >
                <div className={styles.pricingEditorHeader}>
                  <h4 className={styles.pricingEditorTitle}>
                    <Tag size={16} color="var(--color-brand)" />
                    <span>إعدادات التسعير والعروض الترويجية لصفحة التسجيل</span>
                  </h4>

                  {/* Offer Toggle Switch */}
                  <div className={styles.offerSwitchBox}>
                    <label className={styles.switchLabel}>
                      <input
                        type="checkbox"
                        checked={courseFormData.hasOffer}
                        onChange={(e) =>
                          setCourseFormData({ ...courseFormData, hasOffer: e.target.checked })
                        }
                        className={styles.toggleInput}
                      />
                      <span className={styles.switchSlider} />
                      <span
                        className={styles.switchText}
                        style={{ fontSize: '12px', fontWeight: 700 }}
                      >
                        {courseFormData.hasOffer
                          ? 'عرض السعر المخفض مفعّل'
                          : 'تفعيل عرض تخفيض لفترة محدودة'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.offerFieldsGrid}>
                  <div className={styles.field}>
                    <label className={styles.inputLabel}>السعر الأساسي / الأصلي (EGP):</label>
                    <Input
                      type="number"
                      value={courseFormData.price}
                      onChange={(e) =>
                        setCourseFormData({ ...courseFormData, price: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  {courseFormData.hasOffer && (
                    <div className={styles.field}>
                      <label className={styles.inputLabel}>
                        سعر العرض المخفض (Offer Price EGP):
                      </label>
                      <Input
                        type="number"
                        value={courseFormData.offerPrice}
                        onChange={(e) =>
                          setCourseFormData({
                            ...courseFormData,
                            offerPrice: Number(e.target.value),
                          })
                        }
                        required
                      />
                      {courseFormData.price > courseFormData.offerPrice && (
                        <span className={styles.savingsCalcPreview}>
                          <Sparkles size={12} />
                          <span>
                            وفر {courseFormData.price - courseFormData.offerPrice} ج.م (خصم{' '}
                            {Math.round(
                              ((courseFormData.price - courseFormData.offerPrice) /
                                courseFormData.price) *
                                100
                            )}
                            %)
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {courseFormData.hasOffer && (
                    <>
                      <div className={styles.field}>
                        <label className={styles.inputLabel}>نص شارة العرض (Offer Badge):</label>
                        <Input
                          value={courseFormData.offerBadge}
                          onChange={(e) =>
                            setCourseFormData({ ...courseFormData, offerBadge: e.target.value })
                          }
                          placeholder="مثال: خصم الحجز المبكر — وفر 1000 ج.م"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.inputLabel}>
                          ملاحظة أو شرط العرض (Offer Note):
                        </label>
                        <Input
                          value={courseFormData.offerNote}
                          onChange={(e) =>
                            setCourseFormData({ ...courseFormData, offerNote: e.target.value })
                          }
                          placeholder="مثال: متاح للدفعة الحالية أو حتى اكتمال 30 مقعداً"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Perks & Selling Points Manager */}
              <div className={styles.featuresEditorBox}>
                <div className={styles.featuresHeader}>
                  <h4 className={styles.featuresTitle}>
                    مميزات المعسكر المعروضة في صفحة التسجيل (
                    {courseFormData.features?.length || 0})
                  </h4>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddFeature}>
                    <Plus size={13} />
                    <span>إضافة ميزة</span>
                  </Button>
                </div>

                <div className={styles.featuresList}>
                  {courseFormData.features?.map((feat, idx) => (
                    <div key={idx} className={styles.featureRow}>
                      <Input
                        value={feat}
                        onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                        placeholder="نص ميزة المعسكر..."
                      />
                      <button
                        type="button"
                        className={styles.deleteFeatureBtn}
                        onClick={() => handleRemoveFeature(idx)}
                        title="حذف هذه الميزة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantee & WhatsApp Controls */}
              <div className={styles.field}>
                <label className={styles.inputLabel}>
                  نص الضمان وسياسة الاسترداد (Guarantee Text):
                </label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={courseFormData.guaranteeText}
                  onChange={(e) =>
                    setCourseFormData({ ...courseFormData, guaranteeText: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label className={styles.inputLabel}>
                  رقم واتساب المعتمد للاستفسارات وتأكيد الحجز:
                </label>
                <Input
                  dir="ltr"
                  value={courseFormData.whatsappSupportNumber}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      whatsappSupportNumber: e.target.value,
                    })
                  }
                  placeholder="201014176434"
                />
              </div>

              <div className={`${styles.field} ${styles['field--full']}`}>
                <label className={styles.inputLabel}>الوصف المختصر (Short Description):</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={courseFormData.shortDescription}
                  onChange={(e) =>
                    setCourseFormData({ ...courseFormData, shortDescription: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Curriculum Modules Editor */}
            <div className={styles.curriculumSection}>
              <div className={styles.curriculumHeader}>
                <h3 className={styles.curriculumTitle}>
                  المراحل والمناهج الدراسية ({courseFormData.roadmap.length} مراحل)
                </h3>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddModule}>
                  + إضافة مرحلة جديدة
                </Button>
              </div>

              <div className={styles.modulesList}>
                {courseFormData.roadmap.map((mod, idx) => (
                  <div key={idx} className={styles.moduleEditCard}>
                    <div className={styles.moduleTop}>
                      <strong className={styles.moduleNumberTag}>المرحلة 0{idx + 1}</strong>
                      <button
                        type="button"
                        className={styles.deleteModuleBtn}
                        onClick={() => handleRemoveModule(idx)}
                        title="حذف هذه المرحلة"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={13} />
                        <span>حذف المرحلة</span>
                      </button>
                    </div>

                    <div className={styles.moduleFields}>
                      <div className={styles.field}>
                        <label className={styles.inputLabel}>عنوان المرحلة:</label>
                        <Input
                          value={mod.title}
                          onChange={(e) => handleUpdateModule(idx, 'title', e.target.value)}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.inputLabel}>مدة المرحلة:</label>
                        <Input
                          value={mod.duration}
                          onChange={(e) => handleUpdateModule(idx, 'duration', e.target.value)}
                        />
                      </div>

                      <div className={`${styles.field} ${styles['field--full']}`}>
                        <label className={styles.inputLabel}>
                          المحاور والمهارات (افصل بين كل مهارة بفاصلة أو سطر جديد):
                        </label>
                        <textarea
                          className={styles.textarea}
                          rows={2}
                          value={Array.isArray(mod.topics) ? mod.topics.join(' | ') : mod.topics}
                          onChange={(e) => {
                            const topicsArr = e.target.value.split('|').map((s) => s.trim());
                            handleUpdateModule(idx, 'topics', topicsArr);
                          }}
                        />
                      </div>

                      <div className={`${styles.field} ${styles['field--full']}`}>
                        <label className={styles.inputLabel}>مشروع التسليم العملي (Capstone Project):</label>
                        <Input
                          value={mod.project || ''}
                          onChange={(e) => handleUpdateModule(idx, 'project', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setEditingCourse(null)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" loading={savingCourse} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} />
                <span>حفظ التعديلات في المسار</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
