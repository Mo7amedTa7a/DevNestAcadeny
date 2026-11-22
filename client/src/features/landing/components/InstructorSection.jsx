import { CheckCircle2 } from 'lucide-react';
import styles from './InstructorSection.module.css';

/**
 * Mentorship & Academic Leadership Section.
 * Uses clean Lucide React icons.
 */
export default function InstructorSection() {
  const highlights = [
    'خبرة عملية تتجاوز 6 سنوات في هندسة البرمجيات والأنظمة السحابية.',
    'نخبة من المهندسين الممارسين والمختصين في كل مسار (Web, AI, Data, QA).',
    'مراجعات كود فردية دقيقة 1:1 ودروس توجيه مباشر أسبوعياً.',
    'تأهيل مستمر وإعداد واقعي لمساعدتك في اجتياز المقابلات التقنية.',
  ];

  return (
    <section id="instructor" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Avatar / Shield box */}
          <div className={styles.avatarBox}>
            <div className={styles.avatarPlaceholder}>
              <span className={styles.codeIcon}>&lt;DN/&gt;</span>
            </div>
            <div className={styles.experienceBadge}>
              <strong>+6 سنوات</strong>
              <span>خبرة في سوق العمل</span>
            </div>
          </div>

          {/* Bio text */}
          <div className={styles.bioContent}>
            <span className={styles.tagline}>الإشراف الأكاديمي والتدريب</span>
            <h2 className={styles.name}>فريق الإشراف الهندسي المباشر</h2>
            <p className={styles.roleTitle}>Engineering Mentors & Tech Leads</p>

            <p className={styles.bioText}>
              في DevNest Academy، نؤمن بأن البرمجة الحقيقية تُكتسب بالممارسة وحل المشكلات وكتابة الكود والخطأ ثم التصحيح.
              هدفنا تمكينك من اكتساب عقلية المهندس المستقل القادر على البحث، وهندسة الحلول النظيفة، والعمل بكفاءة داخل فرق التطوير العالمية.
            </p>

            <div className={styles.highlightsList}>
              {highlights.map((h, i) => (
                <div key={i} className={styles.highlightItem}>
                  <CheckCircle2 size={16} className={styles.star} />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
