import api from './client';

export const getVehiclesRequest = async (ownerId) => {
  const { data } = await api.get('/api/v1/fleet/vehicles', { params: { ownerId } });
  return data;
};

export const addVehicleRequest = async (payload) => {
  const { data } = await api.post('/api/v1/fleet/vehicles', payload);
  return data;
};

export const assignDriverToVehicleRequest = async (payload) => {
  const { data } = await api.post('/api/v1/fleet/vehicles/assign-driver', payload);
  return data;
};

export const getDriversRequest = async (logisticianId) => {
  const { data } = await api.get('/api/v1/fleet/drivers', { params: { logisticianId } });
  return data;
};

export const addDriverRequest = async (payload) => {
  const { data } = await api.post('/api/v1/fleet/drivers', payload);
  return data;
};
