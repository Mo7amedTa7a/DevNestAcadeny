import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TracksSection from '../components/TracksSection';
import ValuePropSection from '../components/ValuePropSection';
import RoadmapSection from '../components/RoadmapSection';
import ProjectsShowcaseSection from '../components/ProjectsShowcaseSection';
import InstructorSection from '../components/InstructorSection';
import FAQSection, { faqsData } from '../components/FAQSection';
import Footer from '../components/Footer';
import RegistrationModal from '@/features/registration/components/RegistrationModal';
import { getCourses, getCourseBySlug, getActiveAnnouncement } from '../api/courses.api';

/**
 * Public Landing Page for DevNest Academy.
 * Showcases all 6 specialization engineering tracks:
 * (Front-End, Back-End, Full-Stack, AI & ML, Data Analysis, Software Testing)
 */
export default function LandingPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all active courses
    getCourses()
      .then((data) => {
        setCourses(data || []);
        if (data && data.length > 0) {
          // Default to the actively open Front-End Bootcamp
          const openCourse =
            data.find((c) => c.slug === 'frontend-development') ||
            data.find((c) => c.isRegistrationOpen) ||
            data[0];
          setSelectedCourse(openCourse);
        }
      })
      .catch((err) => {
        console.error('Failed to load courses list:', err);
      });

    // Fetch active hero announcement banner
    getActiveAnnouncement()
      .then((data) => {
        setAnnouncement(data);
      })
      .catch(() => {});
  }, []);

  // Check URL route for specific course
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/courses/')) {
      const slug = path.replace('/courses/', '');
      getCourseBySlug(slug)
        .then((c) => {
          setSelectedCourse(c);
        })
        .catch(() => {});
    }
  }, [location.pathname]);

  const handleOpenRegistration = (targetCourse = null) => {
    if (targetCourse?.slug) {
      navigate(`/register/${targetCourse.slug}`);
    } else if (selectedCourse?.slug) {
      navigate(`/register/${selectedCourse.slug}`);
    } else {
      navigate('/register');
    }
  };

  const handleSelectCourseForRoadmap = (targetCourse) => {
    // If targetCourse doesn't have roadmap array (summary view), fetch full details
    if (targetCourse.roadmap && targetCourse.roadmap.length > 0) {
      setSelectedCourse(targetCourse);
    } else {
      getCourseBySlug(targetCourse.slug)
        .then((fullCourse) => {
          setSelectedCourse(fullCourse);
        })
        .catch(() => {
          setSelectedCourse(targetCourse);
        });
    }
  };

  // Structured Data Schemas
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'DevNest Academy',
      url: 'https://devnest.academy',
      logo: 'https://devnest.academy/logo.png',
      description:
        'أكاديمية تدريب هندسي متخصصة في إعداد مهندسي البرمجيات والذكاء الاصطناعي لسوق العمل: Front-End, Back-End, Full-Stack, AI & ML, Data Analysis, Software Testing.',
      email: 'admissions@devnest.academy',
      sameAs: [
        'https://linkedin.com/company/devnest-academy',
        'https://github.com/devnest-academy',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqsData.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  const isRegistrationOpen = selectedCourse ? selectedCourse.isRegistrationOpen : true;

  return (
    <>
      <SEO
        title="DevNest Academy — معسكرات هندسة البرمجيات والذكاء الاصطناعي لسوق العمل"
        description="معسكرات تدريبية متخصصة خالية من الحشو النظري في: الواجهات الأمامية، الأنظمة الخلفية، الويب الشامل، الذكاء الاصطناعي، تحليل البيانات، واختبار البرمجيات مع مراجعات كود فردية 1:1."
        canonicalUrl="https://devnest.academy"
        schemas={schemas}
      />

      {/* Top Navbar */}
      <Navbar
        onOpenRegistration={() => handleOpenRegistration(selectedCourse)}
        isRegistrationOpen={isRegistrationOpen}
        cohortName={selectedCourse?.cohortName}
      />

      {/* Main Sections */}
      <main>
        {/* Hero Section */}
        <HeroSection
          announcement={announcement}
          courses={courses}
          onOpenRegistration={() => handleOpenRegistration(selectedCourse)}
          onOpenCourseRegistration={(slug) => {
            const target = courses.find((c) => c.slug === slug);
            handleOpenRegistration(target || selectedCourse);
          }}
          isRegistrationOpen={isRegistrationOpen}
          cohortName={selectedCourse?.cohortName}
        />

        {/* Tracks Section (All 6 Specializations) */}
        <TracksSection
          courses={courses}
          onSelectCourseForRegister={handleOpenRegistration}
          onSelectCourseForRoadmap={handleSelectCourseForRoadmap}
        />

        {/* Value Proposition */}
        <ValuePropSection />

        {/* Interactive Multi-Track Roadmap */}
        <RoadmapSection
          courses={courses}
          selectedCourse={selectedCourse}
          onSelectCourse={setSelectedCourse}
          onOpenRegistration={handleOpenRegistration}
          isRegistrationOpen={isRegistrationOpen}
        />

        {/* Real Projects Showcase */}
        <ProjectsShowcaseSection />

        {/* Mentors & Instructors */}
        <InstructorSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Global Footer */}
      <Footer
        onOpenRegistration={() => handleOpenRegistration(selectedCourse)}
        isRegistrationOpen={isRegistrationOpen}
      />

      {/* Registration Modal with Track Selector */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        courses={courses}
      />
    </>
  );
}
