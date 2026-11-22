import { useState, useEffect, useCallback } from 'react';
import { Download, MessageSquare, CheckCircle2, Eye, CreditCard } from 'lucide-react';
import { Card, Badge, Button, Input, Skeleton } from '@/components/ui';
import ApprovePaymentModal from '../components/ApprovePaymentModal';
import ApplicantDetailsModal from '../components/ApplicantDetailsModal';
import { getApplicants, updateApplicantStatus, getExportCsvUrl } from '../api/admin.api';
import { useToast } from '@/components/ui/Toast';
import styles from './AdminApplicantsPage.module.css';

/**
 * Applicants & Payments Manager Page.
 */
export default function AdminApplicantsPage() {
  const { addToast } = useToast();

  const [applicants, setApplicants] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [viewingApplicant, setViewingApplicant] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (applicant) => {
    setViewingApplicant(applicant);
    setIsDetailsModalOpen(true);
  };

  const getPaymentMethodBadge = (applicant) => {
    let methodKey = applicant.preferredPaymentMethod;
    if (!methodKey && applicant.background) {
      if (applicant.background.includes('vodafone_cash')) methodKey = 'vodafone_cash';
      else if (applicant.background.includes('instapay')) methodKey = 'instapay';
      else if (applicant.background.includes('bank_transfer')) methodKey = 'bank_transfer';
      else if (applicant.background.includes('installments')) methodKey = 'installments';
      else if (applicant.background.includes('credit_card')) methodKey = 'credit_card';
    }

    switch (methodKey) {
      case 'vodafone_cash':
        return { label: 'فودافون كاش ومحافظ', color: '#0047AB', bg: 'rgba(0, 71, 171, 0.08)' };
      case 'instapay':
        return { label: 'إنستاباي (InstaPay)', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' };
      case 'bank_transfer':
        return { label: 'تحويل بنكي', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.08)' };
      case 'installments':
        return { label: 'تقسيط على دفعتين', color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)' };
      case 'credit_card':
        return { label: 'بطاقة بنكية', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' };
      default:
        return { label: 'فودافون كاش ومحافظ', color: '#0077D7', bg: 'rgba(0, 119, 215, 0.08)' };
    }
  };

  const fetchApplicantsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getApplicants({
        status: statusFilter,
        paymentStatus: paymentFilter,
        search,
        page: pagination.page,
        limit: pagination.limit,
      });
      setApplicants(res.applicants);
      setPagination(res.pagination);
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحميل قائمة المتقدمين' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter, search, pagination.page, pagination.limit, addToast]);

  useEffect(() => {
    fetchApplicantsList();
  }, [fetchApplicantsList]);

  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      await updateApplicantStatus(applicantId, { status: newStatus });
      addToast({ type: 'success', message: 'تم تحديث حالة المتقدم' });
      fetchApplicantsList();
    } catch (err) {
      addToast({ type: 'error', message: 'فشل تحديث الحالة' });
    }
  };

  const handleOpenApproveModal = (applicant) => {
    setSelectedApplicant(applicant);
    setIsApproveModalOpen(true);
  };

  const cleanPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) {
      p = '2' + p; // Egyptian country code
    }
    return p;
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة المتقدمين والمدفوعات</h1>
          <p className={styles.pageSubtitle}>
            متابعة طلبات التسجيل، التواصل مع الطلاب عبر واتساب، وتأكيد الدفع وتوليد الأكواد.
          </p>
        </div>

        <div className={styles.headerActions}>
          <a
            href={getExportCsvUrl({ status: statusFilter, paymentStatus: paymentFilter, search })}
            download
            className={styles.exportBtnLink}
          >
            <Button variant="secondary" size="md" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} />
              <span>تصدير إلى Excel (CSV)</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card variant="flat" padding="md" className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.searchBox}>
            <Input
              placeholder="ابحث بالاسم، البريد، أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterSelects}>
            {/* Status Tabs */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>حالة الطلب:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={styles.select}
              >
                <option value="all">كافة الطلبات</option>
                <option value="pending">بانتظار المتابعة (جديد)</option>
                <option value="contacted">تم التواصل</option>
                <option value="approved">مؤكد ومقبول</option>
                <option value="rejected">ملغي / مرفوض</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>حالة الدفع:</label>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={styles.select}
              >
                <option value="all">الكل</option>
                <option value="unpaid">غير مدفوع</option>
                <option value="paid">تم الدفع</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Applicants Table */}
      <Card variant="elevated" padding="none" className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.loadingPadding}>
            <Skeleton variant="card" height="240px" />
          </div>
        ) : applicants.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>المتقدم</th>
                    <th>الهاتف / واتساب</th>
                    <th>طريقة الدفع المفضلة</th>
                    <th>الخبرة والهدف</th>
                    <th>حالة الدفع</th>
                    <th>حالة الطلب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => {
                    const isPaid = a.paymentStatus === 'paid';
                    const isApproved = a.status === 'approved';
                    const waNumber = cleanPhoneForWhatsApp(a.phone);
                    const payMethod = getPaymentMethodBadge(a);

                    return (
                      <tr
                        key={a._id}
                        className={`${styles.clickableRow} ${isApproved ? styles['tr--approved'] : ''}`}
                        onClick={() => handleOpenDetails(a)}
                        title="انقر لعرض كامل بيانات وتفاصيل الطالب"
                      >
                        <td>
                          <div className={styles.applicantInfo}>
                            <strong className={styles.applicantNameLink}>
                              <span>{a.fullName}</span>
                              <Eye size={12} style={{ opacity: 0.6 }} />
                            </strong>
                            <span className={styles.email} dir="ltr">{a.email}</span>
                            <span className={styles.cohort}>{a.courseId?.cohortName || 'دفعة 2026'}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.phoneBox} onClick={(e) => e.stopPropagation()}>
                            <span dir="ltr">{a.phone}</span>
                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                  `أهلاً بك يا ${a.fullName} في أكاديمية DevNest! بخصوص طلب تسجيلك في معسكر الويب...`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.waBtn}
                                title="مراسلة سريعة عبر واتساب"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <MessageSquare size={13} />
                                <span>واتساب</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={styles.methodBadge}
                            style={{ color: payMethod.color, backgroundColor: payMethod.bg }}
                          >
                            <CreditCard size={12} />
                            <span>{payMethod.label}</span>
                          </span>
                        </td>

                        <td>
                          <div className={styles.detailsBox}>
                            <Badge variant="neutral" size="sm">
                              {a.experienceLevel === 'beginner' ? 'مبتدئ' : a.experienceLevel === 'some_basics' ? 'أساسيات' : 'متوسط'}
                            </Badge>
                            {a.goals && <p className={styles.goals}>{a.goals}</p>}
                          </div>
                        </td>

                        <td>
                          <Badge variant={isPaid ? 'success' : 'warning'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {isPaid ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>تم الدفع</span>
                              </>
                            ) : (
                              'غير مدفوع'
                            )}
                          </Badge>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a._id, e.target.value)}
                            className={styles.inlineSelect}
                            disabled={isApproved}
                          >
                            <option value="pending">جديد</option>
                            <option value="contacted">تم التواصل</option>
                            <option value="approved">مقبول</option>
                            <option value="rejected">ملغي</option>
                          </select>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className={styles.actionBtns}>
                            <button
                              type="button"
                              className={styles.detailsBtn}
                              onClick={() => handleOpenDetails(a)}
                              title="عرض كامل بيانات الاستمارة وطريقة الدفع"
                            >
                              <Eye size={13} />
                              <span>عرض التفاصيل</span>
                            </button>

                            {!isPaid ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenApproveModal(a)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <CheckCircle2 size={14} />
                                <span>تأكيد الدفع</span>
                              </Button>
                            ) : (
                              <span className={styles.activeTag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={14} />
                                <span>مفعل</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (< 768px) */}
            <div className={styles.mobileCardsList}>
              {applicants.map((a) => {
                const isPaid = a.paymentStatus === 'paid';
                const isApproved = a.status === 'approved';
                const waNumber = cleanPhoneForWhatsApp(a.phone);
                const payMethod = getPaymentMethodBadge(a);

                return (
                  <div
                    key={a._id}
                    className={`${styles.applicantMobileCard} ${isApproved ? styles['applicantMobileCard--approved'] : ''}`}
                  >
                    {/* Header */}
                    <div className={styles.mobileCardHeader}>
                      <div>
                        <strong className={styles.mobileApplicantName}>{a.fullName}</strong>
                        <span className={styles.mobileCohortTag}>{a.courseId?.cohortName || 'دفعة 2026'}</span>
                      </div>
                      <Badge variant={isPaid ? 'success' : 'warning'} size="sm">
                        {isPaid ? 'تم الدفع' : 'غير مدفوع'}
                      </Badge>
                    </div>

                    {/* Preferred Payment Method Row */}
                    <div className={styles.mobileMethodRow}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>طريقة الدفع المفضلة:</span>
                      <span
                        className={styles.methodBadge}
                        style={{ color: payMethod.color, backgroundColor: payMethod.bg }}
                      >
                        <CreditCard size={12} />
                        <span>{payMethod.label}</span>
                      </span>
                    </div>

                    {/* Contact & WhatsApp */}
                    <div className={styles.mobileContactRow}>
                      <div className={styles.mobilePhoneBox}>
                        <span dir="ltr">{a.phone}</span>
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `أهلاً بك يا ${a.fullName} في أكاديمية DevNest! بخصوص طلب تسجيلك في معسكر الويب...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.waBtn}
                          >
                            <MessageSquare size={13} />
                            <span>واتساب</span>
                          </a>
                        )}
                      </div>
                      <span className={styles.mobileEmail} dir="ltr">{a.email}</span>
                    </div>

                    {/* Status Select & Experience */}
                    <div className={styles.mobileMetaRow}>
                      <Badge variant="neutral" size="sm">
                        {a.experienceLevel === 'beginner' ? 'مبتدئ' : a.experienceLevel === 'some_basics' ? 'أساسيات' : 'متوسط'}
                      </Badge>

                      <div className={styles.mobileStatusWrapper}>
                        <span className={styles.statusLabel}>الحالة:</span>
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a._id, e.target.value)}
                          className={styles.mobileSelect}
                          disabled={isApproved}
                        >
                          <option value="pending">جديد</option>
                          <option value="contacted">تم التواصل</option>
                          <option value="approved">مقبول</option>
                          <option value="rejected">ملغي</option>
                        </select>
                      </div>
                    </div>

                    {/* Details Trigger Button */}
                    <button
                      type="button"
                      className={styles.mobileDetailsBtn}
                      onClick={() => handleOpenDetails(a)}
                    >
                      <Eye size={14} />
                      <span>عرض كامل بيانات واستمارة المتقدم</span>
                    </button>

                    {/* Approve CTA */}
                    <div className={styles.mobileCardAction}>
                      {!isPaid ? (
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => handleOpenApproveModal(a)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <CheckCircle2 size={14} />
                          <span>تأكيد الدفع وتفعيل الكود</span>
                        </Button>
                      ) : (
                        <div className={styles.mobileActiveBadge}>
                          <CheckCircle2 size={14} />
                          <span>تم تفعيل الحساب وتوليد الكود بنجاح</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyView}>
            <p>لا توجد نتائج مطابقة لشروط البحث والفلاتر المحددة.</p>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className={styles.paginationBar}>
            <span className={styles.pageInfo}>
              الصفحة {pagination.page} من {pagination.totalPages} (إجمالي {pagination.total} متقدم)
            </span>
            <div className={styles.pageBtns}>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                السابق
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Approve Payment Modal */}
      <ApprovePaymentModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        applicant={selectedApplicant}
        onSuccess={fetchApplicantsList}
      />

      {/* Comprehensive Student Details Modal */}
      <ApplicantDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        applicant={viewingApplicant}
        onApprovePayment={handleOpenApproveModal}
        onUpdateApplicant={fetchApplicantsList}
      />
    </div>
  );
}
