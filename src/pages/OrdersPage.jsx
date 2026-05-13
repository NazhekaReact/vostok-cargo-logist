import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Package, DollarSign, Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOrdersRequest, placeBidRequest, assignOrderRequest } from '../api/orders';
import { getVehiclesRequest, getDriversRequest } from '../api/fleet';
import Modal from '../components/Modal';

const STATUS_MAP = {
  PUBLISHED: { label: 'Опубликован', cls: 'badge-blue' },
  NEGOTIATION: { label: 'Торг', cls: 'badge-yellow' },
  APPROVED: { label: 'Принят', cls: 'badge-blue' },
  ASSIGNED: { label: 'Назначен', cls: 'badge-gray' },
  IN_TRANSIT: { label: 'В пути', cls: 'badge-green' },
  DELIVERED: { label: 'Завершён', cls: 'badge-gray' },
};

export default function OrdersPage() {
  const { user, showToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [bidOrder, setBidOrder] = useState(null);
  const [bidAmount, setBidAmount] = useState('25000');
  const [bidComment, setBidComment] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selVehicle, setSelVehicle] = useState('');
  const [selDriver, setSelDriver] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?._id) return;
    try { setLoading(true); const d = await getOrdersRequest({ role:'LOGISTICIAN', userId:user._id }); setOrders(Array.isArray(d)?d:d.orders||[]); }
    catch { } finally { setLoading(false); }
  }, [user?._id]);

  const loadFleet = useCallback(async () => {
    if (!user?._id) return;
    try { const [v,d] = await Promise.all([getVehiclesRequest(user._id),getDriversRequest(user._id)]); setVehicles(Array.isArray(v)?v:[]); setDrivers(Array.isArray(d)?d:[]); if(v?.length) setSelVehicle(v[0]._id); if(d?.length) setSelDriver(d[0]._id); }
    catch { }
  }, [user?._id]);

  useEffect(() => { load(); loadFleet(); }, [load, loadFleet]);

  const gs = s => STATUS_MAP[s] || { label:s||'?', cls:'badge-gray' };
  const fd = d => { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?'—':dt.toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'}); };
  const filtered = filter==='all' ? orders : orders.filter(o=>o.status===filter);

  const onBid = async () => { if(!bidOrder) return; try { setBidLoading(true); await placeBidRequest(bidOrder._id,{amount:Number(bidAmount),comment:bidComment,logisticianId:user._id,logisticianName:user.name}); showToast('Ставка отправлена'); setBidOrder(null); await load(); } catch { showToast('Ошибка'); } finally { setBidLoading(false); } };
  const onAssign = async () => { if(!assignOrder) return; try { setAssignLoading(true); await assignOrderRequest(assignOrder._id,{vehicleId:selVehicle||undefined,driverId:selDriver||undefined}); showToast('Назначено'); setAssignOrder(null); await load(); } catch { showToast('Ошибка'); } finally { setAssignLoading(false); } };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Маршруты</h1>
        <button className="btn btn-primary" onClick={load} disabled={loading}>Обновить</button>
      </div>

      <div className="filter-tabs">
        {['all','PUBLISHED','NEGOTIATION','APPROVED','ASSIGNED','IN_TRANSIT','DELIVERED'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {f==='all'?'Все':gs(f).label}
          </button>
        ))}
      </div>

      {filtered.length===0 ? <div className="empty-state"><Package size={40}/><p>Нет заказов</p></div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr>
              <th>Маршрут</th><th>Груз</th><th>Вес</th><th>Цена</th><th>Дата</th><th>Статус</th><th>Действия</th><th style={{width:30}}></th>
            </tr></thead>
            <tbody>
              {filtered.map(order => {
                const st=gs(order.status), cargo=order.cargoDetails||order.cargo||{}, price=order.pricing?.customerOffer||order.price, isExp=expandedId===order._id;
                return (<>
                  <tr key={order._id} style={{cursor:'pointer'}} onClick={()=>setExpandedId(isExp?null:order._id)}>
                    <td><div className="flex items-center gap-2"><MapPin size={14} style={{color:'var(--accent)',flexShrink:0}}/><span className="font-medium">{order.route?.from?.city||'?'}</span><ArrowRight size={12} style={{color:'var(--text-muted)'}}/><span className="font-medium">{order.route?.to?.city||'?'}</span></div></td>
                    <td>{cargo.description||'—'}</td>
                    <td>{cargo.weight||0} т</td>
                    <td style={{color:'var(--accent)',fontWeight:600}}>{price?`${price} ₽`:'Дог.'}</td>
                    <td style={{color:'var(--text-muted)'}}>{fd(order.createdAt)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      {['PUBLISHED','NEGOTIATION'].includes(order.status) && <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();setBidOrder(order)}}><DollarSign size={12}/> Ставка</button>}
                      {order.status==='APPROVED' && <button className="btn btn-success btn-sm" onClick={e=>{e.stopPropagation();setAssignOrder(order)}}><Truck size={12}/> Назначить</button>}
                    </td>
                    <td>{isExp?<ChevronUp size={14} color="var(--text-muted)"/>:<ChevronDown size={14} color="var(--text-muted)"/>}</td>
                  </tr>
                  {isExp && <tr key={`${order._id}-d`}><td colSpan={8} style={{padding:20,background:'var(--bg)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
                      <div><div className="text-xs text-muted" style={{textTransform:'uppercase',fontWeight:600}}>Откуда</div><div className="font-medium text-sm mt-2">{order.route?.from?.city||'?'}</div><div className="text-xs text-muted">{order.route?.from?.address||''}</div></div>
                      <div><div className="text-xs text-muted" style={{textTransform:'uppercase',fontWeight:600}}>Куда</div><div className="font-medium text-sm mt-2">{order.route?.to?.city||'?'}</div><div className="text-xs text-muted">{order.route?.to?.address||''}</div></div>
                      <div><div className="text-xs text-muted" style={{textTransform:'uppercase',fontWeight:600}}>Груз</div><div className="font-medium text-sm mt-2">{cargo.description||'—'}</div><div className="text-xs text-muted">{cargo.weight||0} т · {cargo.volume||0} м³</div></div>
                    </div>
                  </td></tr>}
                </>);
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal visible={!!bidOrder} onClose={()=>setBidOrder(null)} title="Сделать ставку" subtitle={bidOrder?`${bidOrder.route?.from?.city} → ${bidOrder.route?.to?.city}`:''}>
        <div className="input-group mb-4"><label className="input-label">Сумма (₽)</label><input className="input" type="number" value={bidAmount} onChange={e=>setBidAmount(e.target.value)}/></div>
        <div className="input-group mb-4"><label className="input-label">Комментарий</label><input className="input" placeholder="Опционально" value={bidComment} onChange={e=>setBidComment(e.target.value)}/></div>
        <div className="modal-actions"><button className="btn btn-primary w-full" onClick={onBid} disabled={bidLoading}>{bidLoading?'Отправка...':'Отправить'}</button><button className="btn btn-outline w-full" onClick={()=>setBidOrder(null)}>Отмена</button></div>
      </Modal>

      <Modal visible={!!assignOrder} onClose={()=>setAssignOrder(null)} title="Назначить машину">
        <div className="input-group mb-4"><label className="input-label">Машина</label><select className="select" value={selVehicle} onChange={e=>setSelVehicle(e.target.value)}>{vehicles.length===0&&<option>Нет машин</option>}{vehicles.map(v=><option key={v._id} value={v._id}>{v.brand} ({v.plateNumber})</option>)}</select></div>
        <div className="input-group mb-4"><label className="input-label">Водитель</label><select className="select" value={selDriver} onChange={e=>setSelDriver(e.target.value)}>{drivers.length===0&&<option>Нет водителей</option>}{drivers.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>
        <div className="modal-actions"><button className="btn btn-success w-full" onClick={onAssign} disabled={assignLoading}>{assignLoading?'Назначаю...':'Назначить'}</button><button className="btn btn-outline w-full" onClick={()=>setAssignOrder(null)}>Отмена</button></div>
      </Modal>
    </div>
  );
}
