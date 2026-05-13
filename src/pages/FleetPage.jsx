import { useState, useEffect, useCallback } from 'react';
import { Truck, User, Plus, Trash2, MessageCircle, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getVehiclesRequest, getDriversRequest, addVehicleRequest, addDriverRequest, assignDriverToVehicleRequest } from '../api/fleet';
import Modal from '../components/Modal';

export default function FleetPage() {
  const { user, showToast } = useApp();
  const [tab, setTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [brand, setBrand] = useState('Volvo FH');
  const [plateNumber, setPlateNumber] = useState('A 777 AA 777');
  const [vehicleType, setVehicleType] = useState('TRUCK_20T');
  const [weight, setWeight] = useState('20000');
  const [volume, setVolume] = useState('82');
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadFleet = useCallback(async () => {
    if (!user?._id) return;
    try { setLoading(true); const [v, d] = await Promise.all([getVehiclesRequest(user._id), getDriversRequest(user._id)]); setVehicles(Array.isArray(v)?v:[]); setDrivers(Array.isArray(d)?d:[]); }
    catch { showToast('Ошибка загрузки'); } finally { setLoading(false); }
  }, [user?._id]);

  useEffect(() => { loadFleet(); }, [loadFleet]);

  const onAddVehicle = async () => { if (!user?._id) return; try { setSubmitting(true); await addVehicleRequest({ ownerId: user._id, brand: brand.trim(), plateNumber: plateNumber.trim(), type: vehicleType, capacity: { weight: Number(weight)||0, volume: Number(volume)||0 } }); showToast('Машина добавлена'); setShowAddVehicle(false); await loadFleet(); } catch { showToast('Ошибка'); } finally { setSubmitting(false); } };
  const onAddDriver = async () => { if (!user?._id||!telegramId.trim()) { showToast('Введите Telegram ID'); return; } try { setSubmitting(true); await addDriverRequest({ logisticianId: user._id, telegramId: telegramId.trim() }); showToast('Водитель добавлен'); setShowAddDriver(false); setTelegramId(''); await loadFleet(); } catch { showToast('Ошибка'); } finally { setSubmitting(false); } };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Автопарк</h1>
        <button className="btn btn-primary" onClick={() => tab==='vehicles'?setShowAddVehicle(true):setShowAddDriver(true)}>
          <Plus size={16} /> {tab==='vehicles'?'Добавить машину':'Добавить водителя'}
        </button>
      </div>

      <div className="filter-tabs mb-5" style={{ maxWidth: 300 }}>
        <button className={`filter-tab ${tab==='vehicles'?'active':''}`} onClick={() => setTab('vehicles')}>
          <Truck size={14} /> Машины <span className="count">{vehicles.length}</span>
        </button>
        <button className={`filter-tab ${tab==='drivers'?'active':''}`} onClick={() => setTab('drivers')}>
          <User size={14} /> Водители <span className="count">{drivers.length}</span>
        </button>
      </div>

      {tab === 'vehicles' && (vehicles.length === 0 ? <div className="empty-state"><Truck size={40} /><p>Нет машин</p></div> : (
        <div className="fleet-grid">
          {vehicles.map(v => (
            <div key={v._id} className="fleet-card">
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width:44, height:44, borderRadius:10, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)' }}><Truck size={22} /></div>
                <div><div className="font-bold">{v.brand}</div><span className="plate-tag">{v.plateNumber}</span></div>
              </div>
              <div className="specs-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
                <div className="spec-item"><div className="spec-label">Тип</div><div className="spec-value">Фура</div></div>
                <div className="spec-item"><div className="spec-label">Г/П</div><div className="spec-value">{v.capacity?.weight ? v.capacity.weight/1000:0} т</div></div>
                <div className="spec-item"><div className="spec-label">Объём</div><div className="spec-value">{v.capacity?.volume||0} м³</div></div>
              </div>
              <div className="flex items-center justify-between mt-3" style={{ paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div className="flex items-center gap-2"><User size={14} style={{ color:'var(--text-muted)' }} /><span style={{ fontSize:13, color: v.currentDriver?'var(--text)':'var(--text-muted)', fontStyle: v.currentDriver?'normal':'italic' }}>{v.currentDriver?v.currentDriver.name:'Нет водителя'}</span></div>
                <button className="btn btn-outline btn-sm"><Settings size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'drivers' && (drivers.length === 0 ? <div className="empty-state"><User size={40} /><p>Нет водителей</p></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {drivers.map(d => (
            <div key={d._id} className="driver-item">
              <div className="flex items-center gap-3">
                <div className="driver-avatar"><User size={18} /></div>
                <div><div className="font-bold text-sm">{d.name}</div><div className="flex items-center gap-2 mt-2 text-xs text-muted"><MessageCircle size={12} /> {d.telegramId}</div></div>
              </div>
              <button className="btn btn-outline btn-sm"><Trash2 size={14} style={{ color:'var(--red)' }} /></button>
            </div>
          ))}
        </div>
      ))}

      <Modal visible={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Добавить машину">
        <div className="input-group mb-4"><label className="input-label">Марка</label><input className="input" value={brand} onChange={e => setBrand(e.target.value)} /></div>
        <div className="input-group mb-4"><label className="input-label">Гос. номер</label><input className="input" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} /></div>
        <div className="input-group mb-4"><label className="input-label">Тип</label><select className="select" value={vehicleType} onChange={e => setVehicleType(e.target.value)}><option value="TRUCK_20T">Фура 20т</option><option value="TRUCK_10T">Грузовик 10т</option></select></div>
        <div className="input-row mb-4"><div className="input-group"><label className="input-label">Вес (кг)</label><input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div><div className="input-group"><label className="input-label">Объём (м³)</label><input className="input" type="number" value={volume} onChange={e => setVolume(e.target.value)} /></div></div>
        <div className="modal-actions"><button className="btn btn-primary w-full" onClick={onAddVehicle} disabled={submitting}>{submitting?'Сохраняю...':'Сохранить'}</button><button className="btn btn-outline w-full" onClick={() => setShowAddVehicle(false)}>Отмена</button></div>
      </Modal>

      <Modal visible={showAddDriver} onClose={() => setShowAddDriver(false)} title="Добавить водителя">
        <div className="input-group mb-4"><label className="input-label">Telegram ID</label><input className="input" value={telegramId} onChange={e => setTelegramId(e.target.value)} placeholder="123456789" /></div>
        <div className="modal-actions"><button className="btn btn-primary w-full" onClick={onAddDriver} disabled={submitting}>{submitting?'Добавляю...':'Добавить'}</button><button className="btn btn-outline w-full" onClick={() => setShowAddDriver(false)}>Отмена</button></div>
      </Modal>
    </div>
  );
}
