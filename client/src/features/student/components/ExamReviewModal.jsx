import { ShieldAlert, CheckCircle2, XCircle, Check, X, Info } from 'lucide-react';
import { Modal, Badge, Button } from '@/components/ui';
import styles from './ExamReviewModal.module.css';

export default function ExamReviewModal({ isOpen, onClose, data, loading }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `مراجعة الإجابات: ${data.assessmentTitle}` : 'مراجعة الاختبار'}
      size="xl"
    >
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>جاري تحميل تفاصيل المراجعة...</div>
        ) : !data ? (
          <div className={styles.empty}>لا توجد بيانات متاحة للمراجعة</div>
        ) : (
          <>
            {/* Header Result Strip */}
            <div className={styles.resultStrip}>
              <div className={styles.resultItem}>
                <span>النتيجة النهائية:</span>
                <strong className={styles.scoreText}>
                  {data.score} / {data.totalPoints} ({data.percentage}%)
                </strong>
              </div>

              <div className={styles.resultItem}>
                <span>الحالة:</span>
                {data.status === 'auto_submitted_cheat' ? (
                  <Badge variant="danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={13} />
                    <span>قفل تلقائي (رصد غش)</span>
                  </Badge>
                ) : data.isPassed ? (
                  <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    <span>اجتياز بنجاح</span>
                  </Badge>
                ) : (
                  <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={13} />
                    <span>لم يتم الاجتياز</span>
                  </Badge>
                )}
              </div>

              {data.violationCount > 0 && (
                <div className={styles.resultItem}>
                  <span>الإنذارات المسجلة:</span>
                  <Badge variant="danger">{data.violationCount} مخالفات</Badge>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className={styles.questionsList}>
              {data.questions?.map((q, idx) => {
                const isCorrect = q.isCorrect;
                return (
                  <div
                    key={q._id}
                    className={`${styles.qCard} ${isCorrect ? styles['qCard--correct'] : styles['qCard--wrong']}`}
                  >
                    <div className={styles.qHeader}>
                      <span className={styles.qIndex}>السؤال #{idx + 1}</span>
                      <div className={styles.qStatus}>
                        {isCorrect ? (
                          <span className={styles.correctLabel}>+ {q.points} درجة (إجابة صحيحة)</span>
                        ) : (
                          <span className={styles.wrongLabel}>0 من {q.points} (إجابة خاطئة)</span>
                        )}
                      </div>
                    </div>

                    <h4 className={styles.qText}>{q.text}</h4>

                    {q.codeSnippet && (
                      <pre className={styles.codeSnippet} dir="ltr">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    <div className={styles.optionsList}>
                      {q.options?.map((opt, optIdx) => {
                        const isCorrectOption = optIdx === q.correctOptionIndex;
                        const isSelectedByStudent = optIdx === q.studentSelectedOptionIndex;

                        let optClass = styles.optionItem;
                        if (isCorrectOption) {
                          optClass += ` ${styles['optionItem--correct']}`;
                        } else if (isSelectedByStudent && !isCorrectOption) {
                          optClass += ` ${styles['optionItem--wrong']}`;
                        }

                        return (
                          <div key={optIdx} className={optClass}>
                            <div className={styles.optIndicator}>
                              {isCorrectOption ? <Check size={14} color="#10B981" /> : isSelectedByStudent ? <X size={14} color="#EF4444" /> : '○'}
                            </div>
                            <span className={styles.optText}>{opt}</span>
                            {isSelectedByStudent && (
                              <span className={styles.selectedTag}>إجابتك</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className={styles.explanationBox}>
                        <strong className={styles.explanationTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={15} />
                          <span>توضيح الإجابة:</span>
                        </strong>
                        <p className={styles.explanationText}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              <Button variant="primary" onClick={onClose}>
                إغلاق المراجعة
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
