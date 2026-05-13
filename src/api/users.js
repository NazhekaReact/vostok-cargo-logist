import api from './client';

export const saveThemeRequest = async (payload) => {
  const { data } = await api.post('/saveTheme', payload);
  return data;
};

export const saveLanguageRequest = async (payload) => {
  const { data } = await api.post('/saveLang', payload);
  return data;
};

export const saveLocationRequest = async (payload) => {
  const { data } = await api.post('/save-location', payload);
  return data;
};
