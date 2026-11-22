import {
  Megaphone,
  Layout,
  Server,
  Globe,
  Bot,
  BarChart3,
  CheckSquare,
  ArrowLeft,
  ChevronDown,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import styles from './HeroSection.module.css';

/**
 * Clean, modern Hero Section with official announcement banner for Front-End Bootcamp launch.
 * Uses high-end Lucide React icons instead of emojis.
 */
export default function HeroSection({
  announcement,
  courses = [],
  onOpenRegistration,
  onOpenCourseRegistration,
  isRegistrationOpen,
  cohortName,
}) {
  const tracksList = [
    { label: 'Front-End (متاح للتسجيل)', icon: <Layout size={14} />, isOpen: true },
    { label: 'Back-End (يبدأ قريباً)', icon: <Server size={14} />, isOpen: false },
    { label: 'Full-Stack (يبدأ قريباً)', icon: <Globe size={14} />, isOpen: false },
    { label: 'AI & ML (يبدأ قريباً)', icon: <Bot size={14} />, isOpen: false },
    { label: 'Data Analysis (يبدأ قريباً)', icon: <BarChart3 size={14} />, isOpen: false },
    { label: 'Software Testing (يبدأ قريباً)', icon: <CheckSquare size={14} />, isOpen: false },
  ];

  // Dynamic announcement display control
  const showAnnouncement = announcement ? announcement.isEnabled !== false : true;

  const handleAnnouncementClick = () => {
    if (!announcement) {
      onOpenRegistration();
      return;
    }

    if (announcement.mode === 'course' && announcement.courseSlug) {
      if (onOpenCourseRegistration) {
        onOpenCourseRegistration(announcement.courseSlug);
      } else {
        onOpenRegistration();
      }
    } else if (announcement.buttonLink && announcement.buttonLink.startsWith('#')) {
      const el = document.querySelector(announcement.buttonLink);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (announcement.buttonLink) {
      window.location.href = announcement.buttonLink;
    } else {
      onOpenRegistration();
    }
  };

  return (
    <section className={styles.hero}>
      {/* Subtle ambient lighting */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      <div className={styles.container}>
        {/* Prominent Official Announcement Banner (Controlled from Admin) */}
        {showAnnouncement && (
          <div className={styles.officialAnnouncement}>
            <div className={styles.announcementBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <Megaphone size={14} className={styles.announcementIcon} />
              <span>{announcement?.badge || 'إعلان هام ورسمي'}</span>
            </div>

            <div className={styles.announcementContent}>
              <p className={styles.announcementTitle}>
                {announcement?.title || (
                  <>
                    الانطلاقة الرسمية لعام 2026 تبدأ حصرياً بـ{' '}
                    <strong className={styles.highlightText}>
                      معسكر تطوير الواجهات الأمامية (Front-End Bootcamp)
                    </strong>
                  </>
                )}
              </p>
              <p className={styles.announcementDetails}>
                {announcement?.details || (
                  <>
                    تدريب عملي مكثف لمدة 4 أشهر على خماسية الواجهات (HTML, CSS, Bootstrap, JavaScript, React) مع مراجعات كود فردية 1:1.
                    <span className={styles.subNote}> [باقي المسارات قيد الإعداد وتبدأ تباعاً، ويمكنك استعراض مناهجها بالأسفل]</span>
                  </>
                )}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAnnouncementClick}
              className={styles.announcementCta}
            >
              <span>{announcement?.buttonText?.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || 'سجّل مقعدك الآن'}</span>
              <ArrowLeft size={14} />
            </Button>
          </div>
        )}

        {/* Hero Main Headline */}
        <h1 className={styles.title}>
          اصنع مستقبلك كمهندس برمجيات محترف
          <span className={styles.titleHighlight}>
            بمعسكرات عملية تركز على متطلبات سوق العمل
          </span>
        </h1>

        {/* Concise, comfortable subtitle */}
        <p className={styles.subtitle}>
          أكاديمية برمجية هندسية متكاملة خالية من الحشو النظري؛ نركز 100% على التطبيق العملي،
          مراجعات الكود الفردية (1:1)، وبناء مشاريع واقعية تؤهلك للتوظيف والمنافسة في كبرى الشركات.
        </p>

        {/* Specialization Tracks Status Pills */}
        <div className={styles.tracksPillsWrapper}>
          <span className={styles.tracksPillsLabel}>حالة المسارات:</span>
          <div className={styles.tracksPills}>
            {tracksList.map((track, idx) => (
              <a
                key={idx}
                href="#tracks"
                className={`${styles.trackPill} ${track.isOpen ? styles['trackPill--open'] : ''}`}
              >
                <span className={styles.trackIcon}>{track.icon}</span>
                <span>{track.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenRegistration}
            className={styles.ctaPrimary}
          >
            <span>سجل الآن في معسكر Front-End (الدفعة الأولى)</span>
            <ArrowLeft size={18} />
          </Button>
          <a href="#tracks" className={styles.secondaryAnchor}>
            <Button variant="secondary" size="lg" className={styles.ctaSecondary}>
              <span>استكشف تفاصيل ومناهج المسارات</span>
              <ChevronDown size={18} />
            </Button>
          </a>
        </div>

        {/* Core Value Pillars / Trust Stats Strip */}
        <div className={styles.trustGrid}>
          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Layout size={20} />
            </div>
            <div className={styles.trustText}>
              <strong>الفرونت إند: 4 أشهر</strong>
              <span>HTML, CSS, Bootstrap, JS, React</span>
            </div>
          </div>

          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Server size={20} />
            </div>
            <div className={styles.trustText}>
              <strong>الباك إند: 3 أشهر</strong>
              <span>Node.js, Express, Databases & APIs</span>
            </div>
          </div>

          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Globe size={20} />
            </div>
            <div className={styles.trustText}>
              <strong>الفول ستاك: 7 أشهر</strong>
              <span>هندسة الويب الشاملة MERN المتكاملة</span>
            </div>
          </div>

          <div className={styles.trustCard}>
            <div className={styles.trustIcon}>
              <Code2 size={20} />
            </div>
            <div className={styles.trustText}>
              <strong>مراجعات كود 1:1</strong>
              <span>متابعة فردية سطر بسطر على كل مشروع</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
