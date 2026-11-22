import { useState, useEffect } from 'react';
import { Info, FolderGit2, Folder } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { submitStudentTask } from '../api/tasks.api';
import { useToast } from '@/components/ui/Toast';
import styles from './TaskSubmissionModal.module.css';

const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/;
const DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/(drive|document|file|folderview|open)\?.*|^https:\/\/(drive|docs)\.google\.com\/(drive\/folders|file\/d|document\/d)\/[a-zA-Z0-9_-]+.*$/;

export default function TaskSubmissionModal({ isOpen, onClose, task, onSuccess }) {
  const { addToast } = useToast();

  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [detectedType, setDetectedType] = useState(null); // 'github' | 'drive' | null
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task?.submission) {
      setUrl(task.submission.submissionUrl || '');
      setNotes(task.submission.notes || '');
    } else {
      setUrl('');
      setNotes('');
    }
    setError('');
    setDetectedType(null);
  }, [task, isOpen]);

  // URL input handler with link detection
  const handleUrlChange = (val) => {
    setUrl(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setDetectedType(null);
      setError('');
      return;
    }

    if (GITHUB_REGEX.test(trimmed)) {
      setDetectedType('github');
      setError('');
    } else if (DRIVE_REGEX.test(trimmed)) {
      setDetectedType('drive');
      setError('');
    } else {
      setDetectedType(null);
      setError('يجب أن يكون الرابط مستودع GitHub عام أو رابط Google Drive متاح للعرض (HTTPS فقط)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('يرجى إدخال رابط تسليم المهمة');
      return;
    }

    if (!GITHUB_REGEX.test(trimmedUrl) && !DRIVE_REGEX.test(trimmedUrl)) {
      setError('الرابط غير صالح. يرجى التأكد من إدخال رابط GitHub أو Google Drive يبدأ بـ https://');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitStudentTask(task._id, {
        submissionUrl: trimmedUrl,
        notes: notes.trim(),
      });

      addToast({
        type: 'success',
        message: 'تم إرسال المهمة بنجاح وبانتظار مراجعة المدرب',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل إرسال المهمة';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task?.submission ? `تعديل تسليم: ${task?.title}` : `تسليم مهمة: ${task?.title}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.notice} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} />
          <div><strong>تنبيه الأمان:</strong> يُقبل فقط روابط مستودعات GitHub العامة أو روابط Google Drive المفتوحة للمشاهدة بدون صلاحيات خاصة.</div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>رابط المشروع (GitHub أو Google Drive) *</label>
            {detectedType && (
              <span className={styles.detectedBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {detectedType === 'github' ? (
                  <>
                    <FolderGit2 size={13} />
                    <span>مستودع GitHub</span>
                  </>
                ) : (
                  <>
                    <Folder size={13} />
                    <span>مجلد Google Drive</span>
                  </>
                )}
              </span>
            )}
          </div>
          <Input
            type="url"
            placeholder="https://github.com/username/project-repo"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            error={error}
            dir="ltr"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>ملاحظات للمدرب أو تعليمات التشغيل (اختياري)</label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="مثال: تم إنجاز المهام المطلوبة بالإضافة لتطبيق بونص التصميم المتجاوب..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!url || !!error}
          >
            {task?.submission ? 'إعادة الإرسال للمراجعة' : 'تأكيد إرسال المهمة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
