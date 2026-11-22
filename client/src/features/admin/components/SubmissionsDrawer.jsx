import { useState, useEffect } from 'react';
import { FolderGit2, Folder, Search, Pencil } from 'lucide-react';
import { Modal, Badge, Button, Input } from '@/components/ui';
import { getTaskSubmissions, gradeStudentSubmission } from '../api/tasksAdmin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './SubmissionsDrawer.module.css';

export default function SubmissionsDrawer({ isOpen, onClose, taskId }) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, reviewed, needs_revision
  const [activeGradingId, setActiveGradingId] = useState(null);

  // Form states per submission
  const [gradingState, setGradingState] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const data = await getTaskSubmissions(taskId);
      setTaskData(data.task);
      setSubmissions(data.submissions || []);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل تسليمات الطلاب' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchData();
      setActiveGradingId(null);
      setFilter('all');
    }
  }, [isOpen, taskId]);

  const handleOpenGrading = (sub) => {
    setActiveGradingId(sub._id);
    setGradingState({
      score: sub.score !== null ? sub.score : taskData?.maxScore || 100,
      feedback: sub.feedback || '',
      status: sub.status === 'pending' ? 'reviewed' : sub.status,
    });
  };

  const handleSaveGrade = async (submissionId) => {
    const { score, feedback, status } = gradingState;
    if (score === undefined || score === '' || Number(score) < 0) {
      addToast({ type: 'error', message: 'يرجى إدخال درجة صالحة' });
      return;
    }
    if (Number(score) > (taskData?.maxScore || 100)) {
      addToast({
        type: 'error',
        message: `الدرجة لا يمكن أن تتجاوز الحد الأقصى (${taskData?.maxScore})`,
      });
      return;
    }
    if (!feedback.trim()) {
      addToast({ type: 'error', message: 'يرجى كتابة ملاحظات مراجعة الكود للطالب' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await gradeStudentSubmission(submissionId, {
        score: Number(score),
        feedback: feedback.trim(),
        status,
      });

      addToast({ type: 'success', message: 'تم حفظ التقييم وملاحظات الكود بنجاح' });
      setSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? updated : s))
      );
      setActiveGradingId(null);
    } catch (err) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'فشل حفظ التقييم',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <Badge variant="success">تم التقييم</Badge>;
      case 'needs_revision':
        return <Badge variant="warning">بحاجة لتعديل</Badge>;
      case 'pending':
      default:
        return <Badge variant="neutral">بانتظار المراجعة</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskData ? `تسليمات ومراجعة: ${taskData.title}` : 'تسليمات المهمة'}
      size="xl"
    >
      <div className={styles.container}>
        {/* Task Header Summary */}
        {taskData && (
          <div className={styles.taskMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>الدرجة القصوى:</span>
              <strong className={styles.metaValue}>{taskData.maxScore} درجة</strong>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>الموعد النهائي:</span>
              <span className={styles.metaValue}>
                {new Date(taskData.deadline).toLocaleString('ar-EG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>إجمالي التسليمات:</span>
              <Badge variant="primary">{submissions.length}</Badge>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('all')}
          >
            الكل ({submissions.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'pending' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('pending')}
          >
            بانتظار المراجعة ({submissions.filter((s) => s.status === 'pending').length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'reviewed' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('reviewed')}
          >
            تم التقييم ({submissions.filter((s) => s.status === 'reviewed').length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'needs_revision' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('needs_revision')}
          >
            بحاجة لتعديل ({submissions.filter((s) => s.status === 'needs_revision').length})
          </button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className={styles.loadingState}>جاري تحميل التسليمات...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className={styles.emptyState}>لا توجد تسليمات تطابق هذا التصنيف</div>
        ) : (
          <div className={styles.list}>
            {filteredSubmissions.map((sub) => {
              const isGrading = activeGradingId === sub._id;
              const student = sub.studentId || {};

              return (
                <div key={sub._id} className={styles.subCard}>
                  {/* Student & Submission Info */}
                  <div className={styles.subHeader}>
                    <div className={styles.studentInfo}>
                      <div className={styles.studentAvatar}>
                        {student.fullName ? student.fullName.slice(0, 1) : 'ط'}
                      </div>
                      <div>
                        <div className={styles.studentName}>{student.fullName || 'طالب'}</div>
                        <span className={styles.studentCode} dir="ltr">
                          {student.studentCode || 'DN-STUDENT'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.subHeaderRight}>
                      {getStatusBadge(sub.status)}
                      {sub.score !== null && (
                        <div className={styles.scorePill}>
                          <strong>{sub.score}</strong> / {taskData?.maxScore}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Link & Details */}
                  <div className={styles.linkSection}>
                    <div className={styles.linkLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {sub.linkType === 'github' ? (
                        <>
                          <FolderGit2 size={16} />
                          <span>مستودع GitHub:</span>
                        </>
                      ) : (
                        <>
                          <Folder size={16} />
                          <span>رابط Google Drive:</span>
                        </>
                      )}
                    </div>
                    <a
                      href={sub.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkUrl}
                      dir="ltr"
                    >
                      {sub.submissionUrl} ↗
                    </a>
                  </div>

                  {sub.notes && (
                    <div className={styles.studentNotes}>
                      <span className={styles.notesLabel}>ملاحظات الطالب:</span> {sub.notes}
                    </div>
                  )}

                  {/* Existing Review Info if not currently editing */}
                  {!isGrading && sub.feedback && (
                    <div className={styles.existingFeedback}>
                      <div className={styles.feedbackTitle}>
                        ملاحظات المراجع ({sub.reviewedBy?.fullName || 'المدرب'}):
                      </div>
                      <p className={styles.feedbackText}>{sub.feedback}</p>
                    </div>
                  )}

                  {/* Action or Grading Form */}
                  {!isGrading ? (
                    <div className={styles.subActions}>
                      <Button
                        size="sm"
                        variant={sub.status === 'pending' ? 'primary' : 'outline'}
                        onClick={() => handleOpenGrading(sub)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {sub.status === 'pending' ? (
                          <>
                            <Search size={14} />
                            <span>مراجعة وتقييم الكود</span>
                          </>
                        ) : (
                          <>
                            <Pencil size={14} />
                            <span>تعديل التقييم والملاحظات</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.gradingForm}>
                      <div className={styles.gradingTitle}>مراجعة وتقييم كود الطالب</div>

                      <div className={styles.gradingRow}>
                        <div className={styles.gradeInputCol}>
                          <label className={styles.formLabel}>الدرجة المستحقة (من {taskData?.maxScore})</label>
                          <Input
                            type="number"
                            min="0"
                            max={taskData?.maxScore || 100}
                            value={gradingState.score}
                            onChange={(e) =>
                              setGradingState({ ...gradingState, score: e.target.value })
                            }
                          />
                        </div>

                        <div className={styles.statusSelectCol}>
                          <label className={styles.formLabel}>حالة التسليم</label>
                          <select
                            className={styles.selectInput}
                            value={gradingState.status}
                            onChange={(e) =>
                              setGradingState({ ...gradingState, status: e.target.value })
                            }
                          >
                            <option value="reviewed">مقبول ومكتمل (Reviewed)</option>
                            <option value="needs_revision">بحاجة لتعديل (Needs Revision)</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.feedbackCol}>
                        <label className={styles.formLabel}>
                          ملاحظات كود الطالب والمراجعة الفنية (Code Review Feedback)
                        </label>
                        <textarea
                          className={styles.feedbackTextarea}
                          rows={4}
                          placeholder="اكتب ملاحظاتك التوجيهية، نقاط القوة، وأي تصحيحات معمارية مطلوبة..."
                          value={gradingState.feedback}
                          onChange={(e) =>
                            setGradingState({ ...gradingState, feedback: e.target.value })
                          }
                        />
                      </div>

                      <div className={styles.gradingButtons}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveGradingId(null)}
                          disabled={isSaving}
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveGrade(sub._id)}
                          isLoading={isSaving}
                        >
                          حفظ التقييم والملاحظات
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
