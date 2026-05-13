import api from './client';

export const getOrdersRequest = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const getOrderByIdRequest = async (id) => {
  const { data } = await api.get(`/api/v1/orders/${id}`);
  return data;
};

export const placeBidRequest = async (orderId, payload) => {
  const { data } = await api.post(`/api/v1/orders/${orderId}/bids`, payload);
  return data;
};

export const acceptBidRequest = async (orderId, bidId) => {
  const { data } = await api.post(`/api/v1/orders/${orderId}/bids/${bidId}/accept`);
  return data;
};

export const assignOrderRequest = async (orderId, payload) => {
  const { data } = await api.patch(`/api/v1/orders/${orderId}/assign`, payload);
  return data;
};
