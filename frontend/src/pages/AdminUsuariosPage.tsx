import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { adminService, type AdminUser } from '../services/admin.service';
import { io, type Socket } from 'socket.io-client';
import '../styles/admin.css';

const API = 'http://localhost:3000';

const formatearFecha = (fechaStr: string | null) => {
  if (!fechaStr) return 'Nunca';
  return new Date(fechaStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function AdminUsuariosPage() {
  const { user } = useAuth(); // Solo necesitamos el usuario, no el token
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accionando, setAccionando] = useState<Set<number>>(new Set());
  
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<'todos' | 'user' | 'admin'>('todos');
  const [filtroEstadoCuenta, setFiltroEstadoCuenta] = useState<'todos' | 'activa' | 'suspendida' | 'baneada'>('todos');
  const [filtroConexion, setFiltroConexion] = useState<'todos' | 'en_linea' | 'desconectado'>('todos');

  const socketRef = useRef<Socket | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Usamos el token del localStorage directamente para el socket
    const tokenLocal = localStorage.getItem('rs_token');
    if (!tokenLocal) return;
    
    const socket = io(API, { auth: { token: tokenLocal } });
    socketRef.current = socket;
    socket.on('online-users', (ids: number[]) => {
      setOnlineIds(new Set(ids));
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        // 🔥 El servicio ya coge el token solo
        const data = await adminService.getUsuarios();
        let listaFinal = data;
        const existeAdmin = data.some(u => u.id === user?.id);
        if (!existeAdmin && user) {
          const yoComoAdmin: AdminUser = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            estado: 'en_linea',
            rol: 'admin',
            estado_cuenta: 'activa',
            fecha_creacion: new Date().toISOString(),
            ultima_conexion: new Date().toISOString(),
          };
          listaFinal = [yoComoAdmin, ...data];
        }
        setUsuarios(listaFinal);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, [user]);

  useEffect(() => {
    setUsuarios(prev => prev.map(u => ({
      ...u,
      estado: onlineIds.has(u.id) ? 'en_linea' : 'desconectado' as any
    })));
  }, [onlineIds]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const textoCoincide = 
        u.nickname.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase());

      const rolCoincide = filtroRol === 'todos' || u.rol === filtroRol;
      const estadoCuentaCoincide = filtroEstadoCuenta === 'todos' || u.estado_cuenta === filtroEstadoCuenta;
      const conexionCoincide = filtroConexion === 'todos' || u.estado === filtroConexion;

      return textoCoincide && rolCoincide && estadoCuentaCoincide && conexionCoincide;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstadoCuenta, filtroConexion]);

  // 🔥 AHORA LAS FUNCIONES YA NO PIDEN EL TOKEN
  const cambiarEstado = async (userId: number, nuevoEstado: 'activa' | 'suspendida' | 'baneada') => {
    setAccionando(prev => new Set(prev).add(userId));
    setToast(null);
    try {
      await adminService.cambiarEstadoCuenta(userId, nuevoEstado);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, estado_cuenta: nuevoEstado } : u));
      setToast({ type: 'ok', msg: `Estado actualizado a ${nuevoEstado}` });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cambiar estado';
      setToast({ type: 'err', msg: msg });
    } finally {
      setAccionando(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  const cambiarRol = async (userId: number, nuevoRol: 'user' | 'admin') => {
    setAccionando(prev => new Set(prev).add(userId));
    setToast(null);
    try {
      await adminService.cambiarRol(userId, nuevoRol);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u));
      setToast({ type: 'ok', msg: `Rol actualizado a ${nuevoRol}` });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cambiar rol';
      setToast({ type: 'err', msg: msg });
    } finally {
      setAccionando(prev => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  return (
    <div className="ad-page">
      <AppHeader />

      {toast && (
        <div className={`ad-toast ad-toast--${toast.type}`}>
          <i className={`bi ${toast.type === 'ok' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '0.5rem' }} />
          {toast.msg}
        </div>
      )}

      <section className="ad-hero ad-hero--tall">
        <div className="ad-hero__content">
          <span className="ad-hero__badge">✦ Gestión</span>
          <h1 className="ad-hero__title">
            <span>Administración de </span><span className="ad-hero__highlight">Usuarios</span>
          </h1>
          <p className="ad-hero__sub">
            Visualiza, modifica roles y gestiona el estado de las cuentas.
          </p>
        </div>
      </section>

      <section className="ad-main ad-main--fullwidth ad-main--bajito">
        
        <div className="ad-filters-bar">
          <div className="ad-filters-row">
            <div className="ad-filter-group ad-filter-group--grow">
              <i className="bi bi-search ad-filter-icon" />
              <input
                type="text"
                className="ad-filter-input"
                placeholder="Buscar por nickname o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="ad-filter-group">
              <label className="ad-filter-label">Rol</label>
              <select 
                className="ad-filter-select"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="ad-filter-group">
              <label className="ad-filter-label">Estado</label>
              <select 
                className="ad-filter-select"
                value={filtroEstadoCuenta}
                onChange={(e) => setFiltroEstadoCuenta(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="activa">Activa</option>
                <option value="suspendida">Suspendida</option>
                <option value="baneada">Baneada</option>
              </select>
            </div>
            <div className="ad-filter-group">
              <label className="ad-filter-label">Conexión</label>
              <select 
                className="ad-filter-select"
                value={filtroConexion}
                onChange={(e) => setFiltroConexion(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="en_linea">En línea</option>
                <option value="desconectado">Desconectado</option>
              </select>
            </div>
            <span className="ad-filters-count">
              {usuariosFiltrados.length} de {usuarios.length}
            </span>
          </div>
        </div>

        {loading && (
          <div className="ad-status">
            <i className="bi bi-arrow-repeat rs-spin" />
            <span>Cargando lista de usuarios...</span>
          </div>
        )}

        {error && !loading && (
          <div className="ad-status ad-status--error">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="ad-table-wrapper">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Rol</th>
                  <th>Registro</th>
                  <th>Última conexión</th>
                  <th>Cambiar Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ad-table-empty">
                      No se encontraron usuarios con esos filtros.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(u => {
                    const ocupado = accionando.has(u.id);
                    const isOnline = u.estado === 'en_linea';
                    const esYo = user?.id === u.id;

                    return (
                      <tr key={u.id} className={`ad-table-row ${esYo ? 'ad-table-row--yo' : ''}`}>
                        <td>
                          <div className="ad-user-info">
                            <div className="ad-user-avatar">
                              {u.avatar ? <img src={`http://localhost:3000${u.avatar}`} alt="" /> : <i className="bi bi-person-fill" />}
                            </div>
                            <div className="ad-user-details">
                              <span className="ad-user-nick">
                                {u.nickname}
                                {esYo && <span className="ad-user-yo"> (tú)</span>}
                              </span>
                              <span className="ad-user-status">
                                <span className={`ad-status-dot ad-status-dot--${isOnline ? 'online' : 'offline'}`} />
                                {isOnline ? 'En línea' : 'Desconectado'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="ad-user-email">{u.email}</td>
                        <td>
                          <span className={`ad-badge ad-badge--${u.estado_cuenta}`}>
                            {u.estado_cuenta === 'activa' && <><i className="bi bi-check-circle-fill" /> Activa</>}
                            {u.estado_cuenta === 'suspendida' && <><i className="bi bi-pause-circle-fill" /> Suspendida</>}
                            {u.estado_cuenta === 'baneada' && <><i className="bi bi-shield-slash-fill" /> Baneada</>}
                          </span>
                        </td>
                        <td>
                          <span className={`ad-badge ad-badge--${u.rol}`}>
                            {u.rol === 'admin' ? <><i className="bi bi-shield-fill-check" /> Admin</> : <><i className="bi bi-person-fill" /> User</>}
                          </span>
                        </td>
                        <td className="ad-table-date">{formatearFecha(u.fecha_creacion)}</td>
                        <td className="ad-table-date">{formatearFecha(u.ultima_conexion)}</td>
                        <td>
                          <div className="ad-btn-group-rol">
                            <button 
                              className={`ad-btn-rol ${u.rol === 'user' ? 'ad-btn-rol--active' : ''}`}
                              onClick={() => cambiarRol(u.id, 'user')}
                              disabled={ocupado || u.rol === 'user' || esYo}
                            >
                              User
                            </button>
                            <button 
                              className={`ad-btn-rol ${u.rol === 'admin' ? 'ad-btn-rol--active' : ''}`}
                              onClick={() => cambiarRol(u.id, 'admin')}
                              disabled={ocupado || u.rol === 'admin' || esYo}
                            >
                              Admin
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="ad-btn-group-acciones">
                            <button 
                              className="ad-btn-accion ad-btn-accion--activar"
                              onClick={() => cambiarEstado(u.id, 'activa')}
                              disabled={ocupado || u.estado_cuenta === 'activa' || esYo}
                              title="Activar cuenta"
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                            <button 
                              className="ad-btn-accion ad-btn-accion--suspender"
                              onClick={() => cambiarEstado(u.id, 'suspendida')}
                              disabled={ocupado || u.estado_cuenta === 'suspendida' || esYo}
                              title="Suspender cuenta"
                            >
                              <i className="bi bi-pause-circle" />
                            </button>
                            <button 
                              className="ad-btn-accion ad-btn-accion--banear"
                              onClick={() => cambiarEstado(u.id, 'baneada')}
                              disabled={ocupado || u.estado_cuenta === 'baneada' || esYo}
                              title="Banear cuenta"
                            >
                              <i className="bi bi-shield-slash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}