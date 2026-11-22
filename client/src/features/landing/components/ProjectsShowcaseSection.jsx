import { ShoppingBag, Bot, BarChart3, CheckSquare } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import styles from './ProjectsShowcaseSection.module.css';

/**
 * Multi-Track Student Projects Showcase Section.
 * Uses clean Lucide React icons.
 */
export default function ProjectsShowcaseSection() {
  const projects = [
    {
      title: 'منصة تجارة إلكترونية متكاملة (DevNest Store)',
      tech: ['React 19', 'Node.js', 'Express', 'MongoDB', 'Stripe'],
      description: 'تطبيق ويب متكامل يضم تصفية المنتجات، سلة تسوق فورية، وإتمام عمليات الدفع والتوثيق الأمني.',
      tag: 'تطوير الويب الشامل',
      icon: <ShoppingBag size={24} />,
    },
    {
      title: 'وكيل ذكاء اصطناعي تفاعلي (RAG AI Agent)',
      tech: ['Python', 'LangChain', 'OpenAI', 'ChromaDB', 'FastAPI'],
      description: 'مساعد ذكي يسترجع المعلومات من المستندات المعقدة ويجيب بدقة استناداً إلى قواعد المعرفة المحلية.',
      tag: 'الذكاء الاصطناعي',
      icon: <Bot size={24} />,
    },
    {
      title: 'لوحة تحليلات وذكاء أعمال تفاعلية (BI Suite)',
      tech: ['Advanced SQL', 'Python Pandas', 'Power BI', 'ETL Pipeline'],
      description: 'تحليل متقدم لمبيعات وبيانات العملاء واستخراج مؤشرات الأداء الحيوية في لوحات تفاعلية فورية.',
      tag: 'تحليل البيانات',
      icon: <BarChart3 size={24} />,
    },
    {
      title: 'إطار فحص آلي متكامل للأنظمة (QA Automation)',
      tech: ['Cypress', 'Playwright', 'Postman API', 'CI/CD Pipelines'],
      description: 'جناح اختبار آلي يغطي سيناريوهات المستخدم الحقيقية، واختبار استجابة الـ APIs لضمان كفاءة الإطلاق.',
      tag: 'اختبار البرمجيات',
      icon: <CheckSquare size={24} />,
    },
  ];

  return (
    <section id="projects" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tagline}>محفظة الأعمال</span>
          <h2 className={styles.title}>مشاريع حقيقية تفخر بإضافتها لسيرتك الذاتية</h2>
          <p className={styles.subtitle}>
            لا نعتمد على مشاريع نمطية مكررة؛ بل تبني تطبيقات عملية كاملة تمنحك الثقة في المقابلات الوظيفية.
          </p>
        </div>

        <div className={styles.grid}>
          {projects.map((proj, idx) => (
            <Card key={idx} variant="elevated" padding="lg" className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.icon}>{proj.icon}</span>
                <Badge variant="info">{proj.tag}</Badge>
              </div>

              <h3 className={styles.projTitle}>{proj.title}</h3>
              <p className={styles.projDesc}>{proj.description}</p>

              <div className={styles.techStack}>
                {proj.tech.map((t, i) => (
                  <span key={i} className={styles.techBadge}>
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
