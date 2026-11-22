import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, FolderGit2, Folder, Link2, Check } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import ProtectedVideoPlayer from '../components/ProtectedVideoPlayer';
import { getSecureLesson, getEnrolledCourseLessons, saveLessonProgress } from '../api/student.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import styles from './StudentLessonPlayerPage.module.css';

/**
 * Student Protected Video Player Page with Playlist & Resources.
 */
export default function StudentLessonPlayerPage() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [lessonData, setLessonData] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('desc'); // 'desc' | 'resources'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load lesson details
  const fetchLesson = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSecureLesson(lessonId);
      setLessonData(data);
      setIsCompleted(data.progress?.isCompleted || false);

      // Fetch playlist
      if (data.lesson?.courseId) {
        const lessons = await getEnrolledCourseLessons(data.lesson.courseId);
        setPlaylist(lessons);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تحميل المحاضرة أو أن المحاضرة غير منشورة بعد';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Periodic watch progress callback
  const handleProgress = useCallback(
    async ({ lastPositionSeconds, watchTimeSeconds }) => {
      try {
        await saveLessonProgress(lessonId, { lastPositionSeconds, watchTimeSeconds });
      } catch (err) {
        // Silent error for background progress saves
      }
    },
    [lessonId]
  );

  // Toggle Mark as Completed
  const handleToggleComplete = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);

    try {
      await saveLessonProgress(lessonId, { isCompleted: nextState });
      addToast({
        type: nextState ? 'success' : 'info',
        message: nextState ? 'تم تحديد المحاضرة كمكتملة بنجاح' : 'تم إلغاء اكتمال المحاضرة',
      });
      // Update playlist completion indicator
      setPlaylist((prev) =>
        prev.map((l) => (l._id === lessonId ? { ...l, isCompleted: nextState } : l))
      );
    } catch (err) {
      setIsCompleted(!nextState);
      addToast({ type: 'error', message: 'فشل تحديث حالة اكتمال المحاضرة' });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Skeleton variant="card" height="480px" />
        <Skeleton variant="card" height="180px" />
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <Card variant="flat" padding="lg" className={styles.errorCard}>
        <div className={styles.errorIcon}>
          <Lock size={40} />
        </div>
        <h2 className={styles.errorTitle}>المحتوى غير متاح</h2>
        <p className={styles.errorText}>{error || 'حدث خطأ أثناء تحميل المحاضرة.'}</p>
        <Link to="/student">
          <Button variant="primary" size="md">
            ← العودة للوحة التحكم
          </Button>
        </Link>
      </Card>
    );
  }

  const { lesson, videoToken, progress } = lessonData;

  return (
    <div className={styles.page}>
      {/* Top Breadcrumb & Navigation */}
      <div className={styles.breadcrumbBar}>
        <Link to="/student" className={styles.backLink}>
          ← العودة للوحة المحاضرات
        </Link>
        <Badge variant="info">{lesson.cohortName || 'دفعة شتاء 2026'}</Badge>
      </div>

      {/* Main Player & Playlist Grid */}
      <div className={styles.theaterGrid}>
        {/* Left Column: Player & Meta */}
        <div className={styles.playerColumn}>
          {/* Custom Protected Video Player */}
          <ProtectedVideoPlayer
            videoToken={videoToken}
            studentName={user?.fullName}
            studentCode={user?.studentCode}
            initialPosition={progress?.lastPositionSeconds || 0}
            onProgress={handleProgress}
          />

          {/* Action Row Under Player */}
          <div className={styles.actionRow}>
            <div className={styles.titleGroup}>
              <span className={styles.moduleName}>{lesson.moduleTitle}</span>
              <h1 className={styles.lessonTitle}>{lesson.title}</h1>
              <span className={styles.durationTag}>⏱ المدة: {lesson.duration}</span>
            </div>

            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="md"
              onClick={handleToggleComplete}
              className={styles.completeBtn}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              <span>{isCompleted ? 'مكتملة بنجاح' : 'تحديد كمكتملة'}</span>
            </Button>
          </div>

          {/* Tabs: Description vs Resources */}
          <Card variant="elevated" padding="lg" className={styles.tabsCard}>
            <div className={styles.tabHeaders}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'desc' ? styles['tabBtn--active'] : ''}`}
                onClick={() => setActiveTab('desc')}
              >
                الوصف والملاحظات
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'resources' ? styles['tabBtn--active'] : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                الملحقات والمستودعات ({lesson.resources?.length || 0})
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'desc' ? (
                <div className={styles.descBody}>
                  <p className={styles.descParagraph}>
                    {lesson.description ||
                      'في هذه المحاضرة نغطي الجوانب العملية والبرمجية وفق أحدث معايير الويب. يرجى مراجعة الكود البرمجي وتطبيق المشروع العملي المرفق في قسم الملحقات.'}
                  </p>
                </div>
              ) : (
                <div className={styles.resourcesBody}>
                  {lesson.resources && lesson.resources.length > 0 ? (
                    <div className={styles.resourcesList}>
                      {lesson.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.resourceItem}
                        >
                          <span className={styles.resIcon}>
                            {res.type === 'github' ? <FolderGit2 size={18} /> : res.type === 'drive' ? <Folder size={18} /> : <Link2 size={18} />}
                          </span>
                          <div className={styles.resInfo}>
                            <strong className={styles.resTitle}>{res.title}</strong>
                            <span className={styles.resUrl} dir="ltr">{res.url}</span>
                          </div>
                          <span className={styles.resArrow}>↗</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyResources}>لا توجد روابط ملحقات إضافية لهذه المحاضرة.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Playlist Sidebar */}
        <aside className={styles.playlistColumn}>
          <Card variant="elevated" padding="md" className={styles.playlistCard}>
            <div className={styles.playlistHeader}>
              <h2 className={styles.playlistTitle}>قائمة المحاضرات</h2>
              <span className={styles.playlistCount}>{playlist.length} محاضرة</span>
            </div>

            <div className={styles.playlistScroll}>
              {playlist.map((item) => {
                const isCurrent = item._id === lessonId;
                return (
                  <Link
                    key={item._id}
                    to={`/student/lessons/${item._id}`}
                    className={`${styles.playlistItem} ${isCurrent ? styles['playlistItem--active'] : ''}`}
                  >
                    <div className={styles.itemOrder}>
                      {item.isCompleted ? (
                        <span className={styles.completedMark}><Check size={14} /></span>
                      ) : (
                        <span>#{item.order}</span>
                      )}
                    </div>

                    <div className={styles.itemInfo}>
                      <strong className={styles.itemTitle}>{item.title}</strong>
                      <span className={styles.itemDuration}>⏱ {item.duration}</span>
                    </div>

                    {isCurrent && <span className={styles.currentIndicator}>▶</span>}
                  </Link>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
