import { useState } from 'react';
import styles from './FAQSection.module.css';

/**
 * FAQ list used for both UI rendering and FAQPage JSON-LD structured data.
 */
export const faqsData = [
  {
    question: 'هل المعسكرات مناسبة للمبتدئين بدون خلفية برمجية سابقة؟',
    answer:
      'نعم تماماً. نبدأ من الصفر في كل مسار (تطوير الويب، الذكاء الاصطناعي، تحليل البيانات، وضمان الجودة)، ونتدرج معك خطوة بخطوة بالتدريب العملي حتى الوصول للاحتراف.',
  },
  {
    question: 'كيف تتم مراجعة الكود البرمجي (Code Reviews) والواجبات؟',
    answer:
      'بعد كل مهمة برمجية ترفع كودك عبر GitHub؛ يقوم المدرب بمراجعة الكود سطر بسطر ووضع تقييم تفصيلي مع ملاحظات واضحة لتحسين معمارية الكود ونظافته.',
  },
  {
    question: 'ماذا لو فاتتني إحدى المحاضرات المباشرة؟',
    answer:
      'جميع المحاضرات تُسجل بدقة عالية وتتاح مباشرة على لوحة تحكم الطالب (Student Dashboard) بمشغل فيديو محمي لتتمكن من مراجعتها في أي وقت.',
  },
  {
    question: 'ما هي مواعيد المحاضرات والمدة الزمنية للمعسكرات؟',
    answer:
      'تتراوح المعسكرات بين 12 إلى 16 أسبوعاً بمعدل 3 محاضرات أسبوعياً في الفترة المسائية، لتناسب الطلاب والموظفين على حد سواء.',
  },
  {
    question: 'ما هي طرق الدفع المتاحة وهل يوجد تقسيط؟',
    answer:
      'نوفر الدفع عبر فودافون كاش، إنستاباي، والتحويلات البنكية المباشرة، مع إمكانية التقسيط الميسر على دفعتين لتسهيل الانضمام.',
  },
  {
    question: 'هل أحصل على شهادة إتمام معتمدة بعد التخرج؟',
    answer:
      'نعم، يحصل كل طالب أتم متطلبات المعسكر وسلم مشاريعه بنجاح على شهادة إتمام معتمدة بكود تحقق رقمي فريد ورابط جاهز للإضافة على LinkedIn.',
  },
];

/**
 * Interactive FAQ Accordion Section.
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tagline}>الأسئلة الشائعة</span>
          <h2 className={styles.title}>كل ما تحتاج معرفته قبل الانضمام</h2>
          <p className={styles.subtitle}>
            إجابات واضحة ومباشرة لأهم الأسئلة المتكررة من المتقدمين للأكاديمية.
          </p>
        </div>

        <div className={styles.accordion}>
          {faqsData.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`${styles.faqItem} ${isOpen ? styles['faqItem--open'] : ''}`}
              >
                <button
                  type="button"
                  className={styles.questionBtn}
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <span className={styles.arrowIcon}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className={styles.answerWrapper}>
                    <p className={styles.answerText}>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
