import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  PhoneCall,
  Calendar,
  Layers,
  Award,
  Zap,
  HelpCircle,
  Lock,
  Share2,
  X,
  MessageCircle,
  ExternalLink,
  Globe,
  BookOpen,
  FolderGit2,
  ChevronDown,
  Compass,
  ArrowUp,
} from 'lucide-react';
import { Logo, Button } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getCourses, getCourseBySlug } from '@/features/landing/api/courses.api';
import { submitRegistration } from '../api/registration.api';
import academyLogo from '@/assets/logoo.png';
import styles from './RegisterPage.module.css';

const TRACK_TECH_STACK = {
  'frontend-development': ['HTML5', 'CSS3', 'Bootstrap 5', 'JavaScript ES6+', 'React'],
  'backend-development': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker'],
  'fullstack-development': ['HTML/CSS/Bootstrap', 'React', 'Node.js', 'Express', 'MongoDB'],
  'ai-machine-learning': ['Python', 'PyTorch', 'Machine Learning', 'LLMs', 'Prompt Engineering'],
  'data-analysis': ['Advanced SQL', 'Python Pandas', 'Power BI', 'Data Modeling'],
  'software-testing-qa': ['Manual Testing', 'Cypress', 'Playwright', 'Postman API', 'Jira'],
};

