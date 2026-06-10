import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, DollarSign, MapPin, Package, RefreshCw, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrdersRequest, placeBidRequest, assignOrderRequest } from '../api/orders';
import { getVehiclesRequest, getDriversRequest } from '../api/fleet';
import Modal from '../components/Modal';
import {
  ORDER_STATUSES,
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

const FILTERS = ['all', 'PUBLISHED', 'NEGOTIATION', 'APPROVED', 'ASSIGNED', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DROP', 'DELIVERED', 'COMPLETED'];

export default function OrdersPage() {
  const { user, showToast } = useApp();
  const userId = user?._id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
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
      setOrders(normalizeList(data));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка загрузки маршрутов'));
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

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [filter, orders],
  );

  const onBid = async () => {
    if (!bidOrder) return;
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

  const onAssign = async () => {
    if (!assignOrder) return;
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
      showToast('Рейс назначен');
      setAssignOrder(null);
      await Promise.all([loadOrders(), loadFleet()]);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось назначить'));
    } finally {
      setAssignLoading(false);
    }
  };

  const openBid = (order) => {
    setBidAmount('');
    setBidComment('');
    setBidOrder(order);
  };

  const openAssign = (order) => {
    setAssignOrder(order);
    setSelectedVehicleId((current) => current || vehicles[0]?._id || '');
    setSelectedDriverId((current) => current || drivers[0]?._id || '');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Маршруты</h1>
          <p className="page-subtitle">Таблица заказов с торгами, назначениями и статусами рейса</p>
        </div>
        <button className="btn btn-primary" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Обновляю...' : 'Обновить'}
        </button>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((status) => {
          const meta = status === 'all' ? { label: 'Все' } : ORDER_STATUSES[status];
          const count = status === 'all' ? orders.length : orders.filter((order) => order.status === status).length;

          return (
            <button key={status} className={`filter-tab ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
              {meta?.label || status} <span className="count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Package size={40} /><p>Нет заказов</p></div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Заказ</th>
                <th>Маршрут</th>
                <th>Груз</th>
                <th>Вес</th>
                <th>Цена</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
                <th aria-label="details" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = getStatus(order.status);
                const cargo = getOrderCargo(order);
                const route = getOrderRoute(order);
                const vehicle = getOrderVehicle(order);
                const driver = getOrderDriver(order);
                const isExpanded = expandedId === order._id;

                return (
                  <Fragment key={order._id}>
                    <tr className="clickable-row" onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                      <td className="font-bold">{orderCode(order)}</td>
                      <td>
                        <div className="route-cell">
                          <MapPin size={14} />
                          <span>{route.from?.city || '?'}</span>
                          <ArrowRight size={12} />
                          <span>{route.to?.city || '?'}</span>
                        </div>
                      </td>
                      <td>{cargo.description || '—'}</td>
                      <td>{formatWeight(cargo.weight)}</td>
                      <td className="accent-text font-bold">{formatMoney(getOrderPrice(order), order.pricing?.currency || 'RUB')}</td>
                      <td className="text-muted">{formatDate(order.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><span className={`badge badge-${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div className="table-actions">
                          {['PUBLISHED', 'NEGOTIATION'].includes(order.status) && (
                            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openBid(order); }}>
                              <DollarSign size={12} /> Ставка
                            </button>
                          )}
                          {order.status === 'APPROVED' && (
                            <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); openAssign(order); }}>
                              <Truck size={12} /> Назначить
                            </button>
                          )}
                        </div>
                      </td>
                      <td>{isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="expanded-cell">
                          <div className="expanded-grid">
                            <div>
                              <div className="micro-label">Откуда</div>
                              <div className="font-medium text-sm mt-2">{route.from?.city || '?'}</div>
                              <div className="text-xs text-muted">{route.from?.address || ''}</div>
                            </div>
                            <div>
                              <div className="micro-label">Куда</div>
                              <div className="font-medium text-sm mt-2">{route.to?.city || '?'}</div>
                              <div className="text-xs text-muted">{route.to?.address || ''}</div>
                            </div>
                            <div>
                              <div className="micro-label">Груз</div>
                              <div className="font-medium text-sm mt-2">{cargo.description || '—'}</div>
                              <div className="text-xs text-muted">{formatWeight(cargo.weight)} · {formatVolume(cargo.volume)}</div>
                            </div>
                            <div>
                              <div className="micro-label">Исполнение</div>
                              <div className="font-medium text-sm mt-2">{vehicle?.brand || 'Машина не назначена'}</div>
                              <div className="text-xs text-muted">{vehicle?.plateNumber || ''}{driver?.name ? ` · ${driver.name}` : ''}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
          <button className="btn btn-primary w-full" onClick={onBid} disabled={bidLoading}>{bidLoading ? 'Отправка...' : 'Отправить'}</button>
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
