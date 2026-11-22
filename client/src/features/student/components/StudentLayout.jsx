import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  Trophy,
  Menu,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Logo, Badge, Button } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getStudentDashboard } from '../api/student.api';
import styles from './StudentLayout.module.css';

/**
 * Student Portal Shell Layout.
 * Features dark/developer-friendly sidebar (mobile RTL slide-over drawer), student code badge, progress bar, and cohort rank.
 */
export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  });

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const fetchOverview = async () => {
    try {
      const data = await getStudentDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load student overview', err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleLogout = async () => {
    await logout();
    addToast({ type: 'info', message: 'تم تسجيل الخروج بنجاح' });
    navigate('/login');
  };

  const navItems = [
    { label: 'الرئيسية والمحاضرات', path: '/student', icon: <BookOpen size={18} />, exact: true },
    { label: 'المهام والواجبات', path: '/student/tasks', icon: <ClipboardCheck size={18} /> },
    { label: 'الاختبارات النظرية', path: '/student/exams', icon: <FileQuestion size={18} /> },
    { label: 'لوحة المتصدرين', path: '/student/leaderboard', icon: <Trophy size={18} /> },
  ];

  const progressPct = dashboardData?.metrics?.progressPercentage || 0;
  const cohortName = dashboardData?.enrollment?.cohortName || 'دفعة شتاء 2026';
  const continueLessonId = dashboardData?.continueLesson?._id;

  return (
    <>
      <SEO title="بوابة الطالب | DevNest Academy" noIndex={true} />

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
          {/* Header */}
          <div className={styles.sidebarHeader}>
            <Logo size="sm" showText={isSidebarOpen} />
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

          {/* Student Profile Card in Sidebar */}
          {isSidebarOpen && (
            <div className={styles.studentCard}>
              <div className={styles.studentAvatar}>
                {user?.fullName?.slice(0, 1) || 'ط'}
              </div>
              <div className={styles.studentMeta}>
                <strong className={styles.studentName}>{user?.fullName}</strong>
                <span className={styles.studentCode} dir="ltr">
                  {user?.studentCode || 'DN-STUDENT'}
                </span>
                <span className={styles.cohortTag}>{cohortName}</span>
              </div>
            </div>
          )}

          {/* Progress Widget */}
          {isSidebarOpen && (
            <div className={styles.progressWidget}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>تقدمك في الدورة</span>
                <strong className={styles.progressValue}>{progressPct}%</strong>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Links */}
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
                {isSidebarOpen && (
                  <div className={styles.navContent}>
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="neutral" size="sm" className={styles.soonBadge}>
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer toggle */}
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
              <div className={styles.welcomeBox}>
                <span className={styles.greeting}>مرحباً بك يا {user?.fullName?.split(' ')[0]}</span>
                <span className={styles.courseTitle}>
                  {dashboardData?.course?.title || 'معسكر تطوير الواجهات الأمامية'}
                </span>
              </div>
            </div>

            <div className={styles.topbarEnd}>
              {/* Cohort Live Rank Badge */}
              <div className={styles.rankBadge}>
                <span className={styles.rankIcon}><Trophy size={16} /></span>
                <span className={styles.rankText}>الترتيب: #1 بالدفعة</span>
              </div>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
                خروج
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className={styles.content}>
            <Outlet context={{ dashboardData, refreshDashboard: fetchOverview, continueLessonId }} />
          </main>
        </div>
      </div>
    </>
  );
}
