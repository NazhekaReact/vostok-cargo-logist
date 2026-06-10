import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, MessageCircle, Phone, Plus, RefreshCw, Truck, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  addDriverRequest,
  addVehicleRequest,
  assignDriverToVehicleRequest,
  getDriversRequest,
  getVehiclesRequest,
} from '../api/fleet';
import Modal from '../components/Modal';
import {
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  formatWeight,
  getApiErrorMessage,
  normalizeList,
} from '../utils/logistics';

const VEHICLE_TYPES = ['TRUCK_5T', 'TRUCK_10T', 'TRUCK_20T', 'REF', 'VAN', 'FLATBED', 'SPECIAL'];

export default function FleetPage() {
  const { user, showToast } = useApp();
  const userId = user?._id;
  const [tab, setTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [brand, setBrand] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('TRUCK_20T');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [pallets, setPallets] = useState('');

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [driverIdentifier, setDriverIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [assignVehicle, setAssignVehicle] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadFleet = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [vehicleData, driverData] = await Promise.all([
        getVehiclesRequest(userId),
        getDriversRequest(userId),
      ]);
      setVehicles(normalizeList(vehicleData));
      setDrivers(normalizeList(driverData));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Ошибка загрузки автопарка'));
    } finally {
      setLoading(false);
    }
  }, [showToast, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFleet();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadFleet]);

  const freeDrivers = useMemo(
    () => drivers.filter((driver) => driver.driverProfile?.status !== 'BUSY' || !driver.driverProfile?.currentVehicle),
    [drivers],
  );

  const resetVehicleForm = () => {
    setBrand('');
    setPlateNumber('');
    setVehicleType('TRUCK_20T');
    setWeight('');
    setVolume('');
    setPallets('');
  };

  const onAddVehicle = async () => {
    if (!userId) return;
    if (!brand.trim() || !plateNumber.trim()) {
      showToast('Укажите марку и госномер');
      return;
    }

    const weightKg = Number(weight);
    const volumeM3 = volume ? Number(volume) : undefined;
    const palletCount = pallets ? Number(pallets) : undefined;

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      showToast('Укажите грузоподъёмность в кг');
      return;
    }

    if ((volumeM3 !== undefined && !Number.isFinite(volumeM3)) || (palletCount !== undefined && !Number.isFinite(palletCount))) {
      showToast('Проверьте объём и паллеты');
      return;
    }

    try {
      setSubmitting(true);
      await addVehicleRequest({
        ownerId: userId,
        brand: brand.trim(),
        plateNumber: plateNumber.trim(),
        type: vehicleType,
        capacity: {
          weight: weightKg,
          ...(volumeM3 !== undefined ? { volume: volumeM3 } : {}),
          ...(palletCount !== undefined ? { pallets: palletCount } : {}),
        },
      });
      showToast('Машина добавлена');
      setShowAddVehicle(false);
      resetVehicleForm();
      await loadFleet();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось добавить машину'));
    } finally {
      setSubmitting(false);
    }
  };

  const onAddDriver = async () => {
    if (!userId || !driverIdentifier.trim()) {
      showToast('Введите телефон, email или Telegram ID');
      return;
    }

    try {
      setSubmitting(true);
      await addDriverRequest({
        logisticianId: userId,
        driverIdentifier: driverIdentifier.trim(),
      });
      showToast('Водитель добавлен');
      setShowAddDriver(false);
      setDriverIdentifier('');
      await loadFleet();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось добавить водителя'));
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignDriver = (vehicle) => {
    setAssignVehicle(vehicle);
    setAssignDriverId(vehicle.currentDriver?._id || freeDrivers[0]?._id || drivers[0]?._id || '');
  };

  const onAssignDriver = async () => {
    if (!assignVehicle?._id || !assignDriverId) {
      showToast('Выберите водителя');
      return;
    }

    try {
      setAssignLoading(true);
      await assignDriverToVehicleRequest({
        vehicleId: assignVehicle._id,
        driverId: assignDriverId,
      });
      showToast('Водитель закреплён');
      setAssignVehicle(null);
      await loadFleet();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Не удалось закрепить водителя'));
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Автопарк</h1>
          <p className="page-subtitle">Машины, водители и постоянные закрепления из backend API</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={loadFleet} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Обновляю...' : 'Обновить'}
          </button>
          <button className="btn btn-primary" onClick={() => (tab === 'vehicles' ? setShowAddVehicle(true) : setShowAddDriver(true))}>
            <Plus size={16} /> {tab === 'vehicles' ? 'Машина' : 'Водитель'}
          </button>
        </div>
      </div>

      <div className="kpi-grid fleet-kpis">
        <div className="kpi-item">
          <div className="kpi-icon"><Truck size={18} /></div>
          <div><div className="kpi-label">Машины</div><div className="kpi-value">{vehicles.length}</div></div>
        </div>
        <div className="kpi-item">
          <div className="kpi-icon"><CheckCircle size={18} /></div>
          <div><div className="kpi-label">Свободны</div><div className="kpi-value">{vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length}</div></div>
        </div>
        <div className="kpi-item">
          <div className="kpi-icon"><User size={18} /></div>
          <div><div className="kpi-label">Водители</div><div className="kpi-value">{drivers.length}</div></div>
        </div>
      </div>

      <div className="filter-tabs mb-5">
        <button className={`filter-tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => setTab('vehicles')}>
          <Truck size={14} /> Машины <span className="count">{vehicles.length}</span>
        </button>
        <button className={`filter-tab ${tab === 'drivers' ? 'active' : ''}`} onClick={() => setTab('drivers')}>
          <User size={14} /> Водители <span className="count">{drivers.length}</span>
        </button>
      </div>

      {tab === 'vehicles' && (vehicles.length === 0 ? (
        <div className="empty-state"><Truck size={40} /><p>Нет машин</p></div>
      ) : (
        <div className="fleet-grid">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="fleet-card">
              <div className="fleet-card-head">
                <div className="fleet-icon"><Truck size={22} /></div>
                <div>
                  <div className="font-bold">{vehicle.brand}</div>
                  <span className="plate-tag">{vehicle.plateNumber}</span>
                </div>
                <span className={`badge badge-${vehicle.status === 'AVAILABLE' ? 'green' : 'gray'}`}>{VEHICLE_STATUS_LABELS[vehicle.status] || vehicle.status || '—'}</span>
              </div>

              <div className="specs-grid">
                <div className="spec-item"><div className="spec-label">Тип</div><div className="spec-value">{VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type || '—'}</div></div>
                <div className="spec-item"><div className="spec-label">Г/П</div><div className="spec-value">{formatWeight(vehicle.capacity?.weight)}</div></div>
                <div className="spec-item"><div className="spec-label">Объём</div><div className="spec-value">{vehicle.capacity?.volume ? `${vehicle.capacity.volume} м³` : '—'}</div></div>
                <div className="spec-item"><div className="spec-label">Паллеты</div><div className="spec-value">{vehicle.capacity?.pallets || '—'}</div></div>
              </div>

              <div className="fleet-driver-row">
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>{vehicle.currentDriver?.name || 'Водитель не закреплён'}</span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => openAssignDriver(vehicle)}>Закрепить</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'drivers' && (drivers.length === 0 ? (
        <div className="empty-state"><User size={40} /><p>Нет водителей</p></div>
      ) : (
        <div className="driver-list">
          {drivers.map((driver) => (
            <div key={driver._id} className="driver-item">
              <div className="flex items-center gap-3">
                <div className="driver-avatar"><User size={18} /></div>
                <div>
                  <div className="font-bold text-sm">{driver.name}</div>
                  <div className="driver-meta">
                    {driver.phone && <span><Phone size={12} /> {driver.phone}</span>}
                    {driver.telegramId && <span><MessageCircle size={12} /> {driver.telegramId}</span>}
                    <span>{driver.driverProfile?.status || 'OFFLINE'}</span>
                  </div>
                </div>
              </div>
              <span className="badge badge-gray">{driver.driverProfile?.currentVehicle ? 'Закреплён' : 'Без машины'}</span>
            </div>
          ))}
        </div>
      ))}

      <Modal visible={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Добавить машину">
        <div className="input-group mb-4">
          <label className="input-label">Марка и модель</label>
          <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Госномер</label>
          <input className="input" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Тип</label>
          <select className="select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>{VEHICLE_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
        <div className="input-row mb-4">
          <div className="input-group">
            <label className="input-label">Г/П (кг)</label>
            <input className="input" type="number" min="1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Объём</label>
            <input className="input" type="number" min="0" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </div>
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Паллеты</label>
          <input className="input" type="number" min="0" value={pallets} onChange={(e) => setPallets(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary w-full" onClick={onAddVehicle} disabled={submitting}>{submitting ? 'Сохраняю...' : 'Сохранить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setShowAddVehicle(false)}>Отмена</button>
        </div>
      </Modal>

      <Modal visible={showAddDriver} onClose={() => setShowAddDriver(false)} title="Добавить водителя">
        <div className="input-group mb-4">
          <label className="input-label">Телефон, email или Telegram ID</label>
          <input className="input" value={driverIdentifier} onChange={(e) => setDriverIdentifier(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary w-full" onClick={onAddDriver} disabled={submitting}>{submitting ? 'Добавляю...' : 'Добавить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setShowAddDriver(false)}>Отмена</button>
        </div>
      </Modal>

      <Modal visible={!!assignVehicle} onClose={() => setAssignVehicle(null)} title="Закрепить водителя" subtitle={assignVehicle ? `${assignVehicle.brand} · ${assignVehicle.plateNumber}` : ''}>
        <div className="input-group mb-4">
          <label className="input-label">Водитель</label>
          <select className="select" value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)}>
            <option value="">Выберите водителя</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>{driver.name} · {driver.phone || driver.telegramId || driver.email || 'контакт не указан'}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary w-full" onClick={onAssignDriver} disabled={assignLoading}>{assignLoading ? 'Закрепляю...' : 'Закрепить'}</button>
          <button className="btn btn-outline w-full" onClick={() => setAssignVehicle(null)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
