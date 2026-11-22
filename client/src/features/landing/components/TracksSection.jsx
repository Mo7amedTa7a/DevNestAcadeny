import { useState } from 'react';
import {
  Layout,
  Server,
  Globe,
  Bot,
  BarChart3,
  CheckSquare,
  Clock,
  Target,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import styles from './TracksSection.module.css';

const getTrackIcon = (slug) => {
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
      return <Layout size={24} />;
  }
};

// Strict tech stacks per user specification - No Next.js in any track!
const TRACK_TAGS = {
  'frontend-development': ['HTML5', 'CSS3', 'Bootstrap 5', 'JavaScript ES6+', 'React'],
  'backend-development': ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker & Redis'],
  'fullstack-development': ['HTML/CSS/Bootstrap', 'React', 'Node.js/Express', 'MongoDB', 'Docker & CI/CD'],
  'ai-machine-learning': ['Python', 'Deep Learning', 'PyTorch', 'LLMs & Agents', 'NLP'],
  'data-analysis': ['Advanced SQL', 'Python Pandas', 'Power BI', 'Data Modeling', 'Statistics'],
  'software-testing-qa': ['Manual Testing', 'Cypress Automation', 'Playwright', 'Postman API', 'Jira'],
};

const CATEGORIES = [
  { id: 'all', label: 'جميع المسارات' },
  { id: 'web', label: 'تطوير الويب' },
  { id: 'ai-data', label: 'الذكاء الاصطناعي والبيانات' },
  { id: 'qa', label: 'الجودة والاختبار' },
];

export default function TracksSection({ courses = [], onSelectCourseForRegister, onSelectCourseForRoadmap }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredCourses = courses.filter((c) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'web') {
      return ['frontend-development', 'backend-development', 'fullstack-development'].includes(c.slug);
    }
    if (activeCategory === 'ai-data') {
      return ['ai-machine-learning', 'data-analysis'].includes(c.slug);
    }
    if (activeCategory === 'qa') {
      return ['software-testing-qa'].includes(c.slug);
    }
    return true;
  });

  return (
    <section id="tracks" className={styles.section}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.tagline}>المسارات التدريبية المعتمدة</span>
          <h2 className={styles.title}>المسارات الهندسية ومناهجها</h2>
          <p className={styles.subtitle}>
            تفتح الأكاديمية أبوابها حالياً لمعسكر الواجهات الأمامية (Front-End)، بينما يمكنك استعراض مناهج ومحتويات باقي المسارات التي تنطلق قريباً.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className={styles.categoriesBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles['catBtn--active'] : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <div className={styles.grid}>
          {filteredCourses.map((course) => {
            const tags = TRACK_TAGS[course.slug] || ['Engineering', 'Coding'];
            const isOpen = course.isRegistrationOpen;

            return (
              <div
                key={course._id || course.slug}
                className={`${styles.trackCard} ${isOpen ? styles['trackCard--active'] : styles['trackCard--closed']}`}
              >
                {/* Card Top: Icon & Status */}
                <div className={styles.cardTop}>
                  <div className={styles.iconBadge}>
                    <span className={styles.icon}>{getTrackIcon(course.slug)}</span>
                  </div>
                  <div className={styles.statusBadge}>
                    {isOpen ? (
                      <Badge variant="success" size="sm">
                        التسجيل مفتوح الآن
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        يبدأ قريباً • قيد الإعداد
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Track Title */}
                <h3 className={styles.trackTitle}>{course.title}</h3>

                {/* Concise 1-2 sentence description */}
                <p className={styles.trackDescription}>
                  {course.shortDescription || 'تدريب عملي متكامل يؤهلك لسوق العمل مع مراجعة فردية لكل مشروع.'}
                </p>

                {/* Tech Stack Pills */}
                <div className={styles.tagsContainer}>
                  {tags.map((tag, idx) => (
                    <span key={idx} className={styles.techPill}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Card Meta: Duration & Cohort */}
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    <Clock size={14} className={styles.metaIcon} />
                    <strong>{course.duration}</strong>
                  </span>
                  <span className={styles.metaDivider}>•</span>
                  <span className={styles.metaItem}>
                    <Target size={14} className={styles.metaIcon} />
                    {isOpen ? 'الدفعة الأولى 2026' : 'قيد الإعداد'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className={styles.actions}>
                  {isOpen ? (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        className={styles.registerBtn}
                        onClick={() => onSelectCourseForRegister(course)}
                      >
                        <span>سجل في المسار</span>
                        <ArrowLeft size={14} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        className={styles.syllabusBtn}
                        onClick={() => {
                          onSelectCourseForRoadmap(course);
                          const el = document.getElementById('roadmap');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <span>عرض المنهج</span>
                        <ChevronDown size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="md"
                        className={styles.exploreBtn}
                        onClick={() => {
                          onSelectCourseForRoadmap(course);
                          const el = document.getElementById('roadmap');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <span>استعراض المحتوى والمنهج</span>
                        <ChevronDown size={14} />
                      </Button>
                      <button type="button" className={styles.closedBtn} disabled>
                        التسجيل يفتح قريباً
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
