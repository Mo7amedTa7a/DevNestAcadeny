const { connectDB } = require('../config/db');
const Course = require('../modules/courses/courses.model');

/**
 * Seed flagship Front-End Development Course.
 * Run with: node src/scripts/seedCourse.js
 */
const seedCourse = async () => {
  try {
    await connectDB();

    const existingCourse = await Course.findOne({ slug: 'frontend-development' });

    if (existingCourse) {
      console.log(`⚠️ Course already exists: ${existingCourse.title} (${existingCourse._id})`);
      process.exit(0);
    }

    const course = await Course.create({
      title: 'معسكر تطوير الواجهات الأمامية الشامل (Front-End Development Bootcamp)',
      slug: 'frontend-development',
      shortDescription: 'احترف بناء تطبيقات الويب الحديثة من الصفر حتى React 19 وسوق العمل مع متابعة عملية ومشاريع حقيقية.',
      description: `معسكر تدريبي مكثف مصمم لإعدادك لسوق العمل الحقيقي كمهندس واجهات أمامية محترف. 
لا نعتمد على الحشو النظري؛ بل نركز بنسبة 100% على التطبيق العملي وبناء مشاريع كاملة وكتابة كود نظيف وتفاعلي وفق أحدث معايير الشركات العالمية.`,
      level: 'من الصفر حتى الجاهزية لسوق العمل',
      duration: '12 أسبوعاً (36 محاضرة تفاعلية مكثفة)',
      price: 3500,
      currency: 'EGP',
      isRegistrationOpen: true,
      cohortName: 'دفعة شتاء 2026 (Cohort 01)',
      startDate: new Date('2026-12-15'),
      roadmap: [
        {
          moduleNumber: 1,
          title: 'أساسيات الويب الحديث وهيكلة المحتوى (HTML5 & Modern CSS3)',
          duration: 'أسبوعان',
          topics: [
            'هيكلة صفحات الويب الدلالية (Semantic HTML5) ومعايير SEO و Accessibility',
            'أنظمة التخطيط المتقدمة: Flexbox و CSS Grid مع التصميم المتجاوب الكامل (Responsive Design)',
            'التأثيرات الحركية المتقدمة (CSS Animations, Transitions & Custom Properties)',
            'أفضل ممارسات كتابة CSS احترافي وتجهيز واجهات المستخدم للشاشات المختلفة',
          ],
          project: 'تصميم وبناء موقع بورتفوليو شخصي تفاعلي كامل ومتجاوب مع جميع الأجهزة.',
        },
        {
          moduleNumber: 2,
          title: 'لغة الويب المتقدمة والمنطق البرمجي (Modern JavaScript ES6+)',
          duration: '3 أسابيع',
          topics: [
            'الأساسيات البرمجية المتقدمة: Scope, Closures, Hoisting & Execution Context',
            'ميزات ES6+ الحديثة: Destructuring, Spread/Rest, Modules, Arrow Functions',
            'البرمجة غير المتزامنة (Asynchronous JS): Promises, Async/Await & Event Loop',
            'التعامل الاحترافي مع APIs عبر Fetch و Axios وإدارة أخطاء الشبكة',
            'التفاعل المباشر مع واجهة المتصفح (DOM Manipulation & Custom Events)',
          ],
          project: 'تطبيق إدارة مهام ولوحة تحكم طقس متصلة بـ Live REST APIs مع حفظ محلي.',
        },
        {
          moduleNumber: 3,
          title: 'أنظمة التحكم بالنسخ والعمل الجماعي (Git & GitHub Workflows)',
          duration: 'أسبوع واحد',
          topics: [
            'أوامر Git الأساسية والمتقدمة وتتبع تغييرات الأكواد البرمجية',
            'إدارة الفروع (Branching Strategies) ودمج الأكواد وحل التعارضات (Merge Conflicts)',
            'مراجعة الأكواد (Pull Requests & Code Reviews) كما يحدث في بيئة الشركات الحقيقية',
            'أتمتة النشر واستضافة المشاريع مباشرة عبر GitHub Pages و Vercel',
          ],
          project: 'المساهمة في مستودع برمجي جماعي ومحاكاة مراجعة الكود في بيئة عمل واقعية.',
        },
        {
          moduleNumber: 4,
          title: 'بناء الواجهات التفاعلية الضخمة (React 19 Ecosystem)',
          duration: '4 أسابيع',
          topics: [
            'فلسفة React ومفهوم المكونات (Components, Props & State Architecture)',
            'إتقان React Hooks: useState, useEffect, useRef, useMemo, useCallback',
            'إدارة الحالة العامة (Global State Management) عبر Context API و Redux Toolkit / Zustand',
            'نظام التوجيه المتقدم مع React Router DOM v6+ وتأمين المسارات المحمية',
            'تحسين أداء التطبيقات: Code-Splitting, Lazy Loading & Memoization',
          ],
          project: 'متجر إلكتروني متكامل (E-Commerce Store) بسلة تسوق ديناميكية وتصفية متقدمة للمنتجات.',
        },
        {
          moduleNumber: 5,
          title: 'تسريع وتنسيق الواجهات الاحترافية (Tailwind CSS & Design Systems)',
          duration: 'أسبوع واحد',
          topics: [
            'فلسفة Utility-First CSS وكتابة واجهات سريعة ونظيفة عبر Tailwind CSS',
            'تخصيص الـ Themes ونظام الألوان الموحد والوضع الليلي (Dark Mode)',
            'بناء مكتبة مكونات قابلة لإعادة الاستخدام (Reusable Component Architecture)',
          ],
          project: 'لوحة تحكم SaaS تفاعلية تدعم الوضع الليلي والنهاري ومخططات بيانية.',
        },
        {
          moduleNumber: 6,
          title: 'مشروع التخرج النهائي والإعداد لسوق العمل (Capstone Project & Career)',
          duration: 'أسبوع واحد',
          topics: [
            'تخطيط وتنفيذ مشروع تخرج فردي ضخم متصل بـ Full REST Backend',
            'إجراء اختبارات الأداء وتطبيق معايير Core Web Vitals و SEO',
            'تحسين السيرة الذاتية (CV) ومستودعات GitHub وحساب LinkedIn للمطورين',
            'محاكاة المقابلات الفنية (Technical Mock Interviews) وتحديات الخوارزميات الشائعة',
          ],
          project: 'تطبيق ويب متكامل عالي الأداء معتمد للإضافة المباشرة في البورتفوليو المهني.',
        },
      ],
      isActive: true,
    });

    console.log(`✅ Front-End Course seeded successfully: ${course.title} (ID: ${course._id})`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed course:', error.message);
    process.exit(1);
  }
};

seedCourse();
