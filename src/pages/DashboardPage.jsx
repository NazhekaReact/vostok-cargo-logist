import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Route,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrdersRequest, placeBidRequest, assignOrderRequest } from '../api/orders';
import { getVehiclesRequest, getDriversRequest } from '../api/fleet';
import Modal from '../components/Modal';
import { CapacityTruck } from '../components/TruckSvg';
import { CARD_TRUCKS } from '../components/truckIcons';
import {
  ACTIVE_ORDER_STATUSES,
  VEHICLE_TYPE_LABELS,
  capacityPercent,
  formatDate,
  formatMoney,
  formatVolume,
  formatWeight,
  getApiErrorMessage,
  getOrderCargo,
  getOrderDriver,
  getOrderPrice,
  getOrderRoute,
  getOrderVehicle,
  getStatus,
  normalizeList,
  orderCode,
} from '../utils/logistics';

function RouteBlock({ order }) {
  const route = getOrderRoute(order);

  return (
    <div className="route-line">
      <div className="route-point">
        <div className="route-dot origin" />
        <div>
          <div className="route-city">{route.from?.city || route.from?.address || '?'}</div>
          <div className="route-address">{route.from?.address || ''}</div>
        </div>
      </div>
      <div className="route-connector" />
      <div className="route-point">
        <div className="route-dot dest" />
        <div>
          <div className="route-city">{route.to?.city || route.to?.address || '?'}</div>
          <div className="route-address">{route.to?.address || ''}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, showToast } = useApp();
  const userId = user?._id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('active');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [detailTab, setDetailTab] = useState('info');

  const [bidOrder, setBidOrder] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidComment, setBidComment] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  const [assignOrder, setAssignOrder] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getOrdersRequest({ role: 'LOGISTICIAN', userId });
      const list = normalizeList(data);
      setOrders(list);
      setSelectedOrderId((current) => {
        if (current && list.some((order) => order._id === current)) return current;
        return list[0]?._id || '';
      });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка загрузки заказов'));
    } finally {
      setLoading(false);
    }
  }, [showToast, userId]);

  const loadFleet = useCallback(async () => {
    if (!userId) return;
    try {
      const [vehicleData, driverData] = await Promise.all([
        getVehiclesRequest(userId),
        getDriversRequest(userId),
      ]);
      const vehicleList = normalizeList(vehicleData);
      const driverList = normalizeList(driverData);
      setVehicles(vehicleList);
      setDrivers(driverList);
      setSelectedVehicleId((current) => current || vehicleList[0]?._id || '');
      setSelectedDriverId((current) => current || driverList[0]?._id || '');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка загрузки автопарка'));
    }
  }, [showToast, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
      loadFleet();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadOrders, loadFleet]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
    [orders],
  );
  const filtered = filter === 'active' ? activeOrders : orders;
  const selectedOrder = orders.find((order) => order._id === selectedOrderId) || filtered[0] || null;

  const stats = useMemo(() => {
    const inTransit = orders.filter((order) => ['ASSIGNED', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DROP'].includes(order.status)).length;
    const openBids = orders.filter((order) => ['PUBLISHED', 'NEGOTIATION'].includes(order.status)).length;
    const revenue = orders.reduce((sum, order) => sum + (Number(getOrderPrice(order)) || 0), 0);

    return [
      { label: 'Активные рейсы', value: activeOrders.length, icon: Route },
      { label: 'В работе', value: inTransit, icon: Truck },
      { label: 'Открыты торги', value: openBids, icon: DollarSign },
      { label: 'Потенциал', value: formatMoney(revenue), icon: Package },
    ];
  }, [activeOrders.length, orders]);

  const openBidModal = (order) => {
    setBidOrder(order);
    setBidAmount('');
    setBidComment('');
  };

  const onPlaceBid = async () => {
    if (!bidOrder?._id) return;
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Укажите сумму ставки');
      return;
    }

    try {
      setBidLoading(true);
      await placeBidRequest(bidOrder._id, {
        amount,
        comment: bidComment.trim(),
        logisticianId: userId,
      });
      showToast('Ставка отправлена');
      setBidOrder(null);
      await loadOrders();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось отправить ставку'));
    } finally {
      setBidLoading(false);
    }
  };

  const openAssignModal = (order) => {
    setAssignOrder(order);
    setSelectedVehicleId((current) => current || vehicles[0]?._id || '');
    setSelectedDriverId((current) => current || drivers[0]?._id || '');
  };

  const onAssign = async () => {
    if (!assignOrder?._id) return;
    if (!selectedVehicleId && !selectedDriverId) {
      showToast('Выберите машину или водителя');
      return;
    }

    try {
      setAssignLoading(true);
      await assignOrderRequest(assignOrder._id, {
        vehicleId: selectedVehicleId || undefined,
        driverId: selectedDriverId || undefined,
      });
      showToast('Машина назначена');
      setAssignOrder(null);
      await Promise.all([loadOrders(), loadFleet()]);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось назначить'));
    } finally {
      setAssignLoading(false);
    }
  };

  const selectedCargo = getOrderCargo(selectedOrder || {});
  const selectedVehicle = getOrderVehicle(selectedOrder || {});
  const selectedDriver = getOrderDriver(selectedOrder || {});
  const selectedStatus = selectedOrder ? getStatus(selectedOrder.status) : null;
  const selectedCapacity = capacityPercent(selectedCargo.weight, selectedVehicle?.capacity?.weight);
  const selectedCustomer = selectedOrder?.customer;
  const selectedBids = selectedOrder?.bids || [];

  return (
    <div className="app-layout">
      <main className="main-center">
        <div className="page-header">
          <div>
            <h1 className="page-title">Обзор логиста</h1>
            <p className="page-subtitle">Заказы, торги и назначение автопарка из живого API</p>
          </div>
          <button className="btn btn-primary" onClick={loadOrders} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Обновляю...' : 'Обновить'}
          </button>
        </div>

        <div className="kpi-grid">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div className="kpi-item" key={item.label}>
                <div className="kpi-icon"><Icon size={18} /></div>
                <div>
                  <div className="kpi-label">{item.label}</div>
                  <div className="kpi-value">{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Активные <span className="count">{activeOrders.length}</span>
          </button>
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Все <span className="count">{orders.length}</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><Truck size={40} /><p>Нет заказов для логиста</p></div>
        ) : (
          <div className="shipments-grid">
            {filtered.map((order, idx) => {
              const cargo = getOrderCargo(order);
              const status = getStatus(order.status);
              const CardTruckIcon = CARD_TRUCKS[idx % CARD_TRUCKS.length];

              return (
                <button
                  key={order._id}
                  type="button"
                  className={`shipment-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                  onClick={() => { setSelectedOrderId(order._id); setDetailTab('info'); }}
                >
                  <div className="shipment-header">
                    <div>
                      <div className="shipment-number-label">Номер заказа</div>
                      <div className="shipment-number">{orderCode(order)}</div>
                    </div>
                    <span className={`badge badge-${status.cls}`}>{status.label}</span>
                  </div>

                  <div className="shipment-truck-row">
                    <div className="shipment-truck-img"><CardTruckIcon /></div>
                    <div>
                      <div className="shipment-buyer-name">{cargo.description || 'Груз без описания'}</div>
                      <div className="shipment-buyer-company">
                        {formatWeight(cargo.weight)} · {formatVolume(cargo.volume)}
                      </div>
                    </div>
                  </div>

                  <RouteBlock order={order} />

                  <div className="shipment-card-footer">
                    <span>{formatDate(order.createdAt)}</span>
                    <strong>{formatMoney(getOrderPrice(order), order.pricing?.currency || 'RUB')}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <aside className="main-right">
        {selectedOrder ? (
          <>
            <div className="detail-header">
              <div>
                <div className="detail-id">{orderCode(selectedOrder)}</div>
                <div className="detail-subtitle">{formatDate(selectedOrder.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className={`detail-status ${selectedStatus.cls}`}>
                <span className="dot" />
                {selectedStatus.label}
              </div>
            </div>

            <div className="detail-actions">
              {['PUBLISHED', 'NEGOTIATION'].includes(selectedOrder.status) && (
                <button className="btn btn-primary btn-sm" onClick={() => openBidModal(selectedOrder)}>
                  <DollarSign size={14} /> Ставка
                </button>
              )}
              {selectedOrder.status === 'APPROVED' && (
                <button className="btn btn-success btn-sm" onClick={() => openAssignModal(selectedOrder)}>
                  <Truck size={14} /> Назначить
                </button>
              )}
            </div>

            <div className="detail-tabs">
              <button type="button" className={`detail-tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>Сведения</button>
              <button type="button" className={`detail-tab ${detailTab === 'vehicle' ? 'active' : ''}`} onClick={() => setDetailTab('vehicle')}>Транспорт</button>
              <button type="button" className={`detail-tab ${detailTab === 'bids' ? 'active' : ''}`} onClick={() => setDetailTab('bids')}>Ставки</button>
              <button type="button" className={`detail-tab ${detailTab === 'customer' ? 'active' : ''}`} onClick={() => setDetailTab('customer')}>Заказчик</button>
            </div>

            {detailTab === 'info' && (
              <>
                <div className="section-title">Маршрут</div>
                <RouteBlock order={selectedOrder} />

                <div className="section-title">Груз и цена</div>
                <div className="specs-grid detail-specs">
                  <div className="spec-item"><Package size={15} /><div className="spec-label">Груз</div><div className="spec-value">{selectedCargo.description || '—'}</div></div>
                  <div className="spec-item"><Truck size={15} /><div className="spec-label">Вес</div><div className="spec-value">{formatWeight(selectedCargo.weight)}</div></div>
                  <div className="spec-item"><MapPin size={15} /><div className="spec-label">Объём</div><div className="spec-value">{formatVolume(selectedCargo.volume)}</div></div>
                  <div className="spec-item"><DollarSign size={15} /><div className="spec-label">Цена</div><div className="spec-value accent-text">{formatMoney(getOrderPrice(selectedOrder), selectedOrder.pricing?.currency || 'RUB')}</div></div>
                  <div className="spec-item"><Calendar size={15} /><div className="spec-label">Дата</div><div className="spec-value">{formatDate(selectedOrder.createdAt)}</div></div>
                </div>

                <div className="section-title">Загрузка</div>
                <div className="capacity-box">
                  <div className="capacity-bar-wrap">
                    <div className="capacity-bar" style={{ width: `${selectedCapacity}%` }}>{selectedCapacity}%</div>
                  </div>
                </div>
              </>
            )}

            {detailTab === 'vehicle' && (
              <div className="vehicle-info-tab">
                <div className="section-title mb-3">Загрузка кузова</div>
                <CapacityTruck percent={selectedCapacity} />

                <div className="specs-grid detail-specs">
                  <div className="spec-item"><div className="spec-label">Машина</div><div className="spec-value">{[selectedVehicle?.brand, selectedVehicle?.model].filter(Boolean).join(' ') || '—'}</div></div>
                  <div className="spec-item"><div className="spec-label">Госномер</div><div className="spec-value">{selectedVehicle?.plateNumber || '—'}</div></div>
                  <div className="spec-item"><div className="spec-label">Тип</div><div className="spec-value">{VEHICLE_TYPE_LABELS[selectedVehicle?.type] || selectedVehicle?.type || '—'}</div></div>
                  <div className="spec-item"><div className="spec-label">Грузоподъёмность</div><div className="spec-value">{formatWeight(selectedVehicle?.capacity?.weight)}</div></div>
                  <div className="spec-item"><div className="spec-label">Водитель</div><div className="spec-value">{selectedDriver?.name || '—'}</div></div>
                  <div className="spec-item"><div className="spec-label">Телефон</div><div className="spec-value">{selectedDriver?.phone || '—'}</div></div>
                </div>
              </div>
            )}

            {detailTab === 'bids' && (
              <div className="bid-list">
                {selectedBids.length === 0 ? (
                  <div className="text-sm text-muted">Ставок пока нет</div>
                ) : selectedBids.map((bid) => (
                  <div className="bid-item" key={bid._id}>
                    <div>
                      <div className="font-bold text-sm">{bid.logistician?.company?.name || bid.logistician?.name || 'Логист'}</div>
                      <div className="text-xs text-muted">{formatDate(bid.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="bid-price">{formatMoney(bid.amount, bid.currency || 'RUB')}</div>
                    <span className="badge badge-gray">{bid.status}</span>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'customer' && (
              <div className="customer-block">
                <div className="customer-avatar"><User size={18} /></div>
                <div>
                  <div className="font-bold">{selectedCustomer?.company?.name || selectedCustomer?.name || 'Заказчик'}</div>
                  <div className="customer-line"><Mail size={13} /> {selectedCustomer?.email || selectedCustomer?.company?.email || '—'}</div>
                  <div className="customer-line"><Phone size={13} /> {selectedCustomer?.phone || selectedCustomer?.company?.phone || '—'}</div>
                  <div className="customer-line"><Users size={13} /> Рейтинг {selectedCustomer?.rating || '—'}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Truck size={40} />
            <p>Выберите заказ для просмотра</p>
          </div>
        )}
      </aside>

      <Modal
        visible={!!bidOrder}
        onClose={() => setBidOrder(null)}
        title="Сделать ставку"
        subtitle={bidOrder ? `${getOrderRoute(bidOrder).from?.city || '?'} → ${getOrderRoute(bidOrder).to?.city || '?'}` : ''}
      >
        <div className="input-group mb-4">
          <label className="input-label">Сумма</label>
          <input className="input" type="number" min="1" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Комментарий</label>
          <input className="input" value={bidComment} onChange={(e) => setBidComment(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary w-full" onClick={onPlaceBid} disabled={bidLoading}>{bidLoading ? 'Отправка...' : 'Отправить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setBidOrder(null)}>Отмена</button>
        </div>
      </Modal>

      <Modal visible={!!assignOrder} onClose={() => setAssignOrder(null)} title="Назначить рейс">
        <div className="input-group mb-4">
          <label className="input-label">Машина</label>
          <select className="select" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
            <option value="">Без машины</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>{vehicle.brand} · {vehicle.plateNumber}</option>
            ))}
          </select>
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Водитель</label>
          <select className="select" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
            <option value="">Без водителя</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>{driver.name} · {driver.phone || driver.telegramId || driver.email || 'контакт не указан'}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success w-full" onClick={onAssign} disabled={assignLoading}>{assignLoading ? 'Назначаю...' : 'Назначить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setAssignOrder(null)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
