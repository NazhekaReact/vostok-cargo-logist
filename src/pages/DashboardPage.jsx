import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Plus, Truck, MapPin, Phone, Mail, DollarSign, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrdersRequest, placeBidRequest, assignOrderRequest } from '../api/orders';
import { getVehiclesRequest, getDriversRequest } from '../api/fleet';
import Modal from '../components/Modal';
import { CARD_TRUCKS, CapacityTruck } from '../components/TruckSvg';

const STATUS_DETAIL = {
  PUBLISHED: { label: 'Опубликован', cls: 'blue' },
  NEGOTIATION: { label: 'Торг', cls: 'orange' },
  APPROVED: { label: 'Принят', cls: 'blue' },
  ASSIGNED: { label: 'Назначен', cls: 'gray' },
  IN_TRANSIT: { label: 'В пути', cls: 'green' },
  DELIVERED: { label: 'Завершён', cls: 'gray' },
};



export default function DashboardPage() {
  const { user, showToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailTab, setDetailTab] = useState('info');

  // Bid
  const [bidOrder, setBidOrder] = useState(null);
  const [bidAmount, setBidAmount] = useState('25000');
  const [bidComment, setBidComment] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  // Assign
  const [assignOrder, setAssignOrder] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const data = await getOrdersRequest({ role: 'LOGISTICIAN', userId: user._id });
      const list = Array.isArray(data) ? data : data.orders || [];
      setOrders(list);
      if (list.length && !selectedOrder) setSelectedOrder(list[0]);
    } catch (err) {
      console.error(err);
      showToast('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const loadFleet = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [v, d] = await Promise.all([getVehiclesRequest(user._id), getDriversRequest(user._id)]);
      setVehicles(Array.isArray(v) ? v : []);
      setDrivers(Array.isArray(d) ? d : []);
      if (Array.isArray(v) && v.length) setSelectedVehicleId(v[0]._id);
      if (Array.isArray(d) && d.length) setSelectedDriverId(d[0]._id);
    } catch (err) { console.error(err); }
  }, [user?._id]);

  useEffect(() => { loadOrders(); loadFleet(); }, [loadOrders, loadFleet]);

  const activeOrders = orders.filter(o => !['DELIVERED'].includes(o.status));
  const allOrders = orders;
  const filtered = filter === 'active' ? activeOrders : allOrders;

  const getStatus = s => STATUS_DETAIL[s] || { label: s || '?', cls: 'gray' };
  const formatDate = d => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const onPlaceBid = async () => {
    if (!bidOrder?._id) return;
    try {
      setBidLoading(true);
      await placeBidRequest(bidOrder._id, { amount: Number(bidAmount), comment: bidComment, logisticianId: user._id, logisticianName: user.name });
      showToast('Ставка отправлена');
      setBidOrder(null);
      await loadOrders();
    } catch { showToast('Ошибка'); } finally { setBidLoading(false); }
  };

  const onAssign = async () => {
    if (!assignOrder?._id) return;
    try {
      setAssignLoading(true);
      await assignOrderRequest(assignOrder._id, { vehicleId: selectedVehicleId || undefined, driverId: selectedDriverId || undefined });
      showToast('Назначено');
      setAssignOrder(null);
      await loadOrders();
    } catch { showToast('Ошибка'); } finally { setAssignLoading(false); }
  };

  const sel = selectedOrder;
  const selCargo = sel?.cargoDetails || sel?.cargo || {};
  const selStatus = sel ? getStatus(sel.status) : null;
  const selPrice = sel?.pricing?.customerOffer || sel?.price || null;
  const capacityPct = selCargo.weight ? Math.min(100, Math.round((selCargo.weight / 20) * 100)) : 0;

  return (
    <div className="app-layout">
      {/* CENTER — Shipment cards */}
      <div className="main-center">
        <div className="page-header">
          <h1 className="page-title">Управление грузами</h1>
          <button className="btn btn-primary" onClick={loadOrders} disabled={loading}>
            <Plus size={16} /> Обновить
          </button>
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Все <span className="count">{allOrders.length}</span>
          </button>
          <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Активные <span className="count">{activeOrders.length}</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><Truck size={40} /><p>Нет грузов</p></div>
        ) : (
          <div className="shipments-grid">
            {filtered.map((order, idx) => {
              const cargo = order.cargoDetails || order.cargo || {};
              const CardTruckIcon = CARD_TRUCKS[idx % CARD_TRUCKS.length];
              return (
                <div key={order._id}
                  className={`shipment-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                  onClick={() => { setSelectedOrder(order); setDetailTab('info'); }}>

                  <div className="shipment-header">
                    <div>
                      <div className="shipment-number-label">Shipment number</div>
                      <div className="shipment-number">VC-{order._id?.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="shipment-truck-img">
                      <CardTruckIcon />
                    </div>
                  </div>

                  <div className="route-line">
                    <div className="route-point">
                      <div className="route-dot origin" />
                      <div>
                        <div className="route-city">{order.route?.from?.city || '?'}</div>
                        <div className="route-address">{order.route?.from?.address || ''}</div>
                      </div>
                    </div>
                    <div className="route-connector" />
                    <div className="route-point">
                      <div className="route-dot dest" />
                      <div>
                        <div className="route-city">{order.route?.to?.city || '?'}</div>
                        <div className="route-address">{order.route?.to?.address || ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="shipment-buyer-section">
                    <div className="shipment-buyer-label">Buyer</div>
                    <div className="shipment-buyer-name">{cargo.description || '—'}</div>
                    <div className="shipment-buyer-company">{cargo.weight || 0} т · {formatDate(order.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — Detail panel */}
      <div className="main-right">
        {sel ? (
          <>
            <div className="detail-header">
              <div className="detail-id">VC-{sel._id?.slice(-8).toUpperCase()}</div>
              <div className={`detail-status ${selStatus.cls}`}>
                <span className="dot" />
                {selStatus.label}
              </div>
            </div>

            <div className="detail-actions">
              {['PUBLISHED', 'NEGOTIATION'].includes(sel.status) && (
                <button className="btn btn-primary btn-sm" onClick={() => { setBidOrder(sel); setBidAmount('25000'); setBidComment(''); }}>
                  <DollarSign size={14} /> Ставка
                </button>
              )}
              {sel.status === 'APPROVED' && (
                <button className="btn btn-success btn-sm" onClick={() => setAssignOrder(sel)}>
                  <Truck size={14} /> Назначить
                </button>
              )}
              <button className="btn btn-outline btn-sm"><Phone size={14} /> Звонок</button>
              <button className="btn btn-outline btn-sm"><Mail size={14} /> Email</button>
            </div>

            <div className="detail-tabs">
              <button className={`detail-tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>Information</button>
              <button className={`detail-tab ${detailTab === 'vehicle' ? 'active' : ''}`} onClick={() => setDetailTab('vehicle')}>Vehicle info</button>
              <button className={`detail-tab ${detailTab === 'company' ? 'active' : ''}`} onClick={() => setDetailTab('company')}>Company</button>
              <button className={`detail-tab ${detailTab === 'billing' ? 'active' : ''}`} onClick={() => setDetailTab('billing')}>Billing</button>
            </div>

            {detailTab === 'info' && (
              <>
                <div className="section-title">Маршрут</div>
                <div className="route-line mb-5">
                  <div className="route-point">
                    <div className="route-dot origin" />
                    <div>
                      <div className="route-city">{sel.route?.from?.city || '?'}</div>
                      <div className="route-address">{sel.route?.from?.address || ''}</div>
                    </div>
                  </div>
                  <div className="route-connector" />
                  <div className="route-point">
                    <div className="route-dot dest" />
                    <div>
                      <div className="route-city">{sel.route?.to?.city || '?'}</div>
                      <div className="route-address">{sel.route?.to?.address || ''}</div>
                    </div>
                  </div>
                </div>

                <div className="section-title">Груз</div>
                <div className="specs-grid mb-5">
                  <div className="spec-item">
                    <div className="spec-label">Груз</div>
                    <div className="spec-value">{selCargo.description || '—'}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Вес</div>
                    <div className="spec-value">{selCargo.weight || 0} т</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Объём</div>
                    <div className="spec-value">{selCargo.volume || 0} м³</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Цена</div>
                    <div className="spec-value" style={{color:'var(--accent)'}}>{selPrice ? `${selPrice}₽` : 'Дог.'}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Дата</div>
                    <div className="spec-value">{formatDate(sel.createdAt)}</div>
                  </div>
                </div>

                <div className="section-title">Загрузка</div>
                <div className="capacity-box">
                  <div className="capacity-bar-wrap">
                    <div className="capacity-bar" style={{ width: `${capacityPct}%` }}>
                      {capacityPct}%
                    </div>
                  </div>
                </div>
              </>
            )}

            {detailTab === 'vehicle' && (
              <div className="vehicle-info-tab">
                <div className="section-title mb-3">Load capacity</div>
                <CapacityTruck percent={capacityPct} />

                <div className="specs-grid mb-5" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
                  <div className="spec-item" style={{textAlign:'left'}}><div className="spec-label">Truck</div><div className="spec-value">Iveco 80E190</div></div>
                  <div className="spec-item" style={{textAlign:'left'}}><div className="spec-label">Weight</div><div className="spec-value">{selCargo.weight || 7340} kg</div></div>
                  <div className="spec-item" style={{textAlign:'left'}}><div className="spec-label">Pallets</div><div className="spec-value">13/20</div></div>
                  <div className="spec-item" style={{textAlign:'left'}}><div className="spec-label">Space</div><div className="spec-value">{capacityPct}% / {100 - capacityPct}%</div></div>
                  <div className="spec-item" style={{textAlign:'left'}}><div className="spec-label">Volume</div><div className="spec-value">{selCargo.volume || 18} м³</div></div>
                </div>

                <div className="section-title mb-3">Route map</div>
                <div className="map-image-box">
                  <img src="/assets/images/route_map.png" alt="Map" />
                </div>
              </div>
            )}

            {detailTab === 'company' && (
              <>
                <div className="section-title">Заказчик</div>
                {sel.customer ? (
                  <div>
                    <div className="font-bold text-sm mb-3">{sel.customer.name}</div>
                    <div className="text-xs text-muted">{sel.customer.email}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">Информация недоступна</div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Truck size={40} />
            <p>Выберите груз для просмотра</p>
          </div>
        )}
      </div>

      {/* Bid Modal */}
      <Modal visible={!!bidOrder} onClose={() => setBidOrder(null)} title="Сделать ставку"
        subtitle={bidOrder ? `${bidOrder.route?.from?.city} → ${bidOrder.route?.to?.city}` : ''}>
        <div className="input-group mb-4">
          <label className="input-label">Сумма (₽)</label>
          <input className="input" type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Комментарий</label>
          <input className="input" placeholder="Опционально" value={bidComment} onChange={e => setBidComment(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary w-full" onClick={onPlaceBid} disabled={bidLoading}>{bidLoading ? 'Отправка...' : 'Отправить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setBidOrder(null)}>Отмена</button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={!!assignOrder} onClose={() => setAssignOrder(null)} title="Назначить машину">
        <div className="input-group mb-4">
          <label className="input-label">Машина</label>
          <select className="select" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
            {vehicles.length === 0 && <option value="">Нет машин</option>}
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.brand} ({v.plateNumber})</option>)}
          </select>
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Водитель</label>
          <select className="select" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}>
            {drivers.length === 0 && <option value="">Нет водителей</option>}
            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
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
