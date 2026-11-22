const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Course = require('../modules/courses/courses.model');

/**
 * DevNest Academy Tracks Seed Script.
 * Front-End: 4 months (HTML, CSS, BOOTSTRAP, JS, REACT) - ACTIVE / OPEN FOR REGISTRATION.
 * Back-End: 3 months - COMING SOON.
 * Full-Stack: 7 months (NO NEXT.JS) - COMING SOON.
 * AI & ML: 4 months - COMING SOON.
 * Data Analysis: 3 months - COMING SOON.
 * Software Testing & QA: 3 months - COMING SOON.
 */
const tracksData = [
  {
    title: 'معسكر تطوير الواجهات الأمامية الشامل (Front-End Development Bootcamp)',
    slug: 'frontend-development',
    shortDescription: 'احترف بناء واجهات الويب الحديثة خطوة بخطوة: HTML5, CSS3, Bootstrap 5, JavaScript ES6+, و React مع تطبيق عملي ومراجعات كود فردية 1:1.',
    description: `المعسكر الهندسي الشامل والوحيد المفتوح للتسجيل حالياً في الدفعة الأولى. 
يركز 100% على التطبيق العملي لبناء واجهات مواقع وتطبيقات حقيقية باستخدام خماسية الواجهات الأساسية:
(HTML5, CSS3, Bootstrap 5, Modern JavaScript, React) بإشراف مباشر ومراجعات كود فردية سطر بسطر.`,
    level: 'من الصفر حتى الجاهزية لسوق العمل',
    duration: '4 أشهر (16 أسبوعاً — 48 محاضرة تفاعلية)',
    price: 4500,
    offerPrice: 3500,
    hasOffer: true,
    offerBadge: 'خصم الحجز المبكر — وفر 1000 ج.م',
    offerNote: 'عرض سارٍ للدفعة الأولى أو حتى اكتمال 30 مقعداً',
    features: [
      'تدريب تطبيقي مكثف يركز على متطلبات التوظيف الفعلية (HTML5, CSS3, Bootstrap 5, JS, React)',
      'مراجعة كود فردية 1:1 لكل تسليم وتأسيس Clean Code ومعمارية برمجية',
      'بناء 5 مشاريع واقعية متكاملة ترفع كودها على GitHub لمعرض أعمالك',
      'جلسات متابعة أسبوعية حية ومباشرة مع المدرب للإجابة على جميع التساؤلات',
      'تجهيز السيرة الذاتية (CV)، وملف LinkedIn، والتدريب على المقابلات التقنية (Mock Interviews)',
      'شهادة تخرج واجتياز معتمدة برقم تسلسلي وكود تحقق إلكتروني رسمي',
    ],
    guaranteeText: 'ضمان استرداد كامل المصروفات خلال أول 7 أيام إذا لم تجد التجربة مناسبة لتطلعاتك دون أي تعقيد.',
    whatsappSupportNumber: '201014176434',
    currency: 'EGP',
    isRegistrationOpen: true,
    cohortName: 'دفعة 2026 (الدفعة الأولى — متاح للتسجيل)',
    startDate: new Date('2026-12-15'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'هيكلة صفحات الويب الدلالية (HTML & Modern HTML5)',
        duration: 'أسبوعان',
        topics: [
          'أساسيات الويب وهيكلة المستند واستخدام Semantic HTML5 Tags',
          'النماذج المتقدمة Form Controls والتحقق من صحة المدخلات',
          'معايير إتاحة الوصول (Accessibility a11y) وتهيئة محركات البحث (SEO)',
        ],
        project: 'بناء هيكل موقع متكامل بـ HTML5 دلالي متوافق مع معايير الـ SEO.',
      },
      {
        moduleNumber: 2,
        title: 'تنسيق الواجهات والتصميم المتجاوب (CSS & Modern CSS3)',
        duration: 'أسبوعان',
        topics: [
          'أنظمة الألوان والخطوط والـ Box Model وقواعد التحديد المتقدمة',
          'تخطيط العناصر عبر Flexbox و CSS Grid والتصميم المتجاوب الكامل (Responsive Design)',
          'الحركات والانتقالات (CSS Transitions, Animations & Custom Properties)',
        ],
        project: 'تصميم وبناء موقع ويب تفاعلي متجاوب تماماً مع جميع أحجام الشاشات.',
      },
      {
        moduleNumber: 3,
        title: 'بناء الواجهات السريعة وإطار العمل (Bootstrap 5 Framework)',
        duration: 'أسبوعان',
        topics: [
          'فلسفة إطار العمل Bootstrap ونظام الـ Grid System المكون من 12 عموداً',
          'مكونات Bootstrap الجاهزة (Navbars, Cards, Modals, Carousels, Forms)',
          'تخصيص ثيمات Bootstrap وبناء صفحات هبوط سريعة واحترافية',
        ],
        project: 'بناء موقع تجاري وسياحي كامل وسريع باستخدام مكونات Bootstrap 5.',
      },
      {
        moduleNumber: 4,
        title: 'البرمجة التفاعلية ولغة الويب (Modern JavaScript ES6+ & DOM)',
        duration: '4 أسابيع',
        topics: [
          'أساسيات لغة JS: المتغيرات، الدوال، المصفوفات، الكائنات، و Scope / Closures',
          'التعامل المباشر مع عناصر الصفحة (DOM Manipulation & Event Listeners)',
          'ميزات ES6+ الحديثة: Destructuring, Modules, Promises, Async/Await',
          'استهلاك واجهات برمجة التطبيقات (REST APIs & Fetch API) وحفظ البيانات محلياً',
        ],
        project: 'تطبيق تفاعلي متكامل لإدارة المهام والبيانات الحية مع استهلاك Live REST APIs.',
      },
      {
        moduleNumber: 5,
        title: 'بناء تطبيقات الويب التفاعلية الضخمة (React Ecosystem)',
        duration: '4 أسابيع',
        topics: [
          'مبادئ React الأساسية: Components, JSX, Props, و State Management',
          'إتقان React Hooks: useState, useEffect, useRef, useMemo, useCallback',
          'التنقل متعدد الصفحات عبر React Router DOM وإدارة النماذج والبيانات',
          'ربط الواجهات بالـ APIs وإدارة دورة حياة المكون وحالات التحميل والأخطاء',
        ],
        project: 'تطبيق ويب متكامل بـ React (متجر إلكتروني بسلة تسوق تفاعلية وفلاتر متقدمة).',
      },
      {
        moduleNumber: 6,
        title: 'المشاريع التطبيقية والتأهيل لسوق العمل (Real Projects & Career Readiness)',
        duration: 'أسبوعان',
        topics: [
          'تنفيذ مشروع تخرج فردي متكامل يدمج (HTML, CSS, Bootstrap, JS, React)',
          'مراجعة الكود سطر بسطر 1:1 وضبط معايير Clean Code وهيكلة المشاريع',
          'تجهيز حساب GitHub و LinkedIn ومحاكاة المقابلات التقنية (Mock Technical Interviews)',
        ],
        project: 'مشروع تخرج تخصصي كامل عالي الأداء معتمد للبورتفوليو والسيرة الذاتية.',
      },
    ],
  },
  {
    title: 'معسكر تطوير الأنظمة الخلفية وقواعد البيانات (Back-End Engineering Bootcamp)',
    slug: 'backend-development',
    shortDescription: 'احترف بناء خوادم ويب آمنة وعالية الأداء باستخدام Node.js, Express, MongoDB, PostgreSQL وهندسة الأنظمة الموزعة.',
    description: `معسكر هندسي معمق يركز على تصميم وبناء خوادم الويب القوية وواجهات البرمجة RESTful APIs وتأمين قواعد البيانات والتعامل مع ملايين الطلبات بأعلى معايير الأمان.`,
    level: 'من المستوى المتوسط حتى الاحتراف',
    duration: '3 أشهر (12 أسبوعاً — 36 محاضرة تفاعلية)',
    price: 3800,
    currency: 'EGP',
    isRegistrationOpen: false,
    cohortName: 'يبدأ قريباً (قيد الإعداد)',
    startDate: new Date('2027-02-01'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'أساسيات الخوادم والشبكات وبيئة Node.js',
        duration: 'أسبوعان',
        topics: [
          'معمارية Node.js Event Loop والـ V8 Engine وإدارة الذاكرة',
          'التعامل مع ملفات النظام (File System & Streams/Buffers)',
          'بروتوكولات HTTP/HTTPS, TCP/IP, WebSockets وهندسة الشبكات',
        ],
        project: 'بناء خادم ويب مخصص ومحلل ملفات عالي السرعة بدون مكتبات خارجية.',
      },
      {
        moduleNumber: 2,
        title: 'إتقان إطار العمل Express.js وتصميم REST APIs',
        duration: '3 أسابيع',
        topics: [
          'بناء Express Server وفق معايير Clean Architecture (Routes, Controllers, Services)',
          'معالجة الأخطاء المركزية وكتابة برمجيات وسيطة متقدمة (Custom Middlewares)',
          'التحقق الصارم من المدخلات عبر Zod وتوثيق الـ APIs عبر Swagger/OpenAPI',
        ],
        project: 'تطبيق API متكامل لشبكة تواصل مع نظام مصادقة JWT وتشفير أمني.',
      },
      {
        moduleNumber: 3,
        title: 'قواعد البيانات العلائقية وغير العلائقية (MongoDB & PostgreSQL)',
        duration: '3 أسابيع',
        topics: [
          'تصميم Schema احترافي في MongoDB وفهرسة الاستعلامات وحسابات Aggregation',
          'إتقان SQL واستعلامات PostgreSQL وعلاقات الجداول و Transactions و ACID',
          'التعامل مع ORMs/ODMs: Mongoose و Prisma/Drizzle',
        ],
        project: 'نظام إدارة قواعد بيانات هجين متكامل يدعم المعاملات البنكية بأمان تام.',
      },
      {
        moduleNumber: 4,
        title: 'أمن المعلومات وحماية الخوادم (OWASP Top 10 & Authentication)',
        duration: 'أسبوعان',
        topics: [
          'آليات الأمان والمصادقة المتقدمة: JWT, Refresh Tokens, Cookies, OAuth 2.0',
          'الحماية الصارمة من ثغرات NoSQL/SQL Injection, XSS, CSRF, Rate Limiting',
          'تشفير كلمات المرور وحماية الجلسات الواحدة (Single Active Session)',
        ],
        project: 'بوابة مصادقة وأمان مؤسسية مطابقة لمعايير OWASP ومجهزة للشركات.',
      },
      {
        moduleNumber: 5,
        title: 'التخزين المؤقت والرسائل غير المتزامنة (Redis & Message Queues)',
        duration: 'أسبوعان',
        topics: [
          'تسريع استجابة الخوادم باستخدام Caching عبر Redis',
          'إدارة الطوابير غير المتزامنة ومعالجة المهام الخلفية (BullMQ & Redis)',
          'تصميم واجهات الويب الحية عبر WebSockets / Socket.io',
        ],
        project: 'منصة محادثات وإشعارات فورية في الوقت الحقيقي عالية التحمل.',
      },
      {
        moduleNumber: 6,
        title: 'الحاويات والنشر السحابي ومشروع التخرج (Docker & Cloud Deployment)',
        duration: 'أسبوع واحد',
        topics: [
          'بناء حاويات Docker و Docker Compose للخدمات المتعددة',
          'إعداد خطوط الإنتاج المستمر CI/CD عبر GitHub Actions',
          'نشر الـ Backend على السحابة ومراقبة أداء السيرفرات',
        ],
        project: 'مشروع تخرج تخصصي Backend لخدمة تجارة إلكترونية متكاملة مع بوابات دفع.',
      },
    ],
  },
  {
    title: 'معسكر تطوير الويب المتكامل الشامل (Full-Stack Web Engineering)',
    slug: 'fullstack-development',
    shortDescription: 'اجمع بين إتقان الواجهات الأمامية والأنظمة الخلفية لتصبح Full-Stack Engineer قادراً على بناء وتوسيع أنظمة الويب المتكاملة.',
    description: `المسار الهندسي الأكثر شمولاً في سوق العمل الحر والشركات التقنية. 
ستتعلم فيه بناء تطبيقات الويب من الصفر حتى النشر النهائي عبر MERN Stack بأعلى معايير Clean Architecture.`,
    level: 'من الصفر حتى الاحتراف الكامل',
    duration: '7 أشهر (28 أسبوعاً — 84 محاضرة تفاعلية)',
    price: 4500,
    currency: 'EGP',
    isRegistrationOpen: false,
    cohortName: 'يبدأ قريباً (قيد الإعداد)',
    startDate: new Date('2027-03-01'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'الواجهات الأمامية التفاعلية (HTML, CSS, Bootstrap & React)',
        duration: '5 أسابيع',
        topics: [
          'هيكلة الواجهات وتصميم تجارب مستخدم متجاوبة مع كافة الشاشات',
          'مكونات React الحديثة وإدارة الحالة و Hooks المتطورة',
          'استهلاك وتكامل واجهات RESTful APIs بكفاءة وسرعة',
        ],
        project: 'واجهة متجر إلكتروني ولوحة تحكم إدارية تفاعلية بـ React.',
      },
      {
        moduleNumber: 2,
        title: 'الأنظمة الخلفية وقواعد البيانات (Node.js, Express & MongoDB)',
        duration: '5 أسابيع',
        topics: [
          'بناء وتأمين RESTful APIs ومعالجة الأخطاء وتوثيق الأنظمة',
          'تصميم Schema قواعد البيانات المتقدمة وعمليات الاستعلام والتجميع في MongoDB',
          'تطبيق المصادقة المشفرة والأدوار المتعددة (RBAC)',
        ],
        project: 'خادم API متكامل يدعم إدارة المستخدمين والمنتجات والطلبات.',
      },
      {
        moduleNumber: 3,
        title: 'معمارية التطوير المتكامل وإدارة الحالة (Full-Stack Architecture)',
        duration: '5 أسابيع',
        topics: [
          'الربط الكامل بين خادم Express وتطبيق React مع إدارة الحالة العامة',
          'تحسين الأداء والحماية من الثغرات في جانبي العميل والخادم',
          'تنظيم المشروع وفق معايير Clean Architecture والمجلدات المعيارية',
        ],
        project: 'تطبيق ويب متكامل (Frontend + Backend) متزامن بالكامل.',
      },
      {
        moduleNumber: 4,
        title: 'بوابات الدفع والتكامل مع الخدمات الخارجية',
        duration: '4 أسابيع',
        topics: [
          'ربط بوابات الدفع الإلكتروني (Stripe / Paymob / Fawry)',
          'معالجة الـ Webhooks وإدارة فواتير واشتراكات العملاء',
          'إرسال الإيميلات ورسائل الواتساب والتحقق الثنائي OTP',
        ],
        project: 'منصة بيع دورات واشتراكات رقمية متكاملة بالدفع الآلي.',
      },
      {
        moduleNumber: 5,
        title: 'الحاويات والاختبارات والأتمتة (Docker, Testing & CI/CD)',
        duration: '5 أسابيع',
        topics: [
          'كتابة اختبارات Unit & Integration Tests عبر Jest و Supertest',
          'تجميع المشروع بالكامل في حاويات Docker متعددة المراحل',
          'أتمتة الفحص والنشر عبر GitHub Actions إلى خوادم السحابة',
        ],
        project: 'بيئة نشر مؤتمتة متكاملة للـ Full-Stack جاهزة للإنتاج.',
      },
      {
        moduleNumber: 6,
        title: 'مشروع التخرج الضخم والمحاكاة المهنية',
        duration: '4 أسابيع',
        topics: [
          'بناء نظام متكامل يحاكي منصات عالمية (مثل Airbnb أو Trello)',
          'تجهيز البورتفوليو وإجراء مقابلات المحاكاة (Mock Technical Interviews)',
        ],
        project: 'منصة برمجية تجارية كاملة واجهات وخلفيات وقواعد بيانات.',
      },
    ],
  },
  {
    title: 'معسكر الذكاء الاصطناعي وتعلم الآلة (AI & Machine Learning Bootcamp)',
    slug: 'ai-machine-learning',
    shortDescription: 'انطلق في أسرع المجالات نمواً؛ تعلم لغة Python، وخوارزميات تعلم الآلة، والتعلم العميق، وتطبيقات النماذج اللغوية الكبيرة (LLMs).',
    description: `معسكر برمجي حديث وعملي مصمم لنقلك من الصفر في Python إلى بناء وتدريب ونشر نماذج الذكاء الاصطناعي، ومعالجة اللغات الطبيعية (NLP)، وهندسة الأوامر (Prompt Engineering).`,
    level: 'من الصفر حتى التطبيق العملي المتقدم',
    duration: '4 أشهر (16 أسبوعاً — 48 محاضرة تفاعلية)',
    price: 4200,
    currency: 'EGP',
    isRegistrationOpen: false,
    cohortName: 'يبدأ قريباً (قيد الإعداد)',
    startDate: new Date('2027-02-15'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'إتقان لغة Python والرياضيات للذكاء الاصطناعي',
        duration: '3 أسابيع',
        topics: [
          'أساسيات لغة Python المتقدمة والبرمجة كائنية التوجه (OOP)',
          'الجبر الخطي والمصفوفات والاحتمالات والإحصاء الموجه للـ AI',
          'مكتبات الحوسبة العلمية السريعة: NumPy و SciPy',
        ],
        project: 'بناء خوارزمية حسابية ذكية لتحليل وتصنيف البيانات بدون مكتبات جاهزة.',
      },
      {
        moduleNumber: 2,
        title: 'خوارزميات تعلم الآلة الكلاسيكية (Machine Learning)',
        duration: '3 أسابيع',
        topics: [
          'التعلم الخاضع للإشراف (Supervised): Regression, Decision Trees, Random Forest',
          'التعلم غير الخاضع للإشراف (Unsupervised): K-Means Clustering, PCA',
          'استخدام مكتبة Scikit-Learn وتقييم النماذج (Precision, Recall, ROC-AUC)',
        ],
        project: 'نموذج تنبؤ بأسعار العقارات وتقييم المخاطر الائتمانية في البنوك.',
      },
      {
        moduleNumber: 3,
        title: 'التعلم العميق والشبكات العصبية (Deep Learning & PyTorch)',
        duration: '3 أسابيع',
        topics: [
          'معمارية الشبكات العصبية الاصطناعية (ANN) وحسابات Backpropagation',
          'الشبكات العصبية الالتفافية (CNN) للرؤية الحاسوبية ومعالجة الصور',
          'الشبكات العصبية التكرارية (RNN & LSTM) وتحليل السلاسل الزمنية',
        ],
        project: 'نموذج تمييز وفحص الصور الطبية وتصنيفها بدقة عالية باستخدام PyTorch.',
      },
      {
        moduleNumber: 4,
        title: 'معالجة اللغات الطبيعية والنماذج اللغوية (NLP & Transformers)',
        duration: '3 أسابيع',
        topics: [
          'تحليل النصوص ومعالجتها المسبقة وتضمين الكلمات (Word2Vec, Tokenization)',
          'معمارية Transformers ونماذج BERT و GPT',
          'تحليل المشاعر وتلخيص النصوص واستخراج الكيانات (NER)',
        ],
        project: 'نظام تصنيف وتلخيص التغريدات والمراجعات تلقائياً بدقة لغوية.',
      },
      {
        moduleNumber: 5,
        title: 'تطبيقات الذكاء الاصطناعي التوليدي و LLMs و RAG',
        duration: '2 أسابيع',
        topics: [
          'التعامل مع واجهات OpenAI و Gemini و Anthropic APIs',
          'بناء أنظمة استرجاع المعلومات التوليدية (RAG) عبر Vector Databases',
          'أطر عمل LangChain و LlamaIndex لتطوير وكلاء الذكاء الاصطناعي (AI Agents)',
        ],
        project: 'مساعد ذكي تفاعلي (AI Agent) للإجابة على أسئلة مستندات الشركات المعقدة.',
      },
      {
        moduleNumber: 6,
        title: 'نشر نماذج الذكاء الاصطناعي ومشروع التخرج (MLOps & Deployment)',
        duration: '2 أسابيع',
        topics: [
          'تحويل النماذج إلى REST APIs عبر FastAPI',
          'تغليف النماذج في حاويات Docker ونشرها السحابي على HuggingFace / AWS',
        ],
        project: 'تطبيق ذكاء اصطناعي تجاري متكامل بواجهة ويب وتنبؤات حية.',
      },
    ],
  },
  {
    title: 'معسكر تحليل البيانات وذكاء الأعمال (Data Analysis & Business Intelligence)',
    slug: 'data-analysis',
    shortDescription: 'حوّل البيانات الخام إلى قرارات استراتيجية؛ أتقن SQL، و Python (Pandas/NumPy)، و Power BI، وبناء لوحات المعلومات التفاعلية.',
    description: `مسار متكامل ومطلوب بشدة يؤهلك للعمل كـ Data Analyst في كبرى الشركات والمؤسسات. 
ستتعلم فيه جمع البيانات وتنظيفها وتحليلها إحصائياً، وبناء Dashboards تفاعلية تدعم متخذي القرار.`,
    level: 'من الصفر ومناسب لجميع التخصصات',
    duration: '3 أشهر (12 أسبوعاً — 36 محاضرة تفاعلية)',
    price: 3200,
    currency: 'EGP',
    isRegistrationOpen: false,
    cohortName: 'يبدأ قريباً (قيد الإعداد)',
    startDate: new Date('2027-03-01'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'التحليل المتقدم عبر جداول البيانات (Advanced Excel for Data)',
        duration: 'أسبوعان',
        topics: [
          'الدوال الحسابية والإحصائية المتقدمة (XLOOKUP, INDEX/MATCH, Dynamic Arrays)',
          'جداول المحاور Pivot Tables وتجميع البيانات الكبيرة',
          'تنظيف البيانات وأتمتة التقارير عبر Power Query',
        ],
        project: 'تقرير مالي وإحصائي شامل لأداء مبيعات شركة متعددة الفروع.',
      },
      {
        moduleNumber: 2,
        title: 'إتقان لغة قواعد البيانات SQL لتحليل البيانات',
        duration: '3 أسابيع',
        topics: [
          'استعلامات SQL المتقدمة (SELECT, WHERE, GROUP BY, HAVING)',
          'ربط الجداول المعقدة (INNER, LEFT, RIGHT, FULL OUTER JOINs)',
          'الدوال النافذية (Window Functions: RANK, DENSE_RANK, LAG, LEAD)',
          'كتابة Common Table Expressions (CTEs) والاستعلامات الفرعية',
        ],
        project: 'تحليل سلوك عملاء متجر تجارة إلكترونية واستخراج مؤشرات Cohort Retention.',
      },
      {
        moduleNumber: 3,
        title: 'برمجة تحليل البيانات عبر Python (Pandas & NumPy)',
        duration: '3 أسابيع',
        topics: [
          'هياكل البيانات الأساسية: Series و DataFrames في مكتبة Pandas',
          'تقنيات تنظيف البيانات والتعامل مع القيم المفقودة والتكرارات',
          'دمج وتحويل وتجميع البيانات الكبيرة وحساب الإحصائيات الوصفية',
        ],
        project: 'تنظيف وتحليل مجموعة بيانات ضخمة لملايين المعاملات الاستهلاكية.',
      },
      {
        moduleNumber: 4,
        title: 'تصوير البيانات والرسوم البيانية (Data Visualization)',
        duration: 'أسبوعان',
        topics: [
          'رسم العلاقات والتوزيعات الإحصائية عبر Matplotlib و Seaborn',
          'مبادئ السرد القصصي للبيانات (Data Storytelling) واختيار الرسم البياني المناسب',
          'اكتشاف الأنماط والارتباطات الإحصائية والفرص غير المرئية',
        ],
        project: 'دراسة تحليلية شاملة ومصورة لسوق العمل والرواتب التقنية بالشركات.',
      },
      {
        moduleNumber: 5,
        title: 'ذكاء الأعمال وبناء لوحات التحكم (Power BI Mastery)',
        duration: 'أسبوعان',
        topics: [
          'نمذجة البيانات وبناء العلاقات Star Schema في Power BI',
          'كتابة صيغ ومقاييس DAX الحسابية المتقدمة (CALCULATE, Time Intelligence)',
          'تصميم Dashboards تفاعلية ديناميكية جذابة وسهلة القراءة',
        ],
        project: 'لوحة تحكم تنفيذية متكاملة لمدراء الشركات (Executive BI Dashboard).',
      },
      {
        moduleNumber: 6,
        title: 'مشروع التخرج وإعداد ملف المحلل المهني (Data Portfolio)',
        duration: 'أسبوع واحد',
        topics: [
          'تنفيذ دراسة حالة كاملة (End-to-End Case Study) تبدأ بالسؤال التجاري وتنتهي بالحل',
          'تجهيز البورتفوليو على GitHub و NovyPro ومحاكاة المقابلات الفنية',
        ],
        project: 'مشروع تخرج تحليلي متكامل معروض بأسلوب احترافي لأصحاب الأعمال.',
      },
    ],
  },
  {
    title: 'معسكر اختبار البرمجيات وضمان الجودة (Software Testing & QA Engineering)',
    slug: 'software-testing-qa',
    shortDescription: 'كن حارس الجودة الأول؛ احترف الفحص اليدوي (Manual Testing) والفحص الآلي (Automated Testing عبر Cypress/Playwright) واختبار الـ APIs.',
    description: `مسار متخصص لإعداد مهندسي جودة البرمجيات (QA Engineers) القادرين على فحص الأنظمة البرمجية واكتشاف الثغرات وتأكيد جاهزية المنتجات للإطلاق.`,
    level: 'من الصفر حتى الجاهزية لسوق العمل',
    duration: '3 أشهر (12 أسبوعاً — 36 محاضرة تفاعلية)',
    price: 3200,
    currency: 'EGP',
    isRegistrationOpen: false,
    cohortName: 'يبدأ قريباً (قيد الإعداد)',
    startDate: new Date('2027-03-15'),
    roadmap: [
      {
        moduleNumber: 1,
        title: 'أساسيات هندسة البرمجيات ومنهجيات الفحص (Software Testing Fundamentals)',
        duration: 'أسبوعان',
        topics: [
          'دورة حياة تطوير البرمجيات (SDLC) ودورة حياة الفحص (STLC)',
          'منهجيات Agile و Scrum وأدوار فريق الجودة QA',
          'مبادئ الفحص السبعة وأساسيات معايير ISTQB العالمية',
        ],
        project: 'كتابة خطة اختبار شاملة (Test Plan) لنظام حجز طيران افتراضي.',
      },
      {
        moduleNumber: 2,
        title: 'تصميم حالات الاختبار وإدارة الأخطاء (Test Cases & Bug Tracking)',
        duration: 'أسبوعان',
        topics: [
          'تقنيات تصميم حالات الفحص (Equivalence Partitioning, Boundary Value Analysis)',
          'كتابة Test Cases و Test Scenarios احترافية وتغطية متطلبات النظام',
          'إدارة وتتبع الأخطاء البرمجية (Bug Life Cycle) وتوثيقها عبر Jira',
        ],
        project: 'فحص يدوي كامل لموقع تجارة إلكترونية حقيقي وتسجيل تقارير أخطاء مفصلة على Jira.',
      },
      {
        moduleNumber: 3,
        title: 'فحص واجهات برمجة التطبيقات وقواعد البيانات (API & Database Testing)',
        duration: 'أسبوعان',
        topics: [
          'فحص RESTful APIs باستخدام Postman (Headers, Body, Status Codes)',
          'كتابة اختبارات Postman الآلية وتأكيد الاستجابات عبر JavaScript Assertions',
          'فحص قواعد البيانات عبر استعلامات SQL للتحقق من سلامة البيانات المنقولة',
        ],
        project: 'حزمة اختبارات API متكاملة ومؤتمتة لنظام بنكي تشمل جميع السيناريوهات.',
      },
      {
        moduleNumber: 4,
        title: 'أساسيات الاختبار المؤتمت بلغة JavaScript (Test Automation Fundamentals)',
        duration: 'أسبوعان',
        topics: [
          'أساسيات لغة JavaScript الموجهة لمهندسي الأتمتة (Automation)',
          'مفاهيم DOM Selectors والتعامل مع عناصر الواجهة (Locators & XPath)',
          'بناء أول كود أتمتة لفتح المتصفح والتفاعل مع الصفحات',
        ],
        project: 'سكربت أتمتة لفحص تسجيل الدخول وتعبئة النماذج واختبار الحقول آلياً.',
      },
      {
        moduleNumber: 5,
        title: 'أتمتة واجهات المستخدم الحديثة عبر Cypress & Playwright',
        duration: '3 أسابيع',
        topics: [
          'إتقان إطار العمل Cypress: التثبيت، كتابة الاختبارات، وميزات Time Travel',
          'أتمتة المتصفحات الحديثة عبر Playwright ودعم جميع المحركات',
          'تصميم معمارية Page Object Model (POM) لكتابة كود فحص قابل للصيانة',
        ],
        project: 'إطار أتمتة متكامل (Automation Framework) يفحص دورة الشراء الكاملة لمتجر إلكتروني.',
      },
      {
        moduleNumber: 6,
        title: 'التكامل المستمر ومشروع التخرج (CI/CD Integration & Capstone QA)',
        duration: 'أسبوع واحد',
        topics: [
          'تشغيل الاختبارات الآلية تلقائياً داخل خطوط GitHub Actions CI/CD',
          'توليد تقارير الجودة التفاعلية عبر Allure Reports',
          'إعداد السيرة الذاتية لمهندس QA ومحاكاة المقابلات الفنية مع الشركات',
        ],
        project: 'مشروع تخرج شامل يجمع بين الفحص اليدوي وكتابة الحالات وأتمتة الواجهات والـ APIs.',
      },
    ],
  },
];

async function seedAllTracks() {
  try {
    await connectDB();
    console.log('🌱 Updating all 6 tracks with new durations, curriculum and availability...');

    for (const track of tracksData) {
      const existing = await Course.findOne({ slug: track.slug });
      if (existing) {
        await Course.findOneAndUpdate({ slug: track.slug }, track, { returnDocument: 'after' });
        console.log(`🔄 Updated track: ${track.title} [Open: ${track.isRegistrationOpen}, Duration: ${track.duration}]`);
      } else {
        await Course.create(track);
        console.log(`✨ Created track: ${track.title}`);
      }
    }

    console.log('🎉 Successfully updated all engineering tracks in database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed tracks:', err);
    process.exit(1);
  }
}

seedAllTracks();
