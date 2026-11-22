import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { createLesson, updateLesson } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './LessonModal.module.css';

/**
 * Add / Edit Lesson Modal.
 * Includes YouTube ID extraction helper from URL or raw ID.
 */
export default function LessonModal({ isOpen, onClose, lesson, courseId, onSuccess }) {
  const { addToast } = useToast();

  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleNumber, setModuleNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(1);
  const [videoInput, setVideoInput] = useState('');
  const [duration, setDuration] = useState('1:30:00');
  const [isPublished, setIsPublished] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lesson) {
      setModuleTitle(lesson.moduleTitle || '');
      setModuleNumber(lesson.moduleNumber || 1);
      setTitle(lesson.title || '');
      setOrder(lesson.order || 1);
      setVideoInput(lesson.youtubeVideoId || '');
      setDuration(lesson.duration || '1:30:00');
      setIsPublished(lesson.isPublished || false);
      setReleaseDate(lesson.releaseDate ? lesson.releaseDate.slice(0, 10) : '');
      setDescription(lesson.description || '');
    } else {
      setModuleTitle('');
      setModuleNumber(1);
      setTitle('');
      setOrder(1);
      setVideoInput('');
      setDuration('1:30:00');
      setIsPublished(false);
      setReleaseDate('');
      setDescription('');
    }
    setErrors({});
  }, [lesson, isOpen]);

  // Helper to extract YouTube Video ID if user pastes full URL
  const extractYouTubeId = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // Standard ID regex: 11 characters
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : trimmed;
  };

  const validate = () => {
    const errs = {};
    if (!moduleTitle.trim()) errs.moduleTitle = 'عنوان الموديل مطلوب';
    if (!title.trim()) errs.title = 'عنوان المحاضرة مطلوب';
    const parsedId = extractYouTubeId(videoInput);
    if (!parsedId) {
      errs.videoInput = 'يرجى إدخال معرف فيديو يوتيوب أو الرابط';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const parsedVideoId = extractYouTubeId(videoInput);

    const payload = {
      courseId,
      moduleTitle: moduleTitle.trim(),
      moduleNumber: Number(moduleNumber),
      title: title.trim(),
      order: Number(order),
      youtubeVideoId: parsedVideoId,
      duration: duration.trim(),
      isPublished,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      description: description.trim(),
    };

    try {
      if (lesson) {
        await updateLesson(lesson._id, payload);
        addToast({ type: 'success', message: 'تم تحديث المحاضرة بنجاح' });
      } else {
        await createLesson(payload);
        addToast({ type: 'success', message: 'تمت إضافة المحاضرة بنجاح' });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل حفظ المحاضرة';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lesson ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <Input
            label="رقم الموديل"
            type="number"
            value={moduleNumber}
            onChange={(e) => setModuleNumber(e.target.value)}
          />
          <Input
            label="عنوان الموديل *"
            placeholder="مثال: الموديل 01: أساسيات HTML5"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            error={errors.moduleTitle}
          />
        </div>

        <div className={styles.grid2}>
          <Input
            label="رقم/ترتيب المحاضرة *"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <Input
            label="مدة الفيديو التقريبية"
            placeholder="مثال: 1:45:00"
            dir="ltr"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <Input
          label="عنوان المحاضرة *"
          placeholder="مثال: المحاضرة 01: مقدمة في بنية الويب الحديث"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        {/* YouTube Video ID */}
        <Input
          label="معرف فيديو يوتيوب أو الرابط (YouTube Video ID) *"
          placeholder="مثال: dQw4w9WgXcQ أو https://youtu.be/..."
          dir="ltr"
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          error={errors.videoInput}
        />

        {/* Drip Release Controls */}
        <div className={styles.dripBox}>
          <label className={styles.publishToggle}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <div>
              <strong>نشر فوري للطلاب (isPublished)</strong>
              <p>عند التفعيل تظهر المحاضرة للطلاب المشتركين فوراً.</p>
            </div>
          </label>

          <Input
            label="تاريخ النشر المجدول (Release Date — اختياري)"
            type="date"
            dir="ltr"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="desc">وصف المحاضرة وملاحظات للطلاب</label>
          <textarea
            id="desc"
            className={styles.textarea}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button variant="primary" size="md" type="submit" loading={isSubmitting}>
            {lesson ? 'حفظ التعديلات' : 'إضافة المحاضرة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
