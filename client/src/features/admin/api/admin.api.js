import api from '@/lib/axios';

/**
 * Admin API service calls.
 */

// Overview stats
export const getAdminOverview = async () => {
  const { data } = await api.get('/admin/overview');
  return data.data;
};

// Applicants & Registrations
export const getApplicants = async (params = {}) => {
  const { data } = await api.get('/admin/registrations', { params });
  return data.data;
};

export const updateApplicantStatus = async (id, payload) => {
  const { data } = await api.patch(`/admin/registrations/${id}/status`, payload);
  return data.data;
};

export const approvePayment = async (id, payload) => {
  const { data } = await api.post(`/admin/registrations/${id}/approve-payment`, payload);
  return data.data;
};

export const getExportCsvUrl = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return `/api/admin/registrations/export-csv${queryString ? `?${queryString}` : ''}`;
};

// Course settings
export const toggleCourseRegistration = async (courseId) => {
  const { data } = await api.patch(`/admin/courses/${courseId}/toggle-registration`);
  return data.data;
};

// Lessons (Drip release)
export const getCourseLessons = async (courseId) => {
  const { data } = await api.get(`/admin/courses/${courseId}/lessons`);
  return data.data.lessons;
};

export const createLesson = async (payload) => {
  const { data } = await api.post('/admin/lessons', payload);
  return data.data.lesson;
};

export const updateLesson = async (id, payload) => {
  const { data } = await api.put(`/admin/lessons/${id}`, payload);
  return data.data.lesson;
};

export const togglePublishLesson = async (id) => {
  const { data } = await api.patch(`/admin/lessons/${id}/toggle-publish`);
  return data.data.lesson;
};

export const deleteLesson = async (id) => {
  const { data } = await api.delete(`/admin/lessons/${id}`);
  return data;
};

// Students
export const getStudents = async () => {
  const { data } = await api.get('/admin/students');
  return data.data.students;
};

export const resetStudentSession = async (id) => {
  const { data } = await api.patch(`/admin/students/${id}/reset-session`);
  return data;
};

export const toggleStudentActive = async (id) => {
  const { data } = await api.patch(`/admin/students/${id}/toggle-active`);
  return data.data.student;
};

// Announcement Settings
export const getAdminAnnouncement = async () => {
  const { data } = await api.get('/admin/announcement');
  return data.data.announcement;
};

export const updateAdminAnnouncement = async (payload) => {
  const { data } = await api.put('/admin/announcement', payload);
  return data.data.announcement;
};

// All Courses (Admin full view)
export const getAdminCourses = async () => {
  const { data } = await api.get('/admin/courses');
  return data.data.courses;
};

export const updateAdminCourse = async (courseId, payload) => {
  const { data } = await api.patch(`/admin/courses/${courseId}`, payload);
  return data.data.course;
};
