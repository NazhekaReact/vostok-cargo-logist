export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vosto-cargo-back-production-10e2.up.railway.app';

export const ORDER_STATUSES = {
  DRAFT: { label: 'Черновик', cls: 'gray' },
  PUBLISHED: { label: 'Опубликован', cls: 'blue' },
  NEGOTIATION: { label: 'Торг', cls: 'orange' },
  APPROVED: { label: 'Принят', cls: 'blue' },
  ASSIGNED: { label: 'Назначен', cls: 'gray' },
  AT_PICKUP: { label: 'На погрузке', cls: 'orange' },
  IN_TRANSIT: { label: 'В пути', cls: 'green' },
  AT_DROP: { label: 'На выгрузке', cls: 'orange' },
  DELIVERED: { label: 'Доставлен', cls: 'gray' },
  COMPLETED: { label: 'Закрыт', cls: 'gray' },
  CANCELED: { label: 'Отменён', cls: 'red' },
};

export const ACTIVE_ORDER_STATUSES = [
  'PUBLISHED',
  'NEGOTIATION',
  'APPROVED',
  'ASSIGNED',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DROP',
];

export const VEHICLE_TYPE_LABELS = {
  TRUCK_5T: 'Грузовик 5 т',
  TRUCK_10T: 'Грузовик 10 т',
  TRUCK_20T: 'Фура 20 т',
  REF: 'Рефрижератор',
  VAN: 'Фургон',
  FLATBED: 'Бортовой',
  SPECIAL: 'Спецтехника',
};

export const VEHICLE_STATUS_LABELS = {
  AVAILABLE: 'Свободна',
  IN_USE: 'В рейсе',
  MAINTENANCE: 'Ремонт',
  DECOMMISSIONED: 'Списана',
};

export const getStatus = (status) => ORDER_STATUSES[status] || { label: status || '—', cls: 'gray' };

export const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const getOrderCargo = (order = {}) => {
  if (order.cargoDetails) return order.cargoDetails;
  if (order.cargo && typeof order.cargo === 'object') return order.cargo;

  return {
    description: order.cargo || order.aiAnalysis?.detectedCargo?.type || '',
    weight: order.weight ?? order.aiAnalysis?.detectedCargo?.weight,
    volume: order.volume ?? order.aiAnalysis?.detectedCargo?.volume,
  };
};

export const getOrderRoute = (order = {}) => ({
  from: order.route?.from || { city: order.from, address: order.from },
  to: order.route?.to || { city: order.to, address: order.to },
});

export const getOrderVehicle = (order = {}) => (
  order.executor?.vehicle || order.assignedVehicle || order.vehicle || null
);

export const getOrderDriver = (order = {}) => (
  order.executor?.driver || order.assignedDriver || order.driver || null
);

export const getOrderPrice = (order = {}) => (
  order.pricing?.finalPrice || order.pricing?.customerOffer || order.price || order.rate || null
);

export const orderCode = (order = {}) => {
  if (order.orderNumber) return `VC-${String(order.orderNumber).padStart(5, '0')}`;
  return `VC-${order._id?.slice(-8).toUpperCase() || '—'}`;
};

export const formatDate = (value, options = { day: 'numeric', month: 'short' }) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', options);
};

export const formatMoney = (value, currency = 'RUB') => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Дог.';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatWeight = (weightKg) => {
  const value = Number(weightKg);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1000) return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value / 1000)} т`;
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} кг`;
};

export const formatVolume = (volume) => {
  const value = Number(volume);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)} м³`;
};

export const capacityPercent = (cargoWeightKg, vehicleWeightKg) => {
  const cargo = Number(cargoWeightKg);
  const vehicle = Number(vehicleWeightKg);
  if (!Number.isFinite(cargo) || cargo <= 0) return 0;
  const base = Number.isFinite(vehicle) && vehicle > 0 ? vehicle : 20000;
  return Math.min(100, Math.round((cargo / base) * 100));
};

export const getApiErrorMessage = (err, fallback = 'Ошибка сервера') => (
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  fallback
);
