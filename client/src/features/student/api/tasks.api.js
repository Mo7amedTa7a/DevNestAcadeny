import api from '@/lib/axios';

/**
 * Student tasks API calls
 */

export const getStudentTasks = async (courseId) => {
  const { data } = await api.get('/tasks', {
    params: courseId ? { courseId } : {},
  });
  return data.data;
};

export const submitStudentTask = async (taskId, payload) => {
  const { data } = await api.post(`/tasks/${taskId}/submit`, payload);
  return data.data.submission;
};
