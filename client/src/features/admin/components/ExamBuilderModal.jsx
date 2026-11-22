import { useState, useEffect } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { createAdminAssessment, updateAdminAssessment } from '../api/assessmentsAdmin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './ExamBuilderModal.module.css';

export default function ExamBuilderModal({
  isOpen,
  onClose,
  assessment,
  courseId,
  onSuccess,
}) {
  const { addToast } = useToast();

  const [type, setType] = useState('exam');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [strictAntiCheat, setStrictAntiCheat] = useState(true);
  const [maxViolations, setMaxViolations] = useState(3);
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (assessment) {
      setType(assessment.type || 'exam');
      setTitle(assessment.title || '');
      setDescription(assessment.description || '');
      setDurationMinutes(assessment.durationMinutes || 30);
      setPassingScore(assessment.passingScore || 70);
      setStrictAntiCheat(assessment.strictAntiCheat !== false);
      setMaxViolations(assessment.maxViolations || 3);
      setIsPublished(assessment.isPublished !== false);
      setQuestions(
        assessment.questions && assessment.questions.length > 0
          ? assessment.questions.map((q) => ({
              text: q.text || '',
              codeSnippet: q.codeSnippet || '',
              options: q.options?.length >= 2 ? [...q.options] : ['', '', '', ''],
              correctOptionIndex: q.correctOptionIndex ?? 0,
              points: q.points || 10,
              explanation: q.explanation || '',
            }))
          : [
              {
                text: '',
                codeSnippet: '',
                options: ['', '', '', ''],
                correctOptionIndex: 0,
                points: 10,
                explanation: '',
              },
            ]
      );
    } else {
      setType('exam');
      setTitle('');
      setDescription('');
      setDurationMinutes(30);
      setPassingScore(70);
      setStrictAntiCheat(true);
      setMaxViolations(3);
      setIsPublished(true);
      setQuestions([
        {
          text: '',
          codeSnippet: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 10,
          explanation: '',
        },
      ]);
    }
    setErrors({});
  }, [assessment, isOpen]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        codeSnippet: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 10,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      addToast({ type: 'warning', message: 'يجب أن يحتوي الاختبار على سؤال واحد على الأقل' });
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'عنوان الاختبار مطلوب';
    if (!description.trim()) errs.description = 'تعليمات الاختبار مطلوبة';
    if (durationMinutes < 1) errs.durationMinutes = 'مدة الاختبار غير صالحة';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        errs[`q_${i}`] = `نص السؤال رقم ${i + 1} مطلوب`;
        break;
      }
      const validOpts = q.options.filter((o) => o.trim().length > 0);
      if (validOpts.length < 2) {
        errs[`q_${i}`] = `السؤال رقم ${i + 1} يحتاج لخيارين على الأقل`;
        break;
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErr = Object.values(validationErrors)[0];
      addToast({ type: 'error', message: firstErr });
      return;
    }

    const payload = {
      courseId,
      type,
      title: title.trim(),
      description: description.trim(),
      durationMinutes: Number(durationMinutes),
      passingScore: Number(passingScore),
      strictAntiCheat,
      maxViolations: Number(maxViolations),
      isPublished,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        codeSnippet: q.codeSnippet.trim(),
        options: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
        correctOptionIndex: Number(q.correctOptionIndex),
        points: Number(q.points),
        explanation: q.explanation.trim(),
      })),
    };

    setIsSubmitting(true);
    try {
      if (assessment) {
        await updateAdminAssessment(assessment._id, payload);
        addToast({ type: 'success', message: 'تم تحديث الاختبار بنجاح' });
      } else {
        await createAdminAssessment(payload);
        addToast({ type: 'success', message: 'تم إنشاء الاختبار بنجاح' });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل حفظ الاختبار';
      addToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assessment ? `تعديل الاختبار: ${assessment.title}` : 'إنشاء اختبار نظري / كويز جديد'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Meta Row */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>نوع التقييم</label>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="exam">امتحان رسمي مراقب (Exam)</option>
              <option value="quiz">كويز سريع بعد المحاضرة (Quiz)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>عنوان الاختبار *</label>
            <Input
              type="text"
              placeholder="مثال: الاختبار النظري الشامل لمفاهيم React 19"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>تعليمات وتفاصيل الاختبار *</label>
          <textarea
            className={styles.textarea}
            rows={2}
            placeholder="تعليمات الاختبار، متطلبات الشاشة الكاملة، وإرشادات السلامة..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Configuration Row */}
        <div className={styles.grid4}>
          <div className={styles.field}>
            <label className={styles.label}>المدة بالدقائق</label>
            <Input
              type="number"
              min="1"
              max="180"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>نسبة النجاح %</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>حد إنذارات الغش</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={maxViolations}
              onChange={(e) => setMaxViolations(e.target.value)}
              disabled={!strictAntiCheat}
              required
            />
          </div>

          <div className={styles.togglesCol}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={strictAntiCheat}
                onChange={(e) => setStrictAntiCheat(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} />
                <span>تفعيل حراسة مكافحة الغش</span>
              </span>
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span>نشر الاختبار للطلاب</span>
            </label>
          </div>
        </div>

        {/* Question Editor Section */}
        <div className={styles.questionsHeader}>
          <div className={styles.questionsTitle}>
            <span>بنك الأسئلة</span>
            <Badge variant="primary" size="sm">
              {questions.length} أسئلة
            </Badge>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} />
            <span>إضافة سؤال</span>
          </Button>
        </div>

        <div className={styles.questionsList}>
          {questions.map((q, qIdx) => (
            <div key={qIdx} className={styles.questionCard}>
              <div className={styles.questionCardHeader}>
                <span className={styles.questionNumber}>السؤال #{qIdx + 1}</span>
                <div className={styles.qHeaderRight}>
                  <div className={styles.pointsInputBox}>
                    <label>الدرجة:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={q.points}
                      onChange={(e) => handleQuestionChange(qIdx, 'points', e.target.value)}
                      className={styles.pointsInput}
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className={styles.deleteQBtn}
                      onClick={() => handleRemoveQuestion(qIdx)}
                      title="حذف السؤال"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className={styles.field}>
                <Input
                  type="text"
                  placeholder="اكتب نص السؤال هنا..."
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIdx, 'text', e.target.value)}
                  required
                />
              </div>

              {/* Code Snippet (Optional) */}
              <div className={styles.field}>
                <textarea
                  className={styles.codeTextarea}
                  rows={2}
                  placeholder="// كود برمجي اختياري لعرضه مع السؤال (مثال: useState snippet)"
                  value={q.codeSnippet}
                  onChange={(e) => handleQuestionChange(qIdx, 'codeSnippet', e.target.value)}
                  dir="ltr"
                />
              </div>

              {/* Options & Correct Answer Radio */}
              <div className={styles.optionsGrid}>
                <span className={styles.optionsLabel}>
                  الخيارات (اختر الإجابة الصحيحة بالضغط على الدائرة):
                </span>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className={styles.optionRow}>
                    <input
                      type="radio"
                      name={`correct_q_${qIdx}`}
                      checked={q.correctOptionIndex === optIdx}
                      onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                      title="تحديد كإجابة صحيحة"
                    />
                    <Input
                      type="text"
                      placeholder={`الخيار ${optIdx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                      required={optIdx < 2}
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className={styles.field}>
                <Input
                  type="text"
                  placeholder="شرح وتوضيح الإجابة الصحيحة (يظهر للطالب بعد تسليم الاختبار)"
                  value={q.explanation}
                  onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {assessment ? 'حفظ تعديلات الاختبار' : 'إنشاء الاختبار'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
