import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Lock, AlertTriangle } from 'lucide-react';
import { Modal, Badge, Button } from '@/components/ui';
import { getAssessmentAttempts } from '../api/assessmentsAdmin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './ExamAttemptsDrawer.module.css';

export default function ExamAttemptsDrawer({ isOpen, onClose, assessmentId }) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, passed, failed, cheat
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  const fetchAttempts = async () => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const data = await getAssessmentAttempts(assessmentId);
      setAssessmentData(data.assessment);
      setAttempts(data.attempts || []);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل سجل المحاولات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchAttempts();
      setFilter('all');
      setExpandedAttemptId(null);
    }
  }, [isOpen, assessmentId]);

  const filteredAttempts = attempts.filter((att) => {
    if (filter === 'all') return true;
    if (filter === 'cheat') return att.status === 'auto_submitted_cheat';
    if (filter === 'passed') return att.isPassed && att.status === 'submitted';
    if (filter === 'failed') return !att.isPassed && att.status === 'submitted';
    return true;
  });

  const getViolationName = (type) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'خروج من الشاشة الكاملة (Fullscreen Exit)';
      case 'tab_switch':
        return 'تبديل التبويب (Tab Switch / Hidden Window)';
      case 'blur':
        return 'فقدان تركيز المتصفح / فتح تطبيق آخر (Window Blur)';
      case 'devtools_open':
        return 'محاولة فتح أدوات المطور (DevTools)';
      default:
        return type;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assessmentData ? `سجل محاولات: ${assessmentData.title}` : 'سجل محاولات الاختبار'}
      size="xl"
    >
      <div className={styles.container}>
        {/* Header Stats */}
        {assessmentData && (
          <div className={styles.metaStrip}>
            <div className={styles.metaItem}>
              <span>النوع:</span>
              <Badge variant="primary">
                {assessmentData.type === 'quiz' ? 'كويز' : 'امتحان نظري'}
              </Badge>
            </div>
            <div className={styles.metaItem}>
              <span>المدة:</span>
              <strong>{assessmentData.durationMinutes} دقيقة</strong>
            </div>
            <div className={styles.metaItem}>
              <span>نسبة النجاح:</span>
              <strong>{assessmentData.passingScore}%</strong>
            </div>
            <div className={styles.metaItem}>
              <span>حراسة الغش:</span>
              <Badge variant={assessmentData.strictAntiCheat ? 'warning' : 'neutral'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {assessmentData.strictAntiCheat ? (
                  <>
                    <Lock size={12} />
                    <span>مفعلة</span>
                  </>
                ) : (
                  'معطلة'
                )}
              </Badge>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('all')}
          >
            الكل ({attempts.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'passed' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('passed')}
          >
            الناجحين ({attempts.filter((a) => a.isPassed && a.status === 'submitted').length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'failed' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('failed')}
          >
            لم يجتازوا ({attempts.filter((a) => !a.isPassed && a.status === 'submitted').length})
          </button>
          <button
            className={`${styles.filterBtn} ${styles['filterBtn--cheat']} ${filter === 'cheat' ? styles['filterBtn--active'] : ''}`}
            onClick={() => setFilter('cheat')}
          >
            محظور بالغش ({attempts.filter((a) => a.status === 'auto_submitted_cheat').length})
          </button>
        </div>

        {/* Attempts List */}
        {loading ? (
          <div className={styles.loadingState}>جاري تحميل سجل المحاولات...</div>
        ) : filteredAttempts.length === 0 ? (
          <div className={styles.emptyState}>لا توجد محاولات مسجلة تطابق الفلتر</div>
        ) : (
          <div className={styles.list}>
            {filteredAttempts.map((att) => {
              const student = att.studentId || {};
              const isCheat = att.status === 'auto_submitted_cheat';
              const isExpanded = expandedAttemptId === att._id;

              return (
                <div key={att._id} className={`${styles.attemptCard} ${isCheat ? styles['attemptCard--cheat'] : ''}`}>
                  <div className={styles.cardTop}>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        {student.fullName ? student.fullName.slice(0, 1) : 'ط'}
                      </div>
                      <div>
                        <div className={styles.studentName}>{student.fullName || 'طالب'}</div>
                        <span className={styles.studentCode} dir="ltr">
                          {student.studentCode || 'DN-STUDENT'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.scoreBox}>
                      <div className={styles.percentageText}>
                        <strong>{att.percentage}%</strong>
                      </div>
                      <span className={styles.pointsText}>
                        ({att.score} / {att.totalPoints} درجة)
                      </span>
                    </div>

                    <div className={styles.statusCol}>
                      {isCheat ? (
                        <Badge variant="danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={13} />
                          <span>قفل تلقائي (رصد غش)</span>
                        </Badge>
                      ) : att.isPassed ? (
                        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} />
                          <span>اجتاز الاختبار</span>
                        </Badge>
                      ) : (
                        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={13} />
                          <span>لم يجتز</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.dateMeta}>
                      <span>
                        تاريخ المحاولة:{' '}
                        {new Date(att.startedAt).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {att.violations && att.violations.length > 0 && (
                      <button
                        type="button"
                        className={styles.viewViolationsBtn}
                        onClick={() => setExpandedAttemptId(isExpanded ? null : att._id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <AlertTriangle size={14} />
                        <span>{isExpanded ? 'إخفاء' : 'عرض'} سجل الإنذارات ({att.violations.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Violations Audit Trail */}
                  {isExpanded && att.violations && att.violations.length > 0 && (
                    <div className={styles.violationsBox}>
                      <div className={styles.violationsTitle}>
                        سجل إنذارات مكافحة الغش الزمني (Anti-Cheat Audit Log):
                      </div>
                      <div className={styles.violationsTimeline}>
                        {att.violations.map((v, vIdx) => (
                          <div key={vIdx} className={styles.violationItem}>
                            <span className={styles.strikeBadge}>إنذار #{v.strikeNumber}</span>
                            <span className={styles.violationDesc}>{getViolationName(v.type)}</span>
                            <span className={styles.violationTime} dir="ltr">
                              {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
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
