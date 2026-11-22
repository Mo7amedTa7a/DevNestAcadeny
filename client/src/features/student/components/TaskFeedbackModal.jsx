import { RotateCcw } from 'lucide-react';
import { Modal, Badge, Button } from '@/components/ui';
import styles from './TaskFeedbackModal.module.css';

export default function TaskFeedbackModal({ isOpen, onClose, task, onResubmit }) {
  if (!task || !task.submission) return null;

  const sub = task.submission;
  const isNeedsRevision = sub.status === 'needs_revision';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`مراجعة الكود: ${task.title}`}
      size="md"
    >
      <div className={styles.container}>
        {/* Score Pill Banner */}
        <div className={styles.scoreBanner}>
          <div className={styles.scoreInfo}>
            <span className={styles.scoreLabel}>درجة التقييم:</span>
            <div className={styles.scoreNumber}>
              <strong>{sub.score !== null ? sub.score : '-'}</strong> / {task.maxScore}
            </div>
          </div>
          <div className={styles.statusBadge}>
            {isNeedsRevision ? (
              <Badge variant="warning">بحاجة لتعديل</Badge>
            ) : (
              <Badge variant="success">تم التقييم بنجاح</Badge>
            )}
          </div>
        </div>

        {/* Reviewer & Meta */}
        <div className={styles.metaRow}>
          <span>المراجع: <strong>{sub.reviewedBy || 'المدرب الفني'}</strong></span>
          {sub.reviewedAt && (
            <span>
              تاريخ المراجعة:{' '}
              {new Date(sub.reviewedAt).toLocaleDateString('ar-EG', {
                dateStyle: 'medium',
              })}
            </span>
          )}
        </div>

        {/* Feedback Body */}
        <div className={styles.feedbackBox}>
          <h4 className={styles.feedbackTitle}>ملاحظات وتوجيهات الكود (Code Review):</h4>
          <p className={styles.feedbackText}>{sub.feedback || 'لا توجد ملاحظات إضافية.'}</p>
        </div>

        {/* Link Submitted */}
        <div className={styles.submittedLinkBox}>
          <span className={styles.submittedLabel}>رابط الحل المسلم:</span>
          <a
            href={sub.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.submittedLink}
            dir="ltr"
          >
            {sub.submissionUrl} ↗
          </a>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {isNeedsRevision && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onResubmit?.(task);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={15} />
              <span>تعديل الكود وإعادة التسليم</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
