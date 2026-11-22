import { Code2, Trophy, Briefcase, Target } from 'lucide-react';
import { Card } from '@/components/ui';
import styles from './ValuePropSection.module.css';

/**
 * Concise, high-impact Value Proposition Section.
 * Uses clean Lucide React icons.
 */
export default function ValuePropSection() {
  const pillars = [
    {
      icon: <Code2 size={24} />,
      title: 'مراجعات كود فردية 1:1',
      description:
        'مراجعة مباشرة لأكوادك سطر بسطر عبر GitHub لتعليمك معايير Clean Code وهندسة البرمجيات المعمول بها في الشركات.',
    },
    {
      icon: <Trophy size={24} />,
      title: 'لوحة متصدرين وتنافس حي',
      description:
        'بيئة تفاعلية تتيح لك متابعة ترتيبك المباشر في دفعتك بناءً على إنجاز المهام والاختبارات الدورية لتحفيز مستمر.',
    },
    {
      icon: <Briefcase size={24} />,
      title: 'مشاريع حقيقية للبورتفوليو',
      description:
        'تبني تطبيقات متكاملة متصلة بقواعد بيانات و APIs حقيقية لتتخرج بمحفظة أعمال تثبت كفاءتك أمام مسؤولي التوظيف.',
    },
    {
      icon: <Target size={24} />,
      title: 'تأهيل وظيفي ومحاكاة مقابلات',
      description:
        'إعداد متكامل لملفات LinkedIn و GitHub، مع ورش عمل لمحاكاة المقابلات الفنية والتقنية لضمان جاهزيتك التامة.',
    },
  ];

  return (
    <section id="why-us" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tagline}>مميزات الأكاديمية</span>
          <h2 className={styles.title}>لماذا يختار الطموحون DevNest Academy؟</h2>
          <p className={styles.subtitle}>
            صممنا هذه المعسكرات لنقدم تجربة تدريبية عملية تركز على المهارات التي تطلبها الشركات التقنية.
          </p>
        </div>

        <div className={styles.grid}>
          {pillars.map((item, index) => (
            <Card key={index} variant="elevated" padding="lg" className={styles.card}>
              <div className={styles.iconBox}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
