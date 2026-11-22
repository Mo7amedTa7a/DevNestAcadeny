const mongoose = require('mongoose');

const defaultTemplates = {
  'frontend-development': {
    badge: 'إعلان هام ورسمي',
    title: 'الانطلاقة الرسمية لعام 2026 تبدأ حصرياً بـ معسكر تطوير الواجهات الأمامية (Front-End Bootcamp)',
    details: 'تدريب عملي مكثف لمدة 4 أشهر على خماسية الواجهات (HTML, CSS, Bootstrap, JavaScript, React) مع مراجعات كود فردية 1:1. [باقي المسارات قيد الإعداد وتبدأ تباعاً، ويمكنك استعراض مناهجها بالأسفل]',
    buttonText: 'سجّل مقعدك الآن',
  },
  'backend-development': {
    badge: 'معسكر الأنظمة الخلفية',
    title: 'انطلاق معسكر تطوير الأنظمة الخلفية وقواعد البيانات (Back-End Engineering)',
    details: 'احترف بناء خوادم ويب آمنة وعالية الأداء بـ Node.js, Express, MongoDB, PostgreSQL وهندسة الأنظمة الموزعة لمدة 3 أشهر.',
    buttonText: 'سجّل في معسكر الباك إند',
  },
  'fullstack-development': {
    badge: 'معسكر الويب المتكامل',
    title: 'انطلاق معسكر تطوير الويب المتكامل الشامل (Full-Stack Web Engineering)',
    details: '7 أشهر من الاحتراف الشامل؛ اتقن الواجهات الأمامية والخلفيات وقواعد البيانات وبناء أنظمة كاملة جاهزة للإنتاج.',
    buttonText: 'سجّل في معسكر الفول ستاك',
  },
  'ai-machine-learning': {
    badge: 'معسكر الذكاء الاصطناعي',
    title: 'انطلاق معسكر الذكاء الاصطناعي وتعلم الآلة (AI & Machine Learning Bootcamp)',
    details: '4 أشهر عملية؛ تعلم Python, Machine Learning, Deep Learning (PyTorch), وتطبيقات الـ LLMs و RAG Agents.',
    buttonText: 'سجّل في معسكر الـ AI',
  },
  'data-analysis': {
    badge: 'معسكر تحليل البيانات',
    title: 'انطلاق معسكر تحليل البيانات وذكاء الأعمال (Data Analysis & BI)',
    details: '3 أشهر مكثفة لتحويل البيانات لقرارات استراتيجية عبر SQL, Python Pandas, و Power BI.',
    buttonText: 'سجّل في معسكر تحليل البيانات',
  },
  'software-testing-qa': {
    badge: 'معسكر اختبار البرمجيات',
    title: 'انطلاق معسكر اختبار البرمجيات وضمان الجودة (QA Engineering)',
    details: '3 أشهر؛ احترف الفحص اليدوي والآلي بـ Cypress و Playwright واختبار الـ APIs.',
    buttonText: 'سجّل في معسكر الـ QA',
  },
};

const announcementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'hero_announcement',
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      enum: ['course', 'custom'],
      default: 'course',
    },
    selectedCourseSlug: {
      type: String,
      default: 'frontend-development',
    },
    templates: {
      type: mongoose.Schema.Types.Mixed,
      default: defaultTemplates,
    },
    custom: {
      badge: { type: String, default: 'إعلان خاص' },
      title: { type: String, default: 'خصم خاص وتسهيلات سداد لجميع المسارات الهندسية' },
      details: { type: String, default: 'سارع بحجز مقعدك في دفعات 2026 مع إمكانية التقسيط الميسر ومراجعات كود فردية 1:1.' },
      buttonText: { type: String, default: 'تواصل معنا واستفسر' },
      buttonLink: { type: String, default: '#tracks' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
module.exports.defaultTemplates = defaultTemplates;
