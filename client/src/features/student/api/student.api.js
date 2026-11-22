import api from '@/lib/axios';

/**
 * Student Portal API service calls.
 */

export const getStudentDashboard = async () => {
  const { data } = await api.get('/student/dashboard');
  return data.data;
};

export const getEnrolledCourseLessons = async (courseId) => {
  const { data } = await api.get(`/student/courses/${courseId}/lessons`);
  return data.data.lessons;
};

export const getSecureLesson = async (lessonId) => {
  const { data } = await api.get(`/student/lessons/${lessonId}`);
  return data.data;
};

export const resolveVideoToken = async (token) => {
  const { data } = await api.post('/student/video/resolve', { token });
  return data.data;
};

export const saveLessonProgress = async (lessonId, payload) => {
  const { data } = await api.post(`/student/lessons/${lessonId}/progress`, payload);
  return data.data;
};
