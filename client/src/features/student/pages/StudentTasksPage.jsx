import { useState, useEffect } from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Pencil,
  Send,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getStudentTasks } from '../api/tasks.api';
import TaskSubmissionModal from '../components/TaskSubmissionModal';
import TaskFeedbackModal from '../components/TaskFeedbackModal';
import styles from './StudentTasksPage.module.css';

export default function StudentTasksPage() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [canAccessTasks, setCanAccessTasks] = useState(true);
  const [cohortName, setCohortName] = useState('');
  const [tasks, setTasks] = useState([]);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getStudentTasks();
      setCanAccessTasks(data.canAccessTasks);
      setCohortName(data.cohortName || '');
      setTasks(data.tasks || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setCanAccessTasks(false);
      } else {
        addToast({ type: 'error', message: 'فشل تحميل المهام العملية' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenSubmit = (task) => {
    setActiveTask(task);
    setIsSubmitModalOpen(true);
  };

  const handleOpenFeedback = (task) => {
    setActiveTask(task);
    setIsFeedbackModalOpen(true);
  };

  // Calculate student statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.submission?.status === 'reviewed').length;
  const pendingTasks = tasks.filter((t) => t.submission?.status === 'pending').length;
  const totalPointsEarned = tasks.reduce(
    (acc, t) => acc + (t.submission?.score || 0),
    0
  );

  return (
    <>
      <SEO title="المهام والواجبات العملية | DevNest Academy" noIndex={true} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>المهام والواجبات العملية</h1>
            <p className={styles.subtitle}>
              تطبيقات حقيقية ومشاريع برمجية خاضعة للمراجعة المباشرة لكودك من قِبل مهندسي DevNest
            </p>
          </div>
          {cohortName && (
            <Badge variant="primary" size="md">
              {cohortName}
            </Badge>
          )}
        </div>

        {/* Tier Lock Gate */}
        {!canAccessTasks ? (
          <div className={styles.lockedContainer}>
            <div className={styles.lockIcon}>
              <Lock size={44} />
            </div>
            <h3 className={styles.lockTitle}>هذه الميزة متاحة حصرياً لطلاب الدفعة التفاعلية (Cohort)</h3>
            <p className={styles.lockText}>
              باقتك الحالية مفعلة للوصول إلى المحاضرات المسجلة فقط. تسليم المهام العملية والحصول على مراجعة الكود (Code Review) ودخول لوحة المتصدرين متاحة فقط لاشتراكات الدفعة التفاعلية.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Summary Strip */}
            <div className={styles.statsStrip}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>إجمالي المهام</span>
                <strong className={styles.statNumber}>{totalTasks}</strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>مهام تم تقييمها</span>
                <strong className={`${styles.statNumber} ${styles['statNumber--success']}`}>
                  {completedTasks}
                </strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>قيد المراجعة</span>
                <strong className={`${styles.statNumber} ${styles['statNumber--pending']}`}>
                  {pendingTasks}
                </strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>مجموع النقاط المحققة</span>
                <strong className={`${styles.statNumber} ${styles['statNumber--accent']}`}>
                  {totalPointsEarned}
                </strong>
              </div>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className={styles.loadingList}>
                <Skeleton variant="card" height="180px" />
                <Skeleton variant="card" height="180px" />
              </div>
            ) : tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Sparkles size={48} />
                </div>
                <h3>لا توجد مهام منشورة حالياً</h3>
                <p>سيتم نشر المهام البرمجية تباعاً مع المحاضرات التدريبية</p>
              </div>
            ) : (
              <div className={styles.taskList}>
                {tasks.map((task) => {
                  const sub = task.submission;
                  const isReviewed = sub?.status === 'reviewed';
                  const isNeedsRevision = sub?.status === 'needs_revision';
                  const isPending = sub?.status === 'pending';
                  const isPast = task.isPastDeadline;

                  return (
                    <div key={task._id} className={styles.taskCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.headerBadges}>
                          <Badge variant="primary" size="sm">
                            الوحدة {task.moduleNumber}
                            {task.moduleTitle ? `: ${task.moduleTitle}` : ''}
                          </Badge>

                          {/* Submission Status Badges */}
                          {isReviewed && (
                            <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} />
                              <span>تم التقييم ({sub.score} / {task.maxScore})</span>
                            </Badge>
                          )}
                          {isNeedsRevision && (
                            <Badge variant="warning" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={13} />
                              <span>بحاجة لتعديل ({sub.score !== null ? sub.score : 0} / {task.maxScore})</span>
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="neutral" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} />
                              <span>قيد المراجعة</span>
                            </Badge>
                          )}
                          {!sub && isPast && (
                            <Badge variant="danger" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} />
                              <span>فات موعد التسليم</span>
                            </Badge>
                          )}
                          {!sub && !isPast && (
                            <Badge variant="neutral" size="sm">
                              لم يتم التسليم بعد
                            </Badge>
                          )}
                        </div>

                        <div className={styles.scorePill}>
                          الدرجة القصوى: <strong>{task.maxScore}</strong>
                        </div>
                      </div>

                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      <p className={styles.taskDescription}>{task.description}</p>

                      {/* Requirements Checklist */}
                      {task.requirements && task.requirements.length > 0 && (
                        <div className={styles.requirementsBox}>
                          <span className={styles.reqTitle}>متطلبات الإنجاز:</span>
                          <ul className={styles.reqList}>
                            {task.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={styles.metaRow}>
                        <div className={styles.deadlineInfo}>
                          <span className={styles.metaLabel}>الموعد النهائي:</span>
                          <span className={`${styles.metaDate} ${isPast ? styles['metaDate--past'] : ''}`}>
                            {new Date(task.deadline).toLocaleString('ar-EG', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        {sub && (
                          <div className={styles.submissionInfo}>
                            <span>تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className={styles.cardActions}>
                        {/* Feedback view button */}
                        {(isReviewed || isNeedsRevision) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenFeedback(task)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={14} />
                            <span>عرض تقييم وملاحظات المدرب</span>
                          </Button>
                        )}

                        {/* Submit or Resubmit button */}
                        {!isReviewed && (
                          <Button
                            variant={sub ? 'ghost' : 'primary'}
                            size="sm"
                            onClick={() => handleOpenSubmit(task)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {sub ? (
                              <>
                                <Pencil size={14} />
                                <span>تعديل رابط التسليم</span>
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                <span>تسليم الحل</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Submission Modal */}
        <TaskSubmissionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          task={activeTask}
          onSuccess={fetchTasks}
        />

        {/* Feedback Modal */}
        <TaskFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          task={activeTask}
          onResubmit={handleOpenSubmit}
        />
      </div>
    </>
  );
}
