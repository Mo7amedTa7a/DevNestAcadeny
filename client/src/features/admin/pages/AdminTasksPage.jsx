import { useState, useEffect } from 'react';
import {
  Plus,
  ClipboardCheck,
  Download,
  Clock,
  CheckCircle2,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getCourseBySlug } from '@/features/landing/api/courses.api';
import { getAdminTasks, deleteAdminTask } from '../api/tasksAdmin.api';
import TaskModal from '../components/TaskModal';
import SubmissionsDrawer from '../components/SubmissionsDrawer';
import styles from './AdminTasksPage.module.css';

export default function AdminTasksPage() {
  const { addToast } = useToast();

  const [course, setCourse] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [activeTaskForSubmissions, setActiveTaskForSubmissions] = useState(null);

  const fetchCourseAndTasks = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseBySlug('frontend-development');
      setCourse(courseData);
      if (courseData?._id) {
        const taskList = await getAdminTasks(courseData._id);
        setTasks(taskList || []);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل بيانات المهام' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndTasks();
  }, []);

  const handleOpenCreate = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenSubmissions = (task) => {
    setActiveTaskForSubmissions(task);
    setIsSubmissionsOpen(true);
  };

  const handleDelete = async (task) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف مهمة "${task.title}"؟ سيتم حذف جميع تسليمات الطلاب المرتبطة بها!`
      )
    ) {
      return;
    }

    try {
      await deleteAdminTask(task._id);
      addToast({ type: 'success', message: 'تم حذف المهمة بنجاح' });
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    } catch (err) {
      addToast({ type: 'error', message: 'فشل حذف المهمة' });
    }
  };

  // Compute totals
  const totalSubmissions = tasks.reduce(
    (acc, t) => acc + (t.submissionsSummary?.total || 0),
    0
  );
  const totalPending = tasks.reduce(
    (acc, t) => acc + (t.submissionsSummary?.pending || 0),
    0
  );
  const totalReviewed = tasks.reduce(
    (acc, t) => acc + (t.submissionsSummary?.reviewed || 0),
    0
  );

  return (
    <>
      <SEO title="إدارة المهام ومراجعة الكود | DevNest Academy Admin" noIndex={true} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>إدارة المهام العملية ومراجعة الكود</h1>
            <p className={styles.subtitle}>
              إنشاء الواجبات البرمجية، تحديد المواعيد النهائية، وتقييم كود الطلاب مع التغذية الراجعة
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>إضافة مهمة جديدة</span>
          </Button>
        </div>

        {/* Stats Strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>إجمالي المهام</span>
            <strong className={styles.statNumber}>{tasks.length}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>إجمالي التسليمات</span>
            <strong className={styles.statNumber}>{totalSubmissions}</strong>
          </div>
          <div className={`${styles.statBox} ${styles['statBox--pending']}`}>
            <span className={styles.statLabel}>بانتظار المراجعة</span>
            <strong className={styles.statNumber}>{totalPending}</strong>
          </div>
          <div className={`${styles.statBox} ${styles['statBox--reviewed']}`}>
            <span className={styles.statLabel}>تم تقييمها</span>
            <strong className={styles.statNumber}>{totalReviewed}</strong>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className={styles.loadingGrid}>
            <Skeleton variant="card" height="160px" />
            <Skeleton variant="card" height="160px" />
            <Skeleton variant="card" height="160px" />
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ClipboardCheck size={48} />
            </div>
            <h3>لا توجد مهام منشأة حتى الآن</h3>
            <p>ابدأ بإنشاء أول مهمة عملية لطلاب الدفعة</p>
            <Button variant="primary" onClick={handleOpenCreate}>
              إنشاء مهمة الآن
            </Button>
          </div>
        ) : (
          <div className={styles.taskList}>
            {tasks.map((task) => {
              const summary = task.submissionsSummary || {};
              const isPast = new Date(task.deadline) < new Date();

              return (
                <div key={task._id} className={styles.taskCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.headerBadges}>
                      <Badge variant="primary" size="sm">
                        الوحدة {task.moduleNumber}
                        {task.moduleTitle ? `: ${task.moduleTitle}` : ''}
                      </Badge>
                      {task.isActive ? (
                        <Badge variant="success" size="sm">
                          مفعلة
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          معطلة
                        </Badge>
                      )}
                      {isPast ? (
                        <Badge variant="warning" size="sm">
                          انتهى موعد التسليم
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          التسليم متاح
                        </Badge>
                      )}
                    </div>

                    <div className={styles.scorePill}>
                      الدرجة القصوى: <strong>{task.maxScore}</strong>
                    </div>
                  </div>

                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <p className={styles.taskDescription}>{task.description}</p>

                  <div className={styles.metaRow}>
                    <div className={styles.deadlineInfo}>
                      <span className={styles.metaLabel}>الموعد النهائي:</span>
                      <span className={styles.metaDate}>
                        {new Date(task.deadline).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className={styles.submissionCounts}>
                      <span className={styles.subPill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={13} />
                        <span>إجمالي التسليمات: <strong>{summary.total || 0}</strong></span>
                      </span>
                      {summary.pending > 0 && (
                        <span className={`${styles.subPill} ${styles['subPill--pending']}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          <span>بانتظار المراجعة: <strong>{summary.pending}</strong></span>
                        </span>
                      )}
                      <span className={`${styles.subPill} ${styles['subPill--reviewed']}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} />
                        <span>مكتمل التقييم: <strong>{summary.reviewed || 0}</strong></span>
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant={summary.pending > 0 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleOpenSubmissions(task)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Search size={14} />
                      <span>عرض التسليمات ومراجعة الكود ({summary.total || 0})</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(task)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Pencil size={13} />
                      <span>تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>حذف</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={selectedTask}
          courseId={course?._id}
          onSuccess={fetchCourseAndTasks}
        />

        {/* Submissions Drawer */}
        <SubmissionsDrawer
          isOpen={isSubmissionsOpen}
          onClose={() => setIsSubmissionsOpen(false)}
          taskId={activeTaskForSubmissions?._id}
        />
      </div>
    </>
  );
}
