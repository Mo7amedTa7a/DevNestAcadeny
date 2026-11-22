import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo, Button } from '@/components/ui';
import styles from './Navbar.module.css';

/**
 * Landing Page Navbar with brand logo, smooth navigation anchors, and CTA button.
 */
export default function Navbar({ onOpenRegistration, isRegistrationOpen, cohortName }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'المسارات الهندسية', href: '#tracks' },
    { label: 'عن الأكاديمية', href: '#why-us' },
    { label: 'المنهج الدراسي', href: '#roadmap' },
    { label: 'المشاريع', href: '#projects' },
    { label: 'المدرب', href: '#instructor' },
    { label: 'الأسئلة الشائعة', href: '#faq' },
  ];

  return (
    <header className={`${styles.header} ${isScrolled ? styles['header--scrolled'] : ''}`}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link to="/" className={styles.brandLink}>
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.navDesktop}>
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA Actions */}
        <div className={styles.actions}>
          <Link to="/login" className={styles.loginLink}>
            تسجيل الدخول
          </Link>

          {isRegistrationOpen && !mobileMenuOpen && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenRegistration}
              className={styles.ctaBtn}
            >
              <span>سجل الآن</span>
              <span className={styles.pulseDot} aria-hidden="true" />
            </Button>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.mobileBackdrop}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.mobileMenu}>
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className={styles.mobileActions}>
              <Link
                to="/login"
                className={styles.mobileLoginLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                تسجيل الدخول
              </Link>
              {isRegistrationOpen && (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRegistration();
                  }}
                  className={styles.mobileCtaBtn}
                >
                  <span className={styles.mobileCtaMainText}>سجل مقعدك الآن</span>
                  {cohortName && (
                    <span className={styles.cohortSubtext}>
                      {cohortName.length > 25 ? cohortName.slice(0, 25) + '...' : cohortName}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
