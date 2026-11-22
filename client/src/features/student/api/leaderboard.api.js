import api from '@/lib/axios';

/**
 * Cohort leaderboard API calls
 */

export const getCohortLeaderboard = async (courseId) => {
  const { data } = await api.get('/leaderboard', {
    params: courseId ? { courseId } : {},
  });
  return data.data;
};
