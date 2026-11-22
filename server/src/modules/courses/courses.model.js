const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema(
  {
    moduleNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    duration: { type: String, required: true },
    topics: [{ type: String, trim: true }],
    project: { type: String, trim: true },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Course slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      default: 'المستوى التأسيسي إلى المتقدم',
      trim: true,
    },
    duration: {
      type: String,
      default: '12 أسبوعاً',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      default: null,
      min: [0, 'Offer price cannot be negative'],
    },
    hasOffer: {
      type: Boolean,
      default: false,
    },
    offerBadge: {
      type: String,
      default: 'عرض الحجز المبكر لفترة محدودة',
      trim: true,
    },
    offerEndsAt: {
      type: Date,
      default: null,
    },
    offerNote: {
      type: String,
      default: 'متاح للدفعة الأولى أو حتى اكتمال المقاعد المخصصة',
      trim: true,
    },
    features: {
      type: [String],
      default: [
        'تدريب تطبيقي مكثف يركز على متطلبات التوظيف الفعلية',
        'مراجعة كود فردية 1:1 لكل مشروع مع مهندس برمجيات',
        'بناء 5 مشاريع واقعية متكاملة ترفع كودها على GitHub',
        'جلسات إرشاد أسبوعية مباشرة وإجابة على كافة الاستفسارات',
        'شهادة إتمام معتمدة بكود تحقق رقمي رسمي',
        'توجيه مهني وتجهيز للإنترفيوهات وملف الـ LinkedIn',
      ],
    },
    guaranteeText: {
      type: String,
      default: 'ضمان استرداد كامل المصروفات خلال أول 7 أيام إذا لم تجد التجربة مناسبة لتطلعاتك دون أي تعقيد.',
      trim: true,
    },
    whatsappSupportNumber: {
      type: String,
      default: '201014176434',
      trim: true,
    },
    currency: {
      type: String,
      default: 'EGP',
    },
    isRegistrationOpen: {
      type: Boolean,
      default: true,
    },
    cohortName: {
      type: String,
      default: 'الدفعة الأولى',
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    roadmap: [roadmapItemSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

courseSchema.index({ isActive: 1, isRegistrationOpen: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
