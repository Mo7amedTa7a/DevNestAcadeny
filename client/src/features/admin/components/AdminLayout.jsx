import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Megaphone,
  Users,
  Video,
  ClipboardCheck,
  FileQuestion,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { Logo, Badge, Button } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getCourseBySlug } from '@/features/landing/api/courses.api';
import { toggleCourseRegistration } from '../api/admin.api';
import styles from './AdminLayout.module.css';

/**
 * Admin Dashboard Shell Layout.
 * Features collapsible sidebar (mobile RTL slide-over drawer), top bar with registration quick-toggle, and user menu.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [isTogglingReg, setIsTogglingReg] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  });

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    getCourseBySlug('frontend-development')
      .then((data) => setCourse(data))
      .catch((err) => console.error('Failed to load course for admin layout', err));
  }, []);

  const handleToggleRegistration = async () => {
    if (!course?._id || isTogglingReg) return;
    setIsTogglingReg(true);
    try {
      const updated = await toggleCourseRegistration(course._id);
      setCourse(updated.course);
      addToast({
        type: 'success',
        message: updated.course.isRegistrationOpen
          ? 'تم فتح باب التسجيل للزوار بنجاح'
          : 'تم إغلاق باب التسجيل للزوار',
      });
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تغيير حالة التسجيل' });
    } finally {
      setIsTogglingReg(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast({ type: 'info', message: 'تم تسجيل الخروج بنجاح' });
    navigate('/login');
  };

  const navItems = [
    { label: 'نظرة عامة', path: '/admin', icon: <BarChart3 size={18} />, exact: true },
    { label: 'المسارات والإعلانات', path: '/admin/courses', icon: <Megaphone size={18} /> },
    { label: 'المتقدمين والمدفوعات', path: '/admin/applicants', icon: <Users size={18} /> },
    { label: 'إدارة المحاضرات (Drip)', path: '/admin/lessons', icon: <Video size={18} /> },
    { label: 'المهام ومراجعة الكود', path: '/admin/tasks', icon: <ClipboardCheck size={18} /> },
    { label: 'الاختبارات والكويزات', path: '/admin/exams', icon: <FileQuestion size={18} /> },
    { label: 'الطلاب وأكواد التفعيل', path: '/admin/students', icon: <GraduationCap size={18} /> },
  ];

  return (
    <>
      {/* Ensure Admin Dashboard is never indexed by Google */}
      <SEO title="DevNest Academy — لوحة تحكم الإدارة" noIndex={true} />

      <div className={styles.wrapper}>
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles['sidebar--collapsed']}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderBrand}>
              <Logo size="sm" showText={isSidebarOpen} />
              <Badge variant="warning" size="sm" className={styles.adminBadge}>
                Admin
              </Badge>
            </div>
            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              className={styles.mobileCloseBtn}
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X size={20} />
            </button>
          </div>

          {/* Admin User Info in Sidebar */}
          {isSidebarOpen && (
            <div className={styles.sidebarUserCard}>
              <div className={styles.sidebarAvatar}>
                {user?.fullName?.slice(0, 1) || 'A'}
              </div>
              <div className={styles.sidebarUserMeta}>
                <strong className={styles.sidebarUserName}>{user?.fullName || 'Admin'}</strong>
                <span className={styles.sidebarUserRole}>لوحة الإدارة</span>
              </div>
            </div>
          )}

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles['navLink--active'] : ''}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {isSidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.toggleSidebarBtn}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'طي القائمة' : 'توسيع القائمة'}
            >
              {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className={styles.mainContainer}>
          {/* Topbar */}
          <header className={styles.topbar}>
            <div className={styles.topbarStart}>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu size={20} />
              </button>
              <span className={styles.academyTag}>DevNest Control Center</span>
            </div>

            <div className={styles.topbarEnd}>
              {/* Quick Registration Status Toggle */}
              {course && (
                <div className={styles.regControl}>
                  <span className={styles.regLabel}>باب التسجيل:</span>
                  <button
                    type="button"
                    className={`${styles.regToggleBtn} ${
                      course.isRegistrationOpen ? styles['regToggleBtn--open'] : styles['regToggleBtn--closed']
                    }`}
                    onClick={handleToggleRegistration}
                    disabled={isTogglingReg}
                    title="انقر لتبديل حالة فتح/غلق التسجيل في المعسكر"
                  >
                    <span className={styles.toggleDot} />
                    <span>{course.isRegistrationOpen ? 'مفتوح للتقديم' : 'مغلق حالياً'}</span>
                  </button>
                </div>
              )}

              {/* User profile & Logout */}
              <div className={styles.userSection}>
                <span className={styles.userName}>{user?.fullName || 'Admin'}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
                  خروج
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content View */}
          <main className={styles.content}>
            <Outlet context={{ course }} />
          </main>
        </div>
      </div>
    </>
  );
}
