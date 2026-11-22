import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Calendar, Pencil, Trash2, Plus } from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import LessonModal from '../components/LessonModal';
import { getCourseLessons, togglePublishLesson, deleteLesson } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './AdminLessonsPage.module.css';

/**
 * Course Lessons & Drip Content Manager.
 */
export default function AdminLessonsPage() {
  const { course } = useOutletContext();
  const { addToast } = useToast();

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLessons = useCallback(async () => {
    if (!course?._id) return;
    setIsLoading(true);
    try {
      const data = await getCourseLessons(course._id);
      setLessons(data);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل قائمة المحاضرات' });
    } finally {
      setIsLoading(false);
    }
  }, [course?._id, addToast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleTogglePublish = async (lessonId) => {
    try {
      const updated = await togglePublishLesson(lessonId);
      addToast({
        type: 'success',
        message: updated.isPublished ? 'تم نشر المحاضرة للطلاب بنجاح' : 'تم إخفاء المحاضرة (مسودة)',
      });
      setLessons((prev) =>
        prev.map((l) => (l._id === lessonId ? { ...l, isPublished: updated.isPublished } : l))
      );
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تغيير حالة النشر' });
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المحاضرة نهائياً؟')) return;
    try {
      await deleteLesson(lessonId);
      addToast({ type: 'info', message: 'تم حذف المحاضرة' });
      setLessons((prev) => prev.filter((l) => l._id !== lessonId));
    } catch (err) {
      addToast({ type: 'error', message: 'فشل حذف المحاضرة' });
    }
  };

  const handleEdit = (lesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedLesson(null);
    setIsModalOpen(true);
  };

  // Group lessons by moduleTitle
  const modulesMap = {};
  lessons.forEach((lesson) => {
    const key = lesson.moduleTitle || 'عام';
    if (!modulesMap[key]) {
      modulesMap[key] = [];
    }
    modulesMap[key].push(lesson);
  });

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة المحاضرات وإطلاق المحتوى (Drip Release)</h1>
          <p className={styles.pageSubtitle}>
            إضافة وتعديل جلسات المعسكر وربطها بروابط يوتيوب المحمية، والتحكم بنشرها محاضرة بمحاضرة.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleAddNew} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          <span>إضافة محاضرة جديدة</span>
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.loadingStack}>
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
        </div>
      ) : Object.keys(modulesMap).length > 0 ? (
        <div className={styles.modulesStack}>
          {Object.entries(modulesMap).map(([moduleName, moduleLessons]) => (
            <Card key={moduleName} variant="elevated" padding="lg" className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <h2 className={styles.moduleTitle}>{moduleName}</h2>
                <Badge variant="neutral">{moduleLessons.length} محاضرة</Badge>
              </div>

              <div className={styles.lessonsList}>
                {moduleLessons.map((l) => (
                  <div
                    key={l._id}
                    className={`${styles.lessonRow} ${l.isPublished ? styles['lessonRow--published'] : ''}`}
                  >
                    <div className={styles.orderBadge}>#{l.order}</div>

                    <div className={styles.lessonMain}>
                      <strong className={styles.lessonTitle}>{l.title}</strong>
                      <div className={styles.metaRow}>
                        <span className={styles.metaItem} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          <span>{l.duration}</span>
                        </span>
                        <span className={styles.videoTag} dir="ltr">
                          YT ID: {l.youtubeVideoId}
                        </span>
                        {l.releaseDate && (
                          <span className={styles.releaseTag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} />
                            <span>موعد النشر: {new Date(l.releaseDate).toLocaleDateString('ar-EG')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.lessonActions}>
                      {/* Drip Publish Toggle Switch */}
                      <button
                        type="button"
                        className={`${styles.publishBtn} ${
                          l.isPublished ? styles['publishBtn--published'] : styles['publishBtn--draft']
                        }`}
                        onClick={() => handleTogglePublish(l._id)}
                        title="انقر لتبديل حالة النشر فوراً للطلاب"
                      >
                        <span className={styles.btnDot} />
                        <span>{l.isPublished ? 'منشورة الآن' : 'مسودة (مخفية)'}</span>
                      </button>

                      <Button variant="ghost" size="sm" onClick={() => handleEdit(l)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Pencil size={13} />
                        <span>تعديل</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(l._id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={13} />
                        <span>حذف</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="flat" padding="lg" className={styles.emptyCard}>
          <h3>لم تتم إضافة أي محاضرات لهذا الكورس بعد</h3>
          <p>اضغط على زر &quot;إضافة محاضرة جديدة&quot; لبدء إدخال المحاضرات وربطها بروابط يوتيوب.</p>
          <Button variant="primary" size="md" onClick={handleAddNew} style={{ marginTop: '16px' }}>
            + إضافة أول محاضرة الآن
          </Button>
        </Card>
      )}

      {/* Lesson Modal */}
      <LessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lesson={selectedLesson}
        courseId={course?._id}
        onSuccess={fetchLessons}
      />
    </div>
  );
}
