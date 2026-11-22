import api from '@/lib/axios';

/**
 * Admin tasks management API calls
 */

export const getAdminTasks = async (courseId) => {
  const { data } = await api.get('/admin/tasks', {
    params: courseId ? { courseId } : {},
  });
  return data.data.tasks;
};

export const createAdminTask = async (payload) => {
  const { data } = await api.post('/admin/tasks', payload);
  return data.data.task;
};

export const updateAdminTask = async (taskId, payload) => {
  const { data } = await api.patch(`/admin/tasks/${taskId}`, payload);
  return data.data.task;
};

export const deleteAdminTask = async (taskId) => {
  const { data } = await api.delete(`/admin/tasks/${taskId}`);
  return data.data;
};

export const getTaskSubmissions = async (taskId) => {
  const { data } = await api.get(`/admin/tasks/${taskId}/submissions`);
  return data.data;
};

export const gradeStudentSubmission = async (submissionId, payload) => {
  const { data } = await api.post(`/admin/tasks/submissions/${submissionId}/grade`, payload);
  return data.data.submission;
};