export default function RegisterPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Social share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    experienceLevel: 'beginner',
    goals: '',
    paymentMethod: 'vodafone_cash',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCoursesList = async () => {
      try {
        setLoading(true);
        const data = await getCourses();
        if (!isMounted) return;
        const coursesList = data || [];
        setCourses(coursesList);

        if (coursesList.length > 0) {
          // If slug in URL, match it; otherwise find open track or first
          let matched = null;
          if (slug) {
            matched = coursesList.find((c) => c.slug === slug.toLowerCase());
          }
          if (!matched) {
            matched =
              coursesList.find((c) => c.slug === 'frontend-development') ||
              coursesList.find((c) => c.isRegistrationOpen) ||
              coursesList[0];
          }

          if (matched) {
            if (!matched.roadmap || matched.roadmap.length === 0) {
              try {
                const fullDetails = await getCourseBySlug(matched.slug);
                if (fullDetails) matched = { ...matched, ...fullDetails };
              } catch (e) {}
            }
            setSelectedCourse(matched);
          }
        }
      } catch (err) {
        console.error('Failed to load courses for registration:', err);
        addToast({ type: 'error', message: 'تعذر تحميل بيانات المسارات التدريبية' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCoursesList();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle changing track from dropdown
  const handleCourseChange = async (courseId) => {
    let course = courses.find((c) => c._id === courseId);
    if (course) {
      if (!course.roadmap || course.roadmap.length === 0) {
        try {
          const fullDetails = await getCourseBySlug(course.slug);
          if (fullDetails) course = { ...course, ...fullDetails };
        } catch (e) {}
      }
      setSelectedCourse(course);
      navigate(`/register/${course.slug}`, { replace: true });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const nameTrimmed = formData.fullName.trim();
    if (!nameTrimmed || nameTrimmed.split(/\s+/).length < 2) {
      errs.fullName = 'يرجى كتابة الاسم ثنائياً أو ثلاثياً على الأقل';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    const phoneClean = formData.phone.trim().replace(/\s+/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      errs.phone = 'يرجى إدخال رقم هاتف وواتساب صحيح لتأكيد الحجز';
    }

    if (formData.age && (Number(formData.age) < 14 || Number(formData.age) > 70)) {
      errs.age = 'العمر يجب أن يكون بين 14 و 70 عاماً';
    }

    if (!selectedCourse?._id) {
      errs.course = 'يرجى اختيار المسار التدريبي';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !selectedCourse?._id) return;

    if (!selectedCourse.isRegistrationOpen) {
      addToast({
        type: 'warning',
        message: 'عذراً، باب التسجيل في هذا المسار مغلق حالياً وسيبدأ قريباً.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        courseId: selectedCourse._id,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        age: formData.age ? Number(formData.age) : undefined,
        experienceLevel: formData.experienceLevel,
        goals: formData.goals.trim(),
        preferredPaymentMethod: formData.paymentMethod,
        background: `طريقة الدفع المفضلة: ${formData.paymentMethod}`,
        referralSource: 'social_media_registration_page',
      };

      const res = await submitRegistration(payload);
      setIsSuccess(true);
      setSuccessInfo(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast({
        type: 'success',
        message: 'تم تسجيل طلبك بنجاح! سنتواصل معك عبر واتساب لتأكيد الحجز.',
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || 'حدث خطأ أثناء إرسال طلب التسجيل. يرجى المحاولة مرة أخرى.';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    addToast({ type: 'info', message: 'تم نسخ كود الطلب إلى الحافظة' });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Pricing calculations
  const hasOffer = Boolean(selectedCourse?.hasOffer && selectedCourse?.offerPrice);
  const displayPrice = hasOffer ? selectedCourse.offerPrice : selectedCourse?.price || 3500;
  const originalPrice = selectedCourse?.price || 4500;
  const savingsAmount = hasOffer && originalPrice > displayPrice ? originalPrice - displayPrice : 0;
  const discountPercent =
    hasOffer && originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  // Features list
  const defaultFeatures = [
    'تدريب تطبيقي مكثف يركز على متطلبات التوظيف الفعلية',
    'مراجعة كود فردية 1:1 لكل مشروع مع مهندس برمجيات',
    'بناء 5 مشاريع واقعية متكاملة ترفع كودها على GitHub',
    'جلسات إرشاد ومتابعة أسبوعية مباشرة مع المدرب',
    'شهادة إتمام معتمدة بكود تحقق رقمي رسمي',
    'توجيه مهني وتجهيز للإنترفيوهات وملف الـ LinkedIn',
  ];
  const featuresList =
    selectedCourse?.features && selectedCourse.features.length > 0
      ? selectedCourse.features
      : defaultFeatures;

  const techStack = selectedCourse?.slug
    ? TRACK_TECH_STACK[selectedCourse.slug] || ['HTML5', 'CSS3', 'JavaScript', 'React']
    : [];

  const modules = selectedCourse?.roadmap || [];

  const handleScrollToForm = () => {
    const el = document.getElementById('register-form-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const whatsappNumber = selectedCourse?.whatsappSupportNumber || '201014176434';
  const whatsappInquiryUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `مرحباً، أود الاستفسار عن تفاصيل التسجيل في ${selectedCourse?.title || 'معسكرات DevNest Academy'}`
  )}`;

  const whatsappConfirmUrl = successInfo
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `مرحباً فريق أكاديمية DevNest، قمت بحجز مقعدي في "${selectedCourse?.title}" باسم "${formData.fullName}"، كود التسجيل: (${successInfo.registrationId}). أود تأكيد الحجز وإتمام الخطوات التالية.`
      )}`
    : '#';

  // Dynamic SEO and Social Share Data
  const isFrontEnd = selectedCourse?.slug === 'frontend-development';

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register/${selectedCourse?.slug || 'frontend-development'}`
      : `https://devnest.academy/register/${selectedCourse?.slug || 'frontend-development'}`;

  const pageTitle = isFrontEnd
    ? 'سجّل الآن في معسكر تطوير الواجهات الأمامية (Front-End Bootcamp) | DevNest Academy'
    : `سجّل الآن في ${selectedCourse?.title || 'معسكرات DevNest Academy'}`;

  const shareTitle = pageTitle;

  const pageDescription = isFrontEnd
    ? `احجز مقعدك في معسكر الـ Front-End الشامل لعام 2026 (HTML5, CSS3, Bootstrap 5, Modern JavaScript, React). تدريب عملي مكثف 4 أشهر مع مراجعات كود فردية 1:1، بناء 5 مشاريع واقعية، وشهادة معتمدة. ${
        hasOffer
          ? `عرض الحجز المبكر متاح الآن بـ ${displayPrice} ج.م بدلاً من ${originalPrice} ج.م (${selectedCourse?.offerBadge})!`
          : `الاستثمار التدريبي: ${displayPrice} ج.م.`
      }`
    : `${selectedCourse?.shortDescription || 'احجز مقعدك في الدفعة الأولى لعام 2026'}. تدريب عملي مكثف ومراجعات كود فردية 1:1.`;

  const shareText = `${pageTitle}\n\n${pageDescription}\n\nسجل مقعدك مباشرة عبر الرابط:\n${shareUrl}`;

  const handleShareClick = async () => {
    if (navigator.share && typeof navigator.canShare === 'function') {
      const shareData = {
        title: pageTitle,
        text: shareText,
        url: shareUrl,
      };
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareUrl(true);
    addToast({ type: 'success', message: 'تم نسخ رابط صفحة التسجيل بنجاح لمشاركته!' });
    setTimeout(() => setCopiedShareUrl(false), 2500);
  };

  // Structured Data for SEO & Social Media
  const courseSchema = selectedCourse
    ? {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: selectedCourse.title,
        description: selectedCourse.shortDescription || selectedCourse.description,
        provider: {
          '@type': 'EducationalOrganization',
          name: 'DevNest Academy',
          url: 'https://devnest.academy',
          logo: 'https://devnest.academy/logo.png',
        },
        educationalCredentialAwarded: 'شهادة اجتياز وتخرج معتمدة برقم تسلسلي وكود تحقق إلكتروني',
        timeRequired: isFrontEnd ? 'P4M' : 'P3M',
        courseCode: isFrontEnd ? 'DN-FE-2026' : `DN-${selectedCourse.slug}`,
        inLanguage: 'ar',
        teaches: techStack,
        offers: {
          '@type': 'Offer',
          category: 'Paid',
          price: displayPrice,
          priceCurrency: selectedCourse.currency || 'EGP',
          availability: selectedCourse.isRegistrationOpen
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: shareUrl,
          priceValidUntil: selectedCourse.offerEndsAt || '2026-12-31',
        },
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://devnest.academy',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'المسارات الهندسية',
        item: 'https://devnest.academy/#tracks',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: selectedCourse?.title || 'التسجيل في المعسكر',
        item: shareUrl,
      },
    ],
  };

  const schemasList = [courseSchema, breadcrumbSchema].filter(Boolean);

  return (
    <div className={styles.pageWrapper}>
      {/* High-converting Open Graph SEO Meta */}
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={shareUrl}
        ogImage="/logo.png"
        keywords="معسكر فرونت إند, كورس Front-End, تعلم React, JavaScript, HTML5, CSS3, Bootstrap 5, DevNest Academy, كورس برمجة في مصر, معسكر برمجة 2026"
        schemas={schemasList}
      />

      {/* Top Header */}
      <header className={styles.topHeader}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.brandLink}>
            <Logo size="md" />
          </Link>

          <div className={styles.headerActions}>
            {/* Social Share Button in Header */}
            <button
              type="button"
              className={styles.shareHeaderBtn}
              onClick={handleShareClick}
              title="مشاركة رابط صفحة التسجيل"
            >
              <Share2 size={14} />
              <span>مشاركة الرابط</span>
            </button>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappHeaderBtn}
            >
              <PhoneCall size={14} />
              <span>استفسار واتساب</span>
            </a>
            <Link to="/" className={styles.backHomeBtn}>
              <span>الرئيسية</span>
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className={styles.mainContent}>
        {/* Hero Section of Registration Page */}
        <div className={styles.pageHeroSection}>
          <div className={styles.heroTag}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span>الانطلاقة الرسمية • الدفعة الأولى 2026</span>
          </div>

          <h1 className={styles.pageTitle}>
            احجز مقعدك في{' '}
            <span className={styles.highlightText}>
              {selectedCourse?.title || 'معسكرات DevNest Academy'}
            </span>
          </h1>

          <p className={styles.pageSubtitle}>
            استثمارك الأفضل لبناء مسيرتك المهنية؛ تدريب مكثف يركز على التطبيق العملي وبناء المشاريع
            مع مراجعات كود فردية سطر بسطر.
          </p>
        </div>

        {/* Success Screen OR Two-Column Registration Grid */}
        {isSuccess ? (
          <div className={styles.successWrapper}>
            <div className={styles.successIconGlow}>
              <CheckCircle2 size={40} />
            </div>

            <h2 className={styles.successTitle}>تم استلام طلب تسجيلك بنجاح!</h2>
            <p className={styles.successSub}>
              تهانينا <strong style={{ color: 'var(--color-text)' }}>{formData.fullName}</strong>،
              تم إرسال طلب حجز مقعدك في {selectedCourse?.title}.
            </p>

            {/* Application Summary Card */}
            <div className={styles.applicationInfoCard}>
              <div className={styles.appInfoRow}>
                <span className={styles.appInfoLabel}>المسار التدريبي:</span>
                <span className={styles.appInfoVal}>{selectedCourse?.title}</span>
              </div>
              <div className={styles.appInfoRow}>
                <span className={styles.appInfoLabel}>الدفعة:</span>
                <span className={styles.appInfoVal}>{selectedCourse?.cohortName || 'الدفعة الأولى 2026'}</span>
              </div>
              <div className={styles.appInfoRow}>
                <span className={styles.appInfoLabel}>السعر المعتمد:</span>
                <span className={styles.appInfoVal} style={{ color: '#00c2ff' }}>
                  {displayPrice} {selectedCourse?.currency || 'EGP'}
                  {hasOffer && (
                    <span style={{ fontSize: '11px', color: '#f59e0b', marginRight: '6px' }}>
                      ({selectedCourse.offerBadge})
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.appInfoRow}>
                <span className={styles.appInfoLabel}>كود الطلب المرجعي:</span>
                <span className={styles.appInfoVal}>
                  <code>{successInfo?.registrationId || 'DN-APP-2026'}</code>
                  <button
                    type="button"
                    className={styles.copyCodeBtn}
                    onClick={() => handleCopyCode(successInfo?.registrationId)}
                    title="نسخ كود الطلب"
                  >
                    {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            </div>

            {/* WhatsApp Confirmation CTA */}
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsAppDirectBtn}
            >
              <Send size={18} />
              <span>تأكيد الحجز الفوري عبر واتساب مع فريق القبول</span>
            </a>

            {/* Share Invitation after Success */}
            <div style={{ width: '100%', maxWidth: '480px', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className={styles.shareHeaderBtn}
                onClick={handleShareClick}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <Share2 size={16} />
                <span>دعوة صديق أو زميل للتسجيل في الدفعة</span>
              </button>
            </div>

            {/* Next Steps Checklist */}
            <div className={styles.nextStepsList}>
              <h3 className={styles.nextStepsTitle}>ما هي الخطوات التالية؟</h3>
              <div className={styles.nextStepItem}>
                <span className={styles.stepNumber}>1</span>
                <span>
                  يقوم فريق القبول بمراجعة طلبك والتواصل معك عبر رقم الواتساب المسجل خلال 24 ساعة.
                </span>
              </div>
              <div className={styles.nextStepItem}>
                <span className={styles.stepNumber}>2</span>
                <span>
                  إرسال تفاصيل تأكيد الاشتراك وطرق الدفع المتاحة (فودافون كاش، إنستاباي، أو تحويل بنكي).
                </span>
              </div>
              <div className={styles.nextStepItem}>
                <span className={styles.stepNumber}>3</span>
                <span>
                  توليد كود تفعيل حساب الطالب الخاص بك للدخول فوراً إلى منصة المحاضرات والمهام التدريبية.
                </span>
              </div>
            </div>

            <Link to="/" className={styles.backHomeActionBtn}>
              <ArrowRight size={16} />
              <span>العودة إلى الصفحة الرئيسية للأكاديمية</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.layoutGrid}>
            {/* ========================================================
                LEFT COLUMN: COURSE DETAILS & DYNAMIC OFFER CARD
                ======================================================== */}
            <div className={styles.infoColumn}>
              {/* Track Switcher */}
              {courses.length > 1 && (
                <div className={styles.trackSelectBar}>
                  <label htmlFor="trackSelect" className={styles.trackSelectLabel}>
                    اختر المسار التدريبي المراد التسجيل فيه:
                  </label>
                  <select
                    id="trackSelect"
                    className={styles.trackSelectBox}
                    value={selectedCourse?._id || ''}
                    onChange={(e) => handleCourseChange(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} {c.isRegistrationOpen ? '(متاح للتسجيل)' : '(قيد الإعداد — يبدأ قريباً)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Detail Card */}
              <div className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <div className={styles.trackCategoryBadge}>
                    <Layers size={13} />
                    <span>{selectedCourse?.cohortName || 'دفعة 2026 — الدفعة الأولى'}</span>
                  </div>
                  <h2 className={styles.courseTitle}>{selectedCourse?.title}</h2>
                  <p className={styles.courseShortDesc}>{selectedCourse?.shortDescription}</p>
                </div>

                {/* Key Metrics Chips */}
                <div className={styles.metaChips}>
                  <div className={styles.metaChip}>
                    <Clock size={13} color="var(--color-brand)" />
                    <span>{selectedCourse?.duration || '4 أشهر مكثفة'}</span>
                  </div>
                  <div className={styles.metaChip}>
                    <Award size={13} color="var(--color-brand)" />
                    <span>{selectedCourse?.level || 'من الصفر حتى الجاهزية لسوق العمل'}</span>
                  </div>
                  <div className={styles.metaChip}>
                    <Zap size={13} color="#10b981" />
                    <span>{selectedCourse?.isRegistrationOpen ? 'التسجيل مفتوح' : 'يبدأ قريباً'}</span>
                  </div>
                </div>

                {/* DYNAMIC PRICING & OFFER BOX */}
                <div className={styles.pricingBox}>
                  {hasOffer && (
                    <div className={styles.offerBadgeRow}>
                      <span className={styles.offerBadge}>
                        <Sparkles size={13} />
                        <span>{selectedCourse.offerBadge || 'عرض الحجز المبكر لفترة محدودة'}</span>
                      </span>

                      {savingsAmount > 0 && (
                        <span className={styles.savingsBadge}>
                          وفر {savingsAmount.toLocaleString()} {selectedCourse.currency || 'ج.م'} ({discountPercent}% خصم)
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.priceDisplayRow}>
                    <div>
                      <span className={styles.currentPrice}>
                        {displayPrice.toLocaleString()}
                      </span>
                      <span className={styles.currencyUnit}>
                        {selectedCourse?.currency === 'EGP' ? 'جنيه مصري' : selectedCourse?.currency || 'ج.م'}
                      </span>
                    </div>

                    {hasOffer && (
                      <span className={styles.originalPrice}>
                        {originalPrice.toLocaleString()} {selectedCourse?.currency || 'ج.م'}
                      </span>
                    )}
                  </div>

                  <div className={styles.offerNote}>
                    <Clock size={12} color="var(--color-text-muted)" />
                    <span>
                      {selectedCourse?.offerNote ||
                        'العرض متاح للدفعة الحالية أو حتى اكتمال 30 مقعداً مخصصاً.'}
                    </span>
                  </div>
                </div>

                {/* Social Share Promo Card */}
                <div className={styles.sharePromoCard}>
                  <div className={styles.sharePromoTop}>
                    <h3 className={styles.sharePromoTitle}>
                      <Share2 size={14} color="#00c2ff" />
                      <span>شارك رابط التقديم مع أصدقائك وزملائك</span>
                    </h3>
                    <span className={styles.sharePromoSub}>
                      متاح خصم الحجز المبكر للدفعة الأولى لفترة محدودة
                    </span>
                  </div>

                  <div className={styles.sharePillsRow}>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.sharePill} ${styles['sharePill--whatsapp']}`}
                      title="مشاركة عبر واتساب"
                    >
                      <MessageCircle size={13} />
                      <span>واتساب</span>
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.sharePill} ${styles['sharePill--facebook']}`}
                      title="مشاركة على فيسبوك"
                    >
                      <span>فيسبوك</span>
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.sharePill} ${styles['sharePill--linkedin']}`}
                      title="مشاركة على لينكد إن"
                    >
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.sharePill} ${styles['sharePill--x']}`}
                      title="مشاركة على X"
                    >
                      <span>X (تويتر)</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className={`${styles.sharePill} ${styles['sharePill--copy']}`}
                      title="نسخ رابط الصفحة المباشر"
                    >
                      {copiedShareUrl ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedShareUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>

                {/* Tech Stack */}
                {techStack.length > 0 && (
                  <div className={styles.techStackBox}>
                    <p className={styles.stackTitle}>التقنيات والأدوات المشمولة في المعسكر:</p>
                    <div className={styles.stackTags}>
                      {techStack.map((tech, i) => (
                        <span key={i} className={styles.stackTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div className={styles.featuresBox}>
                  <p className={styles.featuresTitle}>
                    <Sparkles size={15} color="#00c2ff" />
                    <span>مميزات الانضمام للمعسكر:</span>
                  </p>
                  <ul className={styles.featureList}>
                    {featuresList.map((feat, index) => (
                      <li key={index} className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.checkIcon} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Curriculum Mini Summary Card */}
                {modules.length > 0 && (
                  <div className={styles.curriculumSummaryCard}>
                    <div className={styles.curriculumSummaryHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={16} color="#0077d7" />
                        <span className={styles.curriculumSummaryTitle}>
                          المراحل والمناهج الدراسية ({modules.length} مراحل تفاعلية):
                        </span>
                      </div>
                      <a href="#curriculum-breakdown" className={styles.viewAllCurriculumLink}>
                        <span>استعراض المنهج</span>
                        <ChevronDown size={14} />
                      </a>
                    </div>
                    <div className={styles.modulesMiniList}>
                      {modules.map((mod, idx) => (
                        <div key={idx} className={styles.moduleMiniItem}>
                          <span className={styles.moduleMiniNum}>0{mod.moduleNumber || idx + 1}</span>
                          <span className={styles.moduleMiniTitle}>{mod.title}</span>
                          <span className={styles.moduleMiniDuration}>{mod.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guarantee Card */}
                <div className={styles.guaranteeCard}>
                  <ShieldCheck size={24} className={styles.guaranteeIcon} />
                  <div className={styles.guaranteeContent}>
                    <span className={styles.guaranteeHeading}>ضمان أكاديمية DevNest الذهبي:</span>
                    <p className={styles.guaranteeText}>
                      {selectedCourse?.guaranteeText ||
                        'ضمان استرداد كامل المصروفات خلال أول 7 أيام إذا لم تجد المعسكر مناسباً لتطلعاتك دون أي تعقيد.'}
                    </p>
                  </div>
                </div>

                {/* Direct WhatsApp Advisor */}
                <div className={styles.advisorBox}>
                  <div className={styles.advisorInfo}>
                    <PhoneCall size={20} color="#10b981" />
                    <div className={styles.advisorText}>
                      <span className={styles.advisorTitle}>هل لديك أي استفسار قبل التسجيل؟</span>
                      <span className={styles.advisorSub}>
                        تحدث مباشرة مع مستشار القبول والتسجيل:{' '}
                        <strong dir="ltr" style={{ color: '#10b981' }}>+20 101 417 6434</strong>
                      </span>
                    </div>
                  </div>
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.advisorBtn}
                  >
                    تواصل واتساب
                  </a>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT COLUMN: HIGH-CONVERSION APPLICATION FORM
                ======================================================== */}
            <div className={styles.formColumn}>
              <div id="register-form-card" className={styles.formCard}>
                <div className={styles.formCardHeader}>
                  <h2 className={styles.formCardTitle}>
                    <span>استمارة حجز المقعد</span>
                  </h2>
                  <p className={styles.formCardSubtitle}>
                    املأ بياناتك بدقة وسيتواصل معك فريق القبول عبر الواتساب لتأكيد خيار السداد وتفعيل حسابك.
                  </p>
                </div>

                {!selectedCourse?.isRegistrationOpen && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#ef4444',
                      fontWeight: 600,
                    }}
                  >
                    تنبيه: باب التسجيل في هذا المسار مغلق حالياً. يمكنك ترك بياناتك وسنقوم بالتواصل معك بمجرد إتاحة الدفعة القادمة.
                  </div>
                )}

                <form onSubmit={handleSubmit} className={styles.formElement}>
                  {/* Full Name */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>الاسم الكامل (ثنائي أو ثلاثي)</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.inputField} ${errors.fullName ? styles['inputField--error'] : ''}`}
                      placeholder="مثال: أحمد محمد علي"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                    {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                  </div>

                  {/* Email */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>البريد الإلكتروني</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      className={`${styles.inputField} ${errors.email ? styles['inputField--error'] : ''}`}
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>

                  {/* WhatsApp / Phone */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>رقم الهاتف والواتساب (لتأكيد الحجز)</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      className={`${styles.inputField} ${errors.phone ? styles['inputField--error'] : ''}`}
                      placeholder="01012345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                    <span className={styles.inputHint}>
                      تأكد أن الرقم يحتوي على حساب واتساب فعال لإرسال كود التفعيل ومواعيد المحاضرات.
                    </span>
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>

                  {/* Age (Optional) */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>العمر (اختياري)</span>
                    </label>
                    <input
                      type="number"
                      min="14"
                      max="70"
                      className={`${styles.inputField} ${errors.age ? styles['inputField--error'] : ''}`}
                      placeholder="مثال: 22"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                    {errors.age && <span className={styles.errorText}>{errors.age}</span>}
                  </div>

                  {/* Experience Level Selector */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>ما هو مستواك الحالي في البرمجة؟</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.expOptionsGrid}>
                      {[
                        { id: 'beginner', title: 'مبتدئ تماماً', sub: 'ليس لدي خبرة سابقة' },
                        { id: 'some_basics', title: 'لدي أساسيات', sub: 'جربت كتابة كود بسيط' },
                        { id: 'intermediate', title: 'مستوى متوسط', sub: 'أريد الجاهزية لسوق العمل' },
                      ].map((lvl) => (
                        <label
                          key={lvl.id}
                          className={`${styles.expRadioLabel} ${
                            formData.experienceLevel === lvl.id
                              ? styles['expRadioLabel--selected']
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="experienceLevel"
                            className={styles.expRadioInput}
                            value={lvl.id}
                            checked={formData.experienceLevel === lvl.id}
                            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                          />
                          <span className={styles.expRadioTitle}>{lvl.title}</span>
                          <span className={styles.expRadioSub}>{lvl.sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Goals / Motivation */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>ما هو هدفك الأساسي من الانضمام للمعسكر؟</span>
                    </label>
                    <textarea
                      className={styles.textareaField}
                      placeholder="مثال: العمل كـ Front-End Developer عن بعد، تغيير مساري المهني، إتقان React..."
                      rows={2}
                      value={formData.goals}
                      onChange={(e) => handleInputChange('goals', e.target.value)}
                    />
                  </div>

                  {/* Preferred Payment Method */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      <span>طريقة الدفع وتأكيد الحجز المفضلة لك:</span>
                    </label>
                    <div className={styles.paymentGrid}>
                      {[
                        { id: 'vodafone_cash', label: 'فودافون كاش / محافظ ذكية' },
                        { id: 'instapay', label: 'إنستاباي (InstaPay)' },
                        { id: 'bank_transfer', label: 'تحويل بنكي مباشر' },
                        { id: 'installments', label: 'السداد على قسطين' },
                      ].map((m) => (
                        <div
                          key={m.id}
                          className={`${styles.paymentOption} ${
                            formData.paymentMethod === m.id ? styles['paymentOption--selected'] : ''
                          }`}
                          onClick={() => handleInputChange('paymentMethod', m.id)}
                        >
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              border: '2px solid currentColor',
                              display: 'inline-block',
                              background:
                                formData.paymentMethod === m.id ? 'currentColor' : 'transparent',
                            }}
                          />
                          <span>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className={styles.submitBtnSpinner} />
                        <span>جاري تأكيد وتسجيل المقعد...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>تأكيد تسجيل المقعد الآن</span>
                      </>
                    )}
                  </button>

                  {/* Privacy footer */}
                  <div className={styles.privacyFooter}>
                    <Lock size={12} />
                    <span>بياناتك مؤمنة بالكامل وفق معايير الخصوصية الصارمة ولا يتم مشاركتها أبداً.</span>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ========================================================
              FULL-WIDTH CURRICULUM BREAKDOWN SECTION
              ======================================================== */}
          {modules.length > 0 && (
            <section id="curriculum-breakdown" className={styles.curriculumSection}>
              <div className={styles.curriculumSectionHeader}>
                <div className={styles.curriculumTag}>
                  <Compass size={14} />
                  <span>الخطة التدريبية المعتمدة</span>
                </div>
                <h2 className={styles.curriculumHeading}>
                  المراحل والمناهج الدراسية الشاملة ({modules.length} مراحل تفاعلية)
                </h2>
                <p className={styles.curriculumSubtitle}>
                  خطة تطبيقية مكثفة تنقلك خطوة بخطوة من الصفر التام حتى احتراف متطلبات سوق العمل البرمجي الحقيقية وبناء بورتفوليو قوي.
                </p>
              </div>

              <div className={styles.modulesDetailedGrid}>
                {modules.map((mod, idx) => (
                  <div key={idx} className={styles.moduleDetailedCard}>
                    <div className={styles.moduleCardTop}>
                      <div className={styles.modulePhaseBadge}>
                        <span>المرحلة 0{mod.moduleNumber || idx + 1}</span>
                      </div>
                      <div className={styles.moduleDurationBadge}>
                        <Clock size={13} />
                        <span>{mod.duration}</span>
                      </div>
                    </div>

                    <h3 className={styles.moduleCardTitle}>{mod.title}</h3>

                    {/* Topics List */}
                    {mod.topics && mod.topics.length > 0 && (
                      <div className={styles.moduleTopicsWrapper}>
                        <span className={styles.topicsHeaderTitle}>أبرز المحاور والمهارات:</span>
                        <ul className={styles.moduleTopicsList}>
                          {mod.topics.map((topic, tIdx) => (
                            <li key={tIdx} className={styles.moduleTopicItem}>
                              <Check size={14} className={styles.topicCheckIcon} />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Capstone Project */}
                    {mod.project && (
                      <div className={styles.moduleProjectBox}>
                        <div className={styles.projectBoxHeader}>
                          <FolderGit2 size={14} color="#0077d7" />
                          <span>مشروع التسليم العملي (Capstone):</span>
                        </div>
                        <p className={styles.projectBoxTitle}>{mod.project}</p>
                        <span className={styles.projectBoxHint}>
                          مراجعة كود فردية 1:1 ودرجات معتمدة
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Curriculum Bottom CTA */}
              <div className={styles.curriculumBottomCta}>
                <div className={styles.ctaTextCol}>
                  <span className={styles.ctaHeading}>جاهز لبدء رحلتك واحتراف هذا المنهج؟</span>
                  <span className={styles.ctaSub}>احجز مقعدك الآن في الدفعة الأولى واستفد من عرض الحجز المبكر.</span>
                </div>
                <button
                  type="button"
                  onClick={handleScrollToForm}
                  className={styles.scrollToFormBtn}
                >
                  <span>الرجوع لاستمارة التسجيل الآن</span>
                  <ArrowUp size={16} />
                </button>
              </div>
            </section>
          )}
        </>
      )}
      </main>

      {/* ========================================================
          INTERACTIVE SOCIAL SHARE MODAL
          ======================================================== */}
      {isShareModalOpen && (
        <div
          className={styles.shareModalBackdrop}
          onClick={() => setIsShareModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.shareModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shareModalHeader}>
              <h3 className={styles.shareModalTitle}>
                <Share2 size={18} color="#00c2ff" />
                <span>مشاركة رابط صفحة التسجيل</span>
              </h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsShareModalOpen(false)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* Course Mini Preview */}
            <div className={styles.sharePreviewCard}>
              <img src={academyLogo} alt="DevNest Academy" className={styles.sharePreviewLogo} />
              <div className={styles.sharePreviewText}>
                <span className={styles.sharePreviewTitle}>{selectedCourse?.title}</span>
                <span className={styles.sharePreviewSub}>
                  {selectedCourse?.cohortName || 'دفعة 2026'} •{' '}
                  {hasOffer ? `${displayPrice} ج.م بدلاً من ${originalPrice} ج.م` : `${displayPrice} ج.م`}
                </span>
              </div>
            </div>

            {/* Social Platforms Grid */}
            <div className={styles.shareChannelsGrid}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareChannelBtn} ${styles['shareChannelBtn--whatsapp']}`}
              >
                <MessageCircle size={18} />
                <span>مشاركة عبر واتساب</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareChannelBtn} ${styles['shareChannelBtn--facebook']}`}
              >
                <Globe size={18} />
                <span>نشر على فيسبوك</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareChannelBtn} ${styles['shareChannelBtn--linkedin']}`}
              >
                <ExternalLink size={18} />
                <span>مشاركة على LinkedIn</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareChannelBtn} ${styles['shareChannelBtn--x']}`}
              >
                <Send size={18} />
                <span>تغريد على X</span>
              </a>
            </div>

            {/* Copy Direct Link Box */}
            <div className={styles.copyBox}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className={styles.copyInput}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={styles.copyActionBtn}
                onClick={handleCopyShareLink}
              >
                {copiedShareUrl ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedShareUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
