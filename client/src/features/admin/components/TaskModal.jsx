import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { createAdminTask, updateAdminTask } from '../api/tasksAdmin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './TaskModal.module.css';

export default function TaskModal({ isOpen, onClose, task, courseId, onSuccess }) {
  const { addToast } = useToast();

  const [moduleNumber, setModuleNumber] = useState(1);
  const [moduleTitle, setModuleTitle] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [allowedLinkTypes, setAllowedLinkTypes] = useState(['github', 'drive']);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setModuleNumber(task.moduleNumber || 1);
      setModuleTitle(task.moduleTitle || '');
      setTitle(task.title || '');
      setDescription(task.description || '');
      setRequirementsText(task.requirements?.join('\n') || '');
      // Format deadline for datetime-local: YYYY-MM-DDTHH:mm
      if (task.deadline) {
        const d = new Date(task.deadline);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDeadline(iso);
      } else {
        setDeadline('');
      }
      setMaxScore(task.maxScore || 100);
      setAllowedLinkTypes(task.allowedLinkTypes || ['github', 'drive']);
      setIsActive(task.isActive !== false);
    } else {
      setModuleNumber(1);
      setModuleTitle('');
      setTitle('');
      setDescription('');
      setRequirementsText('');
      // Default deadline: 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const iso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDeadline(iso);
      setMaxScore(100);
      setAllowedLinkTypes(['github', 'drive']);
      setIsActive(true);
    }
    setErrors({});
  }, [task, isOpen]);

  const toggleLinkType = (type) => {
    if (allowedLinkTypes.includes(type)) {
      if (allowedLinkTypes.length === 1) return; // Keep at least one
      setAllowedLinkTypes(allowedLinkTypes.filter((t) => t !== type));
    } else {
      setAllowedLinkTypes([...allowedLinkTypes, type]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'عنوان المهمة مطلوب';
    if (!description.trim()) errs.description = 'وصف وتفاصيل المهمة مطلوبة';
    if (!deadline) errs.deadline = 'الموعد النهائي للتسليم مطلوب';
    if (maxScore <= 0) errs.maxScore = 'الدرجة القصوى يجب أن تكون أكبر من صفر';
    if (allowedLinkTypes.length === 0) errs.allowedLinkTypes = 'يجب اختيار نوع رابط واحد على الأقل';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const requirements = requirementsText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const payload = {
      courseId,
      moduleNumber: Number(moduleNumber),
      moduleTitle: moduleTitle.trim(),
      title: title.trim(),
      description: description.trim(),
      requirements,
      deadline: new Date(deadline).toISOString(),
      maxScore: Number(maxScore),
      allowedLinkTypes,
      isActive,
    };

    setIsSubmitting(true);
    try {
      if (task) {
        await updateAdminTask(task._id, payload);
        addToast({ type: 'success', message: 'تم تحديث المهمة بنجاح' });
      } else {
        await createAdminTask(payload);
        addToast({ type: 'success', message: 'تم إنشاء المهمة بنجاح' });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل حفظ المهمة';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'تعديل المهمة العملية' : 'إضافة مهمة عملية جديدة'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>رقم الوحدة التعليمية</label>
            <Input
              type="number"
              min="1"
              value={moduleNumber}
              onChange={(e) => setModuleNumber(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>عنوان الوحدة (اختياري)</label>
            <Input
              type="text"
              placeholder="مثال: أساسيات React و Components"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>عنوان المهمة *</label>
          <Input
            type="text"
            placeholder="مثال: تطبيق متجر إلكتروني مصغر مع Cart State"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>وصف وشرح المهمة *</label>
          <textarea
            className={`${styles.textarea} ${errors.description ? styles['textarea--error'] : ''}`}
            rows={4}
            placeholder="اكتب تفاصيل المهمة والهدف التعليمي منها..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            متطلبات الإنجاز (كل متطلب في سطر مستقل)
          </label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="1. كتابة الكود باستخدام React Functional Components&#10;2. تطبيق CSS Modules للشاشات المتجاوبة&#10;3. رفع الكود على مستودع GitHub عام"
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>الموعد النهائي للتسليم (Deadline) *</label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              error={errors.deadline}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>الدرجة القصوى (Max Score) *</label>
            <Input
              type="number"
              min="1"
              max="1000"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              error={errors.maxScore}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>الروابط المسموح للطلاب بتسليمها</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={allowedLinkTypes.includes('github')}
                onChange={() => toggleLinkType('github')}
              />
              <span>مستودع GitHub (كود المصدر)</span>
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={allowedLinkTypes.includes('drive')}
                onChange={() => toggleLinkType('drive')}
              />
              <span>Google Drive (مجلد / ملف مضغوط)</span>
            </label>
          </div>
          {errors.allowedLinkTypes && (
            <span className={styles.errorText}>{errors.allowedLinkTypes}</span>
          )}
        </div>

        <div className={styles.checkboxRow}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>المهمة مفعلة ومتاحة للطلاب</span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {task ? 'حفظ التعديلات' : 'إنشاء المهمة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
