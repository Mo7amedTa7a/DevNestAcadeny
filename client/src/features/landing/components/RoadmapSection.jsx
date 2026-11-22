import { useState, useEffect } from 'react';
import {
  Layout,
  Server,
  Globe,
  Bot,
  BarChart3,
  CheckSquare,
  Clock,
  Compass,
  Check,
  FolderGit2,
  ArrowLeft,
} from 'lucide-react';
import { Badge, Card, Button } from '@/components/ui';
import styles from './RoadmapSection.module.css';

const getTrackIcon = (slug) => {
  switch (slug) {
    case 'frontend-development':
      return <Layout size={16} />;
    case 'backend-development':
      return <Server size={16} />;
    case 'fullstack-development':
      return <Globe size={16} />;
    case 'ai-machine-learning':
      return <Bot size={16} />;
    case 'data-analysis':
      return <BarChart3 size={16} />;
    case 'software-testing-qa':
      return <CheckSquare size={16} />;
    default:
      return <Layout size={16} />;
  }
};

export default function RoadmapSection({
  courses = [],
  selectedCourse,
  onSelectCourse,
  onOpenRegistration,
}) {
  const [activeCourseSlug, setActiveCourseSlug] = useState('frontend-development');
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  useEffect(() => {
    if (selectedCourse?.slug) {
      setActiveCourseSlug(selectedCourse.slug);
      setActiveModuleIndex(0);
    }
  }, [selectedCourse]);

  // Current course for roadmap
  const currentCourse = courses.find((c) => c.slug === activeCourseSlug) || courses[0] || selectedCourse;
  const modules = currentCourse?.roadmap || [];
  const currentModule = modules[activeModuleIndex] || modules[0];
  const isOpen = currentCourse?.isRegistrationOpen;

  const handleSwitchTrack = (slug) => {
    setActiveCourseSlug(slug);
    setActiveModuleIndex(0);
    const found = courses.find((c) => c.slug === slug);
    if (found && onSelectCourse) {
      onSelectCourse(found);
    }
  };

  return (
    <section id="roadmap" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tagline}>المناهج ومحتويات التعلم</span>
          <h2 className={styles.title}>خريطة طريق ومحتوى كل مسار</h2>
          <p className={styles.subtitle}>
            استعرض المنهج التفصيلي والمشاريع العملية لكل مسار هندسي من البداية حتى الاحتراف.
          </p>
        </div>

        {/* Track Selector Pills */}
        <div className={styles.trackPicker}>
          {courses.map((course) => {
            const isActive = course.slug === activeCourseSlug;
            const shortName = course.title.split('(')[0].replace('معسكر', '').trim();
            const courseIsOpen = course.isRegistrationOpen;

            return (
              <button
                key={course.slug}
                type="button"
                className={`${styles.trackBtn} ${isActive ? styles['trackBtn--active'] : ''}`}
                onClick={() => handleSwitchTrack(course.slug)}
              >
                <span>{getTrackIcon(course.slug)}</span>
                <span>{shortName}</span>
                {courseIsOpen ? (
                  <span className={styles.openDot} title="متاح للتسجيل">●</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Selected Track Banner */}
        {currentCourse && (
          <div className={styles.trackInfoBanner}>
            <div className={styles.bannerRight}>
              <h3 className={styles.bannerTitle}>{currentCourse.title}</h3>
              <p className={styles.bannerDesc}>{currentCourse.shortDescription}</p>
            </div>
            <div className={styles.bannerMeta}>
              <Badge variant="primary">{currentCourse.duration}</Badge>
              {isOpen ? (
                <Badge variant="success">متاح للتسجيل الآن</Badge>
              ) : (
                <Badge variant="warning">يبدأ قريباً • المنهج متاح للاستعراض</Badge>
              )}
            </div>
          </div>
        )}

        {/* Module selector tabs */}
        {modules.length > 0 && (
          <div className={styles.tabsWrapper}>
            <div className={styles.tabs}>
              {modules.map((mod, idx) => (
                <button
                  key={mod.moduleNumber || idx}
                  type="button"
                  className={`${styles.tabBtn} ${idx === activeModuleIndex ? styles['tabBtn--active'] : ''}`}
                  onClick={() => setActiveModuleIndex(idx)}
                >
                  <span className={styles.tabNumber}>المرحلة 0{mod.moduleNumber || idx + 1}</span>
                  <span className={styles.tabTitle}>{mod.title.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Module Details Card */}
        {currentModule && (
          <Card variant="elevated" padding="lg" className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.metaRow}>
                  <Badge variant="info">المرحلة {currentModule.moduleNumber}</Badge>
                  <Badge variant="neutral">
                    <Clock size={12} style={{ display: 'inline', marginLeft: 4 }} />
                    المدة: {currentModule.duration}
                  </Badge>
                </div>
                <h3 className={styles.detailTitle}>{currentModule.title}</h3>
              </div>
            </div>

            <div className={styles.detailGrid}>
              {/* Topics */}
              <div className={styles.topicsCol}>
                <h4 className={styles.colTitle}>
                  <Compass size={16} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
                  محاور التدريب والمهارات:
                </h4>
                <ul className={styles.topicsList}>
                  {currentModule.topics?.map((topic, i) => (
                    <li key={i} className={styles.topicItem}>
                      <span className={styles.checkIcon}>
                        <Check size={14} />
                      </span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Capstone Project */}
              <div className={styles.projectCol}>
                <div className={styles.projectCard}>
                  <span className={styles.projectBadge}>
                    <FolderGit2 size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
                    مشروع التسليم العملي
                  </span>
                  <h4 className={styles.projectTitle}>{currentModule.project}</h4>
                  <p className={styles.projectNote}>
                    يخضع لمراجعة الكود سطر بسطر 1:1 ودرجات تُسجل مباشرة على لوحة المتصدرين.
                  </p>
                  {isOpen ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenRegistration(currentCourse)}
                      className={styles.projectCta}
                    >
                      <span>سجل في هذا المسار الآن</span>
                      <ArrowLeft size={14} />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const front = courses.find((c) => c.slug === 'frontend-development');
                        if (front) onOpenRegistration(front);
                      }}
                      className={styles.projectCta}
                    >
                      <span>التسجيل يفتح قريباً (سجل في معسكر Front-End)</span>
                      <ArrowLeft size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
