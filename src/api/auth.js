import api from './client';

export const loginRequest = async (payload) => {
  const { data } = await api.post('/login', payload);
  return data;
};

export const registerRequest = async (payload) => {
  const { data } = await api.post('/register', payload);
  return data;
};
