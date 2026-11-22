import { useState, useEffect } from 'react';
import { Trophy, Award, Crown, Medal } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import SEO from '@/components/seo/SEO';
import { useToast } from '@/components/ui/Toast';
import { getCohortLeaderboard } from '../api/leaderboard.api';
import styles from './StudentLeaderboardPage.module.css';

export default function StudentLeaderboardPage() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isGated, setIsGated] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await getCohortLeaderboard();
      setData(res);
      setIsGated(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setIsGated(true);
      } else {
        addToast({ type: 'error', message: 'فشل تحميل لوحة المتصدرين' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (isGated) {
    return (
      <>
        <SEO title="لوحة المتصدرين | DevNest Academy" noIndex={true} />
        <div className={styles.lockedContainer}>
          <div className={styles.lockIcon}>
            <Trophy size={48} />
          </div>
          <h2 className={styles.lockTitle}>لوحة المتصدرين خاصة بطلاب الدفعة التفاعلية (Cohort)</h2>
          <p className={styles.lockText}>
            باقتك الحالية مفعلة للوصول إلى المحاضرات المسجلة فقط. الدخول في التصنيف التنافسي والمنافسة على دروع التميز مخصص لطلاب الدفعة الحية.
          </p>
        </div>
      </>
    );
  }

  const topThree = data?.topThree || [];
  const cohortList = data?.cohortList || [];
  const myRank = data?.myRank;

  // Podium arrangement: [Rank 2, Rank 1, Rank 3] for visual balance
  const rank1 = topThree.find((s) => s.rank === 1);
  const rank2 = topThree.find((s) => s.rank === 2);
  const rank3 = topThree.find((s) => s.rank === 3);

  return (
    <>
      <SEO title="لوحة المتصدرين | DevNest Academy" noIndex={true} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>لوحة متصدري الدفعة التفاعلية</h1>
            <p className={styles.subtitle}>
              التصنيف المباشر لفرسان الدفعة بناءً على مجموع درجات المهام ومراجعات الكود البرمجي
            </p>
          </div>
          {data?.course?.cohortName && (
            <Badge variant="primary" size="md">
              {data.course.cohortName}
            </Badge>
          )}
        </div>

        {/* My Rank Card */}
        {myRank && (
          <div className={styles.myRankBanner}>
            <div className={styles.myRankRight}>
              <div className={styles.myRankBadge}>
                المركز <strong className={styles.myRankNumber}>#{myRank.rank}</strong>
              </div>
              <div className={styles.myRankDetails}>
                <span className={styles.myRankName}>{myRank.fullName} (أنت)</span>
                <span className={styles.myRankCode} dir="ltr">{myRank.studentCode}</span>
              </div>
            </div>

            <div className={styles.myRankStats}>
              <div className={styles.myRankStatItem}>
                <span className={styles.myRankStatLabel}>إجمالي النقاط</span>
                <strong className={styles.myRankPoints}>{myRank.totalPoints}</strong>
              </div>
              <div className={styles.myRankStatItem}>
                <span className={styles.myRankStatLabel}>المهام المنجزة</span>
                <strong className={styles.myRankTasks}>{myRank.tasksCompleted}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Podium Section (Top 3) */}
        {loading ? (
          <div className={styles.loadingPodium}>
            <Skeleton variant="card" height="240px" />
          </div>
        ) : (
          topThree.length > 0 && (
            <div className={styles.podiumSection}>
              {/* Rank 2 (Silver) */}
              {rank2 ? (
                <div className={`${styles.podiumCard} ${styles['podiumCard--silver']}`}>
                  <div className={styles.podiumBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Medal size={14} color="#94A3B8" />
                    <span>المركز الثاني</span>
                  </div>
                  <div className={styles.podiumAvatar}>
                    {rank2.fullName.slice(0, 1)}
                  </div>
                  <strong className={styles.podiumName}>{rank2.fullName}</strong>
                  <span className={styles.podiumCode} dir="ltr">{rank2.studentCode}</span>
                  <div className={styles.podiumScore}>
                    <strong>{rank2.totalPoints}</strong> نقطة
                  </div>
                  <div className={styles.podiumTasks}>{rank2.tasksCompleted} مهام مكتملة</div>
                </div>
              ) : (
                <div className={`${styles.podiumCard} ${styles['podiumCard--empty']}`} />
              )}

              {/* Rank 1 (Gold) */}
              {rank1 && (
                <div className={`${styles.podiumCard} ${styles['podiumCard--gold']}`}>
                  <div className={styles.crownIcon}>
                    <Crown size={32} color="#F59E0B" />
                  </div>
                  <div className={styles.podiumBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Trophy size={14} color="#F59E0B" />
                    <span>متصدر الدفعة</span>
                  </div>
                  <div className={`${styles.podiumAvatar} ${styles['podiumAvatar--gold']}`}>
                    {rank1.fullName.slice(0, 1)}
                  </div>
                  <strong className={styles.podiumName}>{rank1.fullName}</strong>
                  <span className={styles.podiumCode} dir="ltr">{rank1.studentCode}</span>
                  <div className={`${styles.podiumScore} ${styles['podiumScore--gold']}`}>
                    <strong>{rank1.totalPoints}</strong> نقطة
                  </div>
                  <div className={styles.podiumTasks}>{rank1.tasksCompleted} مهام مكتملة</div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {rank3 ? (
                <div className={`${styles.podiumCard} ${styles['podiumCard--bronze']}`}>
                  <div className={styles.podiumBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Medal size={14} color="#CD7F32" />
                    <span>المركز الثالث</span>
                  </div>
                  <div className={styles.podiumAvatar}>
                    {rank3.fullName.slice(0, 1)}
                  </div>
                  <strong className={styles.podiumName}>{rank3.fullName}</strong>
                  <span className={styles.podiumCode} dir="ltr">{rank3.studentCode}</span>
                  <div className={styles.podiumScore}>
                    <strong>{rank3.totalPoints}</strong> نقطة
                  </div>
                  <div className={styles.podiumTasks}>{rank3.tasksCompleted} مهام مكتملة</div>
                </div>
              ) : (
                <div className={`${styles.podiumCard} ${styles['podiumCard--empty']}`} />
              )}
            </div>
          )
        )}

        {/* Full Cohort Leaderboard Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              جدول ترتيب طلاب الدفعة ({data?.totalParticipants || 0} طالب)
            </h3>
          </div>

          {loading ? (
            <div className={styles.loadingTable}>
              <Skeleton variant="card" height="120px" />
            </div>
          ) : cohortList.length === 0 ? (
            <div className={styles.emptyTable}>
              لا توجد درجات مسجلة في لوحة المتصدرين حتى الآن
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الترتيب</th>
                    <th>الطالب</th>
                    <th>كود الطالب</th>
                    <th>المهام المقيمة</th>
                    <th>إجمالي النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortList.map((st) => (
                    <tr
                      key={st.studentId}
                      className={st.isCurrentUser ? styles.myRow : ''}
                    >
                      <td>
                        <span className={`${styles.rankPill} ${st.rank <= 3 ? styles[`rankPill--top${st.rank}`] : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {st.rank === 1 && <Trophy size={13} color="#F59E0B" />}
                          {st.rank === 2 && <Medal size={13} color="#94A3B8" />}
                          {st.rank === 3 && <Medal size={13} color="#CD7F32" />}
                          <span>#{st.rank}</span>
                        </span>
                      </td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.tableAvatar}>
                            {st.fullName.slice(0, 1)}
                          </div>
                          <span className={styles.tableName}>
                            {st.fullName} {st.isCurrentUser && '(أنت)'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.tableCode} dir="ltr">
                          {st.studentCode}
                        </span>
                      </td>
                      <td>
                        <span className={styles.tableTasks}>
                          {st.tasksCompleted} مهام
                        </span>
                      </td>
                      <td>
                        <span className={styles.tablePoints}>
                          {st.totalPoints} نقطة
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
