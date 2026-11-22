import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  FileQuestion,
  Lock,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import {
  startAssessmentAttempt,
  logAntiCheatViolation,
  submitAssessmentAnswers,
} from '../api/assessments.api';
import styles from './StudentExamRoomPage.module.css';

export default function StudentExamRoomPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: selectedIndex }
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Anti-cheat state
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [strikeWarning, setStrikeWarning] = useState(null); // { type, strikeNumber }
  const [isLockedByCheat, setIsLockedByCheat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const attemptIdRef = useRef(null);
  const isTerminatedRef = useRef(false);
  const timerRef = useRef(null);
  const lastViolationTimeRef = useRef(0);

  // Initialize Exam Session
  useEffect(() => {
    let mounted = true;

    const initExam = async () => {
      try {
        setLoading(true);
        const data = await startAssessmentAttempt(assessmentId);

        if (!mounted) return;

        if (data.alreadyCompleted) {
          addToast({ type: 'info', message: 'تم خوض هذا الاختبار مسبقاً' });
          setIsExamCompleted(true);
          setFinalResult(data.attempt);
          return;
        }

        setExamData(data);
        attemptIdRef.current = data.attemptId;
        setRemainingSeconds(data.remainingSeconds || 0);
        setMaxViolations(data.maxViolations || 3);
        setViolationCount(data.violationCount || 0);

        // Prepopulate any saved answers
        if (data.savedAnswers && data.savedAnswers.length > 0) {
          const map = {};
          data.savedAnswers.forEach((ans) => {
            if (ans.selectedOptionIndex !== null) {
              map[ans.questionId] = ans.selectedOptionIndex;
            }
          });
          setSelectedAnswers(map);
        }

        // Request Fullscreen on strict exams
        if (data.strictAntiCheat) {
          try {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            }
          } catch (fsErr) {
            console.warn('Fullscreen request bypassed or denied', fsErr);
          }
        }
      } catch (err) {
        addToast({
          type: 'error',
          message: err.response?.data?.message || 'فشل بدء جلسة الاختبار',
        });
        navigate('/student/exams');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initExam();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  // Submit Exam handler
  const handleSubmitExam = useCallback(
    async (isAutoSubmit = false) => {
      if (isTerminatedRef.current || isSubmitting) return;
      isTerminatedRef.current = true;
      setIsSubmitting(true);

      const answersPayload = (examData?.questions || []).map((q) => ({
        questionId: q._id,
        selectedOptionIndex: selectedAnswers[q._id] ?? null,
      }));

      try {
        const result = await submitAssessmentAnswers(attemptIdRef.current, {
          answers: answersPayload,
        });

        setIsExamCompleted(true);
        setFinalResult(result);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        if (isAutoSubmit) {
          addToast({ type: 'warning', message: 'انتهى الوقت المحدد! تم تسليم الاختبار تلقائياً' });
        } else {
          addToast({ type: 'success', message: 'تم تسليم الاختبار بنجاح' });
        }
      } catch (err) {
        addToast({
          type: 'error',
          message: err.response?.data?.message || 'فشل تسليم الاختبار',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [examData, selectedAnswers, isSubmitting]
  );

  // Anti-Cheat Violation Trigger
  const triggerViolation = useCallback(
    async (type) => {
      if (isTerminatedRef.current || !attemptIdRef.current || !examData?.strictAntiCheat) {
        return;
      }

      // Debounce violations within 1.5s to prevent multiple events on one action
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1500) return;
      lastViolationTimeRef.current = now;

      try {
        const res = await logAntiCheatViolation(attemptIdRef.current, { type });

        setViolationCount(res.violationCount);

        if (res.locked) {
          isTerminatedRef.current = true;
          setIsLockedByCheat(true);
          setIsExamCompleted(true);
          setFinalResult({
            status: 'auto_submitted_cheat',
            violationCount: res.violationCount,
          });
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        } else {
          setStrikeWarning({
            type,
            strikeNumber: res.violationCount,
            maxViolations: res.maxViolations,
          });
        }
      } catch (err) {
        console.error('Failed to log violation', err);
      }
    },
    [examData]
  );

  // Setup Event Listeners for Anti-Cheat
  useEffect(() => {
    if (!examData?.strictAntiCheat || isExamCompleted || isLockedByCheat) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('blur');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isTerminatedRef.current) {
        triggerViolation('fullscreen_exit');
      }
    };

    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, PrintScreen, Ctrl+U
      if (
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        triggerViolation('devtools_open');
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleCopyPaste = (e) => e.preventDefault();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [examData, isExamCompleted, isLockedByCheat, triggerViolation]);

  // Synchronized countdown timer
  useEffect(() => {
    if (isExamCompleted || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isExamCompleted, remainingSeconds, handleSubmitExam]);

  // Option selection
  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Re-request fullscreen after dismissing warning
  const handleDismissWarning = async () => {
    setStrikeWarning(null);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      // Ignored
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Skeleton variant="card" width="480px" height="320px" />
        <p className={styles.loadingText}>جاري تهيئة بيئة الاختبار المشددة...</p>
      </div>
    );
  }

  // Completed or Cheat Locked View
  if (isExamCompleted || isLockedByCheat) {
    const isCheat = isLockedByCheat || finalResult?.status === 'auto_submitted_cheat';
    const isPassed = finalResult?.isPassed;

    return (
      <div className={styles.resultContainer}>
        <div className={`${styles.resultCard} ${isCheat ? styles['resultCard--cheat'] : ''}`}>
          <div className={styles.resultIcon}>
            {isCheat ? <ShieldAlert size={52} color="#EF4444" /> : isPassed ? <CheckCircle2 size={52} color="#10B981" /> : <FileQuestion size={52} color="#0077D7" />}
          </div>

          <h2 className={styles.resultTitle}>
            {isCheat
              ? 'تم قفل الاختبار وتسليمه تلقائياً (رصد غش)'
              : isPassed
              ? 'تهانينا! تم اجتياز الاختبار بنجاح'
              : 'تم تسليم الاختبار'}
          </h2>

          <p className={styles.resultSubtitle}>
            {isCheat
              ? 'تم تسجيل 3 مخالفات للشاشة الكاملة أو تبديل التبويبات. تم حفظ الإجابات المنجزة وتجميد التقييم.'
              : 'تم تصحيح إجاباتك على خوادم الأكاديمية بنجاح.'}
          </p>

          {finalResult && (
            <div className={styles.scoreBadgeBox}>
              <div className={styles.scoreRow}>
                <span>النسبة المئوية المحققة:</span>
                <strong className={styles.scoreHighlight}>
                  {finalResult.percentage ?? 0}%
                </strong>
              </div>
              <div className={styles.scoreRow}>
                <span>الدرجة المستحقة:</span>
                <strong>
                  {finalResult.score ?? 0} / {finalResult.totalPoints ?? 0}
                </strong>
              </div>
            </div>
          )}

          <div className={styles.resultActions}>
            <Button variant="primary" onClick={() => navigate('/student/exams')}>
              العودة لقائمة الاختبارات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const questions = examData?.questions || [];
  const currentQuestion = questions[currentQIndex] || {};
  const currentSelectedOpt = selectedAnswers[currentQuestion._id];
  const isTimeCritical = remainingSeconds <= 120; // Last 2 minutes

  return (
    <>
      <SEO title={`غرفة الاختبار: ${examData?.assessmentTitle || ''}`} noIndex={true} />

      <div className={styles.examRoomWrapper}>
        {/* Top Floating Security Control Bar */}
        <header className={styles.examHeader}>
          <div className={styles.headerRight}>
            <span className={styles.examTitle}>{examData?.assessmentTitle}</span>
            {examData?.strictAntiCheat && (
              <Badge variant="warning" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} />
                <span>مراقبة نشطة</span>
              </Badge>
            )}
          </div>

          <div className={styles.headerLeft}>
            {/* Strike Counter */}
            {examData?.strictAntiCheat && (
              <div className={`${styles.strikePill} ${violationCount > 0 ? styles['strikePill--active'] : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                <span>إنذارات الغش: <strong>{violationCount} / {maxViolations}</strong></span>
              </div>
            )}

            {/* Countdown Timer */}
            <div className={`${styles.timerBox} ${isTimeCritical ? styles['timerBox--critical'] : ''}`}>
              <span className={styles.timerIcon}><Clock size={16} /></span>
              <span className={styles.timerDigits}>{formatTimer(remainingSeconds)}</span>
            </div>
          </div>
        </header>

        {/* Question Content Area */}
        <main className={styles.mainContent}>
          {/* Progress Strip */}
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>
              السؤال <strong>{currentQIndex + 1}</strong> من {questions.length}
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className={styles.questionCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.questionText}>{currentQuestion.text}</h3>
              <Badge variant="primary" size="sm">
                {currentQuestion.points} درجات
              </Badge>
            </div>

            {/* Code Snippet if present */}
            {currentQuestion.codeSnippet && (
              <div className={styles.snippetBox} dir="ltr">
                <pre>
                  <code>{currentQuestion.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Options List */}
            <div className={styles.optionsList}>
              {currentQuestion.options?.map((option, optIdx) => {
                const isSelected = currentSelectedOpt === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    className={`${styles.optionBtn} ${isSelected ? styles['optionBtn--selected'] : ''}`}
                    onClick={() => handleSelectOption(currentQuestion._id, optIdx)}
                  >
                    <span className={styles.radioCircle}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.optionText}>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className={styles.navControls}>
            <Button
              variant="outline"
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
            >
              السؤال السابق
            </Button>

            {currentQIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                السؤال التالي
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من إنهاء وتسليم الاختبار؟')) {
                    handleSubmitExam(false);
                  }
                }}
                isLoading={isSubmitting}
              >
                إنهاء وتسليم الاختبار
              </Button>
            )}
          </div>

          {/* Question Quick-Jump Palette */}
          <div className={styles.paletteSection}>
            <span className={styles.paletteTitle}>خريطة الأسئلة:</span>
            <div className={styles.paletteGrid}>
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q._id] !== undefined;
                const isCurrent = idx === currentQIndex;
                let btnClass = styles.paletteBtn;
                if (isCurrent) btnClass += ` ${styles['paletteBtn--current']}`;
                else if (isAnswered) btnClass += ` ${styles['paletteBtn--answered']}`;

                return (
                  <button
                    key={q._id}
                    type="button"
                    className={btnClass}
                    onClick={() => setCurrentQIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Stern Strike Warning Modal */}
        {strikeWarning && (
          <div className={styles.strikeModalOverlay}>
            <div className={styles.strikeModalCard}>
              <div className={styles.strikeIcon}>
                <AlertTriangle size={48} color="#F59E0B" />
              </div>
              <h3 className={styles.strikeTitle}>تحذير أمني: تم رصد مخالفة غش!</h3>
              <p className={styles.strikeDesc}>
                تم رصد محاولة خروج من الشاشة الكاملة أو تبديل التبويب أو النقر خارج نافذة الامتحان.
              </p>
              <div className={styles.strikeCountPill}>
                إنذار رقم <strong>{strikeWarning.strikeNumber}</strong> من أصل {strikeWarning.maxViolations}
              </div>
              <p className={styles.strikeSubtext}>
                تنبيه: الوصول إلى الإنذار الثالث سيؤدي فورياً إلى قفل الاختبار وتسليمه بالحالة المحققة فقط.
              </p>
              <Button variant="primary" onClick={handleDismissWarning}>
                فهمت ذلك والعودة للشاشة الكاملة
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
