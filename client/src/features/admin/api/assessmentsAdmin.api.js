import api from '@/lib/axios';

/**
 * Admin assessments management API client calls
 */

export const getAdminAssessments = async (courseId) => {
  const { data } = await api.get('/admin/assessments', {
    params: courseId ? { courseId } : {},
  });
  return data.data.assessments;
};

export const createAdminAssessment = async (payload) => {
  const { data } = await api.post('/admin/assessments', payload);
  return data.data.assessment;
};

export const updateAdminAssessment = async (id, payload) => {
  const { data } = await api.patch(`/admin/assessments/${id}`, payload);
  return data.data.assessment;
};

export const deleteAdminAssessment = async (id) => {
  const { data } = await api.delete(`/admin/assessments/${id}`);
  return data.data;
};

export const getAssessmentAttempts = async (id) => {
  const { data } = await api.get(`/admin/assessments/${id}/attempts`);
  return data.data;
};
