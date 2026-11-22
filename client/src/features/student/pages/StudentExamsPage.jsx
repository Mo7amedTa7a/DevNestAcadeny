import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  FileQuestion,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  Play,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getStudentAssessments, getAttemptReview } from '../api/assessments.api';
import ExamReviewModal from '../components/ExamReviewModal';
import styles from './StudentExamsPage.module.css';

export default function StudentExamsPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [canAccessExams, setCanAccessExams] = useState(true);
  const [cohortName, setCohortName] = useState('');
  const [assessments, setAssessments] = useState([]);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await getStudentAssessments();
      setCanAccessExams(data.canAccessExams);
      setCohortName(data.cohortName || '');
      setAssessments(data.assessments || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setCanAccessExams(false);
      } else {
        addToast({ type: 'error', message: 'فشل تحميل الاختبارات' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleStartExam = (assessment) => {
    if (assessment.strictAntiCheat) {
      const confirmed = window.confirm(
        `تنبيه أمني هام:\n\nهذا الاختبار خاضع للحراسة المشددة ضد الغش.\n1. سيعمل في وضع الشاشة الكاملة (Fullscreen).\n2. الخروج من الشاشة الكاملة أو تبديل التبويب أو النقر خارج المتصفح يسجل مخالفة غش فورية.\n3. عند تسجيل 3 مخالفات، يُقفل الاختبار نهائياً ويُسلم تلقائياً.\n\nهل أنت مستعد لبدء الاختبار الآن؟`
      );
      if (!confirmed) return;
    }
    navigate(`/student/exams/${assessment._id}/room`);
  };

  const handleOpenReview = async (attemptId) => {
    setLoadingReview(true);
    setIsReviewOpen(true);
    try {
      const data = await getAttemptReview(attemptId);
      setReviewData(data);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل مراجعة الإجابات' });
      setIsReviewOpen(false);
    } finally {
      setLoadingReview(false);
    }
  };

  // Stats calculation
  const totalAssessments = assessments.length;
  const completedAttempts = assessments.filter((a) => a.myAttempt && a.myAttempt.status !== 'in_progress');
  const passedCount = completedAttempts.filter((a) => a.myAttempt.isPassed).length;

  return (
    <>
      <SEO title="الاختبارات النظرية والكويزات | DevNest Academy" noIndex={true} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>الاختبارات النظرية والكويزات</h1>
            <p className={styles.subtitle}>
              تقييمات دورية لقياس الفهم العميق للمفاهيم الهندسية، مع حراسة مشددة ونزاهة أكاديمية كاملة
            </p>
          </div>
          {cohortName && (
            <Badge variant="primary" size="md">
              {cohortName}
            </Badge>
          )}
        </div>

        {/* Tier Gate Lock */}
        {!canAccessExams ? (
          <div className={styles.lockedContainer}>
            <div className={styles.lockIcon}>
              <Lock size={44} />
            </div>
            <h3 className={styles.lockTitle}>هذه الميزة متاحة حصرياً لطلاب الدفعة التفاعلية (Cohort)</h3>
            <p className={styles.lockText}>
              باقتك الحالية مفعلة للوصول إلى المحاضرات المسجلة فقط. الاختبارات النظرية الرسمية وشهادات إتمام الدفعة متاحة لطلاب الدفعة التفاعلية.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Summary Strip */}
            <div className={styles.statsStrip}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>إجمالي الاختبارات</span>
                <strong className={styles.statNumber}>{totalAssessments}</strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>اختبارات تم خوضها</span>
                <strong className={styles.statNumber}>{completedAttempts.length}</strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>تم اجتيازها بنجاح</span>
                <strong className={`${styles.statNumber} ${styles['statNumber--success']}`}>
                  {passedCount}
                </strong>
              </div>
            </div>

            {/* Assessment Cards */}
            {loading ? (
              <div className={styles.loadingList}>
                <Skeleton variant="card" height="180px" />
                <Skeleton variant="card" height="180px" />
              </div>
            ) : assessments.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FileQuestion size={48} />
                </div>
                <h3>لا توجد اختبارات منشورة حالياً</h3>
                <p>سيتم جدولة ونشر الاختبارات والكويزات بالتزامن مع المحاضرات</p>
              </div>
            ) : (
              <div className={styles.list}>
                {assessments.map((a) => {
                  const att = a.myAttempt;
                  const isCompleted = att && att.status !== 'in_progress';
                  const isCheat = att && att.status === 'auto_submitted_cheat';
                  const isPassed = att && att.isPassed;

                  return (
                    <div key={a._id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div className={styles.headerBadges}>
                          <Badge variant={a.type === 'exam' ? 'primary' : 'neutral'} size="sm">
                            {a.type === 'exam' ? 'امتحان رسمي (Exam)' : 'كويز سريع (Quiz)'}
                          </Badge>
                          {a.strictAntiCheat && (
                            <Badge variant="warning" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Lock size={12} />
                              <span>مراقبة ضد الغش مفعلة</span>
                            </Badge>
                          )}
                          {isCheat && (
                            <Badge variant="danger" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={12} />
                              <span>قفل تلقائي لرصد غش</span>
                            </Badge>
                          )}
                          {!isCheat && isCompleted && isPassed && (
                            <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              <span>اجتزت الاختبار ({att.percentage}%)</span>
                            </Badge>
                          )}
                          {!isCheat && isCompleted && !isPassed && (
                            <Badge variant="warning" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} />
                              <span>لم تجتز ({att.percentage}%)</span>
                            </Badge>
                          )}
                        </div>

                        <div className={styles.durationBadge}>
                          المدة: <strong>{a.durationMinutes}</strong> دقيقة
                        </div>
                      </div>

                      <h3 className={styles.cardTitle}>{a.title}</h3>
                      <p className={styles.cardDescription}>{a.description}</p>

                      <div className={styles.metaRow}>
                        <div className={styles.metaInfo}>
                          <span>عدد الأسئلة: <strong>{a.totalQuestions}</strong></span>
                          <span>نسبة النجاح: <strong>{a.passingScore}%</strong></span>
                          {a.strictAntiCheat && (
                            <span>حد المخالفات: <strong>{a.maxViolations} إنذارات</strong></span>
                          )}
                        </div>

                        {att && (
                          <div className={styles.resultPill}>
                            النتيجة: <strong>{att.score} / {att.totalPoints}</strong> ({att.percentage}%)
                          </div>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        {isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReview(att.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={14} />
                            <span>مراجعة الأسئلة والإجابات</span>
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartExam(a)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Play size={14} />
                            <span>بدء الاختبار الآن</span>
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

        {/* Review Modal */}
        <ExamReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          data={reviewData}
          loading={loadingReview}
        />
      </div>
    </>
  );
}
