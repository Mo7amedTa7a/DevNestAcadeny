import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { TrendingUp, CheckCircle2, Trophy, ClipboardCheck, Check, Play, Clock } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import StatCard from '@/features/admin/components/StatCard';
import { getStudentDashboard } from '../api/student.api';
import styles from './StudentDashboardPage.module.css';

/**
 * Student Dashboard Overview Page.
 */
export default function StudentDashboardPage() {
  const { dashboardData, refreshDashboard } = useOutletContext();
  const [data, setData] = useState(dashboardData);
  const [isLoading, setIsLoading] = useState(!dashboardData);

  useEffect(() => {
    if (!dashboardData) {
      setIsLoading(true);
      getStudentDashboard()
        .then((res) => setData(res))
        .catch((err) => console.error('Failed to load dashboard', err))
        .finally(() => setIsLoading(false));
    } else {
      setData(dashboardData);
      setIsLoading(false);
    }
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className={styles.loadingStack}>
        <Skeleton variant="card" height="160px" />
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

  const { course, metrics, continueLesson, lessons } = data || {};

  return (
    <div className={styles.page}>
      {/* Hero Continue-Learning Card */}
      {continueLesson && (
        <Card variant="elevated" padding="lg" className={styles.continueCard}>
          <div className={styles.continueContent}>
            <div className={styles.continueBadgeRow}>
              <span className={styles.continueTag}>▶ استئناف المشاهدة</span>
              <span className={styles.moduleTag}>{continueLesson.moduleTitle}</span>
            </div>

            <h1 className={styles.continueTitle}>{continueLesson.title}</h1>
            <p className={styles.continueMeta} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>مدة المحاضرة: {continueLesson.duration || '1:30:00'} • الترتيب: المحاضرة رقم {continueLesson.order}</span>
            </p>

            <div className={styles.continueActions}>
              <Link to={`/student/lessons/${continueLesson._id}`}>
                <Button variant="primary" size="lg" className={styles.playBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={16} />
                  <span>مشاهدة المحاضرة الآن</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className={styles.continueGlow} aria-hidden="true" />
        </Card>
      )}

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="نسبة إنجاز الدورة"
          value={`${metrics?.progressPercentage || 0}%`}
          icon={<TrendingUp size={22} />}
          subtitle={`${metrics?.completedLessonsCount || 0} من ${metrics?.totalPublishedLessons || 0} محاضرة`}
          variant="primary"
        />
        <StatCard
          title="المحاضرات المكتملة"
          value={metrics?.completedLessonsCount || 0}
          icon={<CheckCircle2 size={22} />}
          subtitle="تم إنهاؤها بنجاح"
          variant="success"
        />
        <StatCard
          title="ترتيبك في الدفعة"
          value={`#${metrics?.cohortRank || 1}`}
          icon={<Trophy size={22} />}
          subtitle="بناءً على المهام والاختبارات"
          variant="brand"
        />
        <StatCard
          title="المهام القادمة"
          value="0"
          icon={<ClipboardCheck size={22} />}
          subtitle="لا توجد تسليمات معلقة"
          variant="accent"
        />
      </div>

      {/* Published Lessons Curriculum List */}
      <Card variant="elevated" padding="lg" className={styles.curriculumCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>المحاضرات المنشورة في الدورة</h2>
            <p className={styles.cardSubtitle}>
              المحاضرات المتاحة للمشاهدة بحسب جدول إطلاق المحتوى للدفعة.
            </p>
          </div>
          <Badge variant="info">{lessons?.length || 0} محاضرة متاحة</Badge>
        </div>

        {lessons && lessons.length > 0 ? (
          <div className={styles.lessonsList}>
            {lessons.map((lesson) => (
              <div
                key={lesson._id}
                className={`${styles.lessonItem} ${lesson.isCompleted ? styles['lessonItem--completed'] : ''}`}
              >
                <div className={styles.lessonMainContent}>
                  <div className={styles.lessonOrder}>
                    {lesson.isCompleted ? (
                      <span className={styles.checkDone}><Check size={16} /></span>
                    ) : (
                      <span>#{lesson.order}</span>
                    )}
                  </div>

                  <div className={styles.lessonInfo}>
                    <strong className={styles.lessonItemTitle}>{lesson.title}</strong>
                    <div className={styles.lessonItemMeta}>
                      <span className={styles.moduleBadge}>{lesson.moduleTitle}</span>
                      <span className={styles.durationBadge}>
                        <Clock size={12} />
                        <span>{lesson.duration}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.lessonActions}>
                  <Link to={`/student/lessons/${lesson._id}`} className={styles.lessonLink}>
                    <Button
                      variant={lesson.isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      className={styles.lessonBtn}
                    >
                      {lesson.isCompleted ? 'إعادة المشاهدة ↺' : 'بدء المشاهدة ▶'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>لم تُنشر أي محاضرات لهذا الكورس بعد. ترقب موعد الانطلاق!</p>
        )}
      </Card>
    </div>
  );
}
