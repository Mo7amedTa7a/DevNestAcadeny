import { useState, useEffect } from 'react';
import {
  Plus,
  ShieldAlert,
  FileQuestion,
  Lock,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getCourseBySlug } from '@/features/landing/api/courses.api';
import { getAdminAssessments, deleteAdminAssessment } from '../api/assessmentsAdmin.api';
import ExamBuilderModal from '../components/ExamBuilderModal';
import ExamAttemptsDrawer from '../components/ExamAttemptsDrawer';
import styles from './AdminExamsPage.module.css';

export default function AdminExamsPage() {
  const { addToast } = useToast();

  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isAttemptsOpen, setIsAttemptsOpen] = useState(false);
  const [activeAssessmentForAttempts, setActiveAssessmentForAttempts] = useState(null);

  const fetchCourseAndAssessments = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseBySlug('frontend-development');
      setCourse(courseData);
      if (courseData?._id) {
        const list = await getAdminAssessments(courseData._id);
        setAssessments(list || []);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل بيانات الاختبارات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndAssessments();
  }, []);

  const handleOpenCreate = () => {
    setSelectedAssessment(null);
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (a) => {
    setSelectedAssessment(a);
    setIsBuilderOpen(true);
  };

  const handleOpenAttempts = (a) => {
    setActiveAssessmentForAttempts(a);
    setIsAttemptsOpen(true);
  };

  const handleDelete = async (a) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف اختبار "${a.title}"؟ سيتم حذف جميع محاولات ونتائج الطلاب المرتبطة به!`
      )
    ) {
      return;
    }

    try {
      await deleteAdminAssessment(a._id);
      addToast({ type: 'success', message: 'تم حذف الاختبار بنجاح' });
      setAssessments((prev) => prev.filter((item) => item._id !== a._id));
    } catch (err) {
      addToast({ type: 'error', message: 'فشل حذف الاختبار' });
    }
  };

  const totalExams = assessments.filter((a) => a.type === 'exam').length;
  const totalQuizzes = assessments.filter((a) => a.type === 'quiz').length;
  const totalAttempts = assessments.reduce(
    (acc, a) => acc + (a.attemptsSummary?.total || 0),
    0
  );
  const totalCheatLocks = assessments.reduce(
    (acc, a) => acc + (a.attemptsSummary?.auto_submitted_cheat || 0),
    0
  );

  return (
    <>
      <SEO title="إدارة الاختبارات ومكافحة الغش | DevNest Academy Admin" noIndex={true} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>إدارة الاختبارات النظرية ومكافحة الغش</h1>
            <p className={styles.subtitle}>
              بناء الامتحانات والكويزات، ضبط مؤقتات الإجابة، وحراسة الشاشة الكاملة ورصد محاولات الغش
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>إنشاء اختبار جديد</span>
          </Button>
        </div>

        {/* Stats Strip */}
        <div className={styles.statsStrip}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>إجمالي الاختبارات</span>
            <strong className={styles.statNumber}>{assessments.length}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>امتحانات رسمية (Exams)</span>
            <strong className={styles.statNumber}>{totalExams}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>كويزات سريعة (Quizzes)</span>
            <strong className={styles.statNumber}>{totalQuizzes}</strong>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>إجمالي محاولات الطلاب</span>
            <strong className={styles.statNumber}>{totalAttempts}</strong>
          </div>
          <div className={`${styles.statBox} ${styles['statBox--cheat']}`}>
            <span className={styles.statLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} />
              <span>حالات قفل الغش</span>
            </span>
            <strong className={styles.statNumber}>{totalCheatLocks}</strong>
          </div>
        </div>

        {/* Assessments List */}
        {loading ? (
          <div className={styles.loadingGrid}>
            <Skeleton variant="card" height="160px" />
            <Skeleton variant="card" height="160px" />
          </div>
        ) : assessments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileQuestion size={48} />
            </div>
            <h3>لا توجد اختبارات أو كويزات حالياً</h3>
            <p>أنشئ أول تقييم نظري لطلاب الدفعة</p>
            <Button variant="primary" onClick={handleOpenCreate}>
              إنشاء اختبار الآن
            </Button>
          </div>
        ) : (
          <div className={styles.assessmentList}>
            {assessments.map((a) => {
              const summary = a.attemptsSummary || {};

              return (
                <div key={a._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.headerBadges}>
                      <Badge variant={a.type === 'exam' ? 'primary' : 'neutral'}>
                        {a.type === 'exam' ? 'امتحان رسمي (Exam)' : 'كويز سريع (Quiz)'}
                      </Badge>
                      {a.strictAntiCheat && (
                        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} />
                          <span>حراسة الغش مفعلة</span>
                        </Badge>
                      )}
                      {a.isPublished ? (
                        <Badge variant="success">منشور</Badge>
                      ) : (
                        <Badge variant="neutral">مسودة</Badge>
                      )}
                    </div>

                    <div className={styles.durationPill}>
                      المدة: <strong>{a.durationMinutes}</strong> دقيقة
                    </div>
                  </div>

                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <p className={styles.cardDescription}>{a.description}</p>

                  <div className={styles.metaRow}>
                    <div className={styles.metaDetails}>
                      <span>عدد الأسئلة: <strong>{a.totalQuestions}</strong></span>
                      <span>نسبة النجاح: <strong>{a.passingScore}%</strong></span>
                      {a.strictAntiCheat && (
                        <span>حد الإنذارات: <strong>{a.maxViolations}</strong></span>
                      )}
                    </div>

                    <div className={styles.attemptsCounts}>
                      <span className={styles.attemptPill}>
                        إجمالي المحاولات: <strong>{summary.total || 0}</strong>
                      </span>
                      {summary.auto_submitted_cheat > 0 && (
                        <span className={`${styles.attemptPill} ${styles['attemptPill--cheat']}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={13} />
                          <span>قفل غش: <strong>{summary.auto_submitted_cheat}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button
                      variant={summary.total > 0 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleOpenAttempts(a)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Search size={14} />
                      <span>سجل المحاولات والتدقيق ({summary.total || 0})</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(a)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Pencil size={13} />
                      <span>تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a)}
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

        {/* Builder Modal */}
        <ExamBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          assessment={selectedAssessment}
          courseId={course?._id}
          onSuccess={fetchCourseAndAssessments}
        />

        {/* Attempts Drawer */}
        <ExamAttemptsDrawer
          isOpen={isAttemptsOpen}
          onClose={() => setIsAttemptsOpen(false)}
          assessmentId={activeAssessmentForAttempts?._id}
        />
      </div>
    </>
  );
}
