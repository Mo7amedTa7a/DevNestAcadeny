import api from '@/lib/axios';

/**
 * Student assessment API client calls
 */

export const getStudentAssessments = async (courseId) => {
  const { data } = await api.get('/assessments', {
    params: courseId ? { courseId } : {},
  });
  return data.data;
};

export const startAssessmentAttempt = async (assessmentId) => {
  const { data } = await api.post(`/assessments/${assessmentId}/start`);
  return data.data;
};

export const logAntiCheatViolation = async (attemptId, payload) => {
  const { data } = await api.post(`/assessments/${attemptId}/violation`, payload);
  return data.data;
};

export const submitAssessmentAnswers = async (attemptId, payload) => {
  const { data } = await api.post(`/assessments/${attemptId}/submit`, payload);
  return data.data;
};

export const getAttemptReview = async (attemptId) => {
  const { data } = await api.get(`/assessments/${attemptId}/review`);
  return data.data;
};
