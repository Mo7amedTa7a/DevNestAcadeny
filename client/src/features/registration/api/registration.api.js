import api from '@/lib/axios';

/**
 * Submit student registration for a course cohort.
 * @param {object} registrationData
 */
export const submitRegistration = async (registrationData) => {
  const { data } = await api.post('/registrations', registrationData);
  return data;
};
