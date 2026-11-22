import api from '@/lib/axios';

/**
 * Fetch all public courses.
 */
export const getCourses = async () => {
  const { data } = await api.get('/courses');
  return data.data.courses;
};

/**
 * Fetch single course detail by slug.
 * @param {string} slug
 */
export const getCourseBySlug = async (slug = 'frontend-development') => {
  const { data } = await api.get(`/courses/${slug}`);
  return data.data.course;
};

/**
 * Fetch active hero announcement banner.
 */
export const getActiveAnnouncement = async () => {
  const { data } = await api.get('/courses/announcement/active');
  return data.data.announcement;
};
