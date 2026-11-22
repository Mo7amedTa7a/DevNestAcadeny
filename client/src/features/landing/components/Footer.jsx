import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui';
import styles from './Footer.module.css';

/**
 * Global Landing Page Footer.
 */
export default function Footer({ onOpenRegistration, isRegistrationOpen }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topGrid}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Logo size="md" />
            <p className={styles.brandDesc}>
              أكاديمية برمجية متخصصة في تأهيل وإعداد مهندسي البرمجيات والذكاء الاصطناعي لسوق العمل الحقيقي
              عبر التدريب المكثف والتطبيق العملي ومراجعات الكود الفردية.
            </p>
            <div className={styles.badgeRow}>
              <span className={styles.tag}>#CleanCode</span>
              <span className={styles.tag}>#FullStack</span>
              <span className={styles.tag}>#AI_ML</span>
              <span className={styles.tag}>#DataAnalytics</span>
              <span className={styles.tag}>#QA_Testing</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>أقسام الأكاديمية</h4>
            <ul className={styles.linksList}>
              <li><a href="#tracks">المسارات الهندسية</a></li>
              <li><a href="#why-us">مميزات الأكاديمية</a></li>
              <li><a href="#roadmap">خريطة المناهج</a></li>
              <li><a href="#projects">مشاريع الطلاب</a></li>
              <li><a href="#faq">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          {/* Student Access & Enrollment */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>بوابة الطلاب</h4>
            <ul className={styles.linksList}>
              <li><Link to="/login">تسجيل الدخول بكود الطالب</Link></li>
              {isRegistrationOpen && (
                <li>
                  <button type="button" onClick={onOpenRegistration} className={styles.textBtn}>
                    التقديم في الدفعة الجديدة
                  </button>
                </li>
              )}
              <li>
                <a
                  href="https://wa.me/201014176434"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>واتساب الاستفسارات:</span>
                  <span dir="ltr" style={{ fontWeight: 700, color: '#10b981' }}>+20 101 417 6434</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            جميع الحقوق محفوظة © {new Date().getFullYear()} — <strong>DevNest Academy</strong>.
          </p>
          <div className={styles.legalLinks}>
            <span>سياسة الخصوصية والأمان</span>
            <span>•</span>
            <span>شروط الاستخدام</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
