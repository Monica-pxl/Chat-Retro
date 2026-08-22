import { useState, useEffect, useMemo, useRef } from 'react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { salasService, type Sala } from '../services/salas.service';
import { adminService } from '../services/admin.service';
import '../styles/admin.css';
import { useAuth } from '../context/AuthContext';
import { io, type Socket } from 'socket.io-client';

const API = 'http://localhost:3000';

export default function AdminSalasPage() {
  const { token } = useAuth();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accionando, setAccionando] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // 🔥 FILTROS
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'general_anual' | 'epoca_estilo'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'abierta' | 'cerrada'>('todos');
  const [filtroEpoca, setFiltroEpoca] = useState<'todos' | '90s' | '2000s'>('todos');

  const socketRef = useRef<Socket | null>(null);

  // ── TOAST ──
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── SOCKET PARA TIEMPO REAL ──
  useEffect(() => {
    if (!token) return;

    const socket = io(API, { auth: { token } });
    socketRef.current = socket;

    socket.on('sala-estado-cambiado', (data: { salaId: number; cerrada: boolean; nombre: string }) => {
      console.log('📩 AdminSalasPage - Cambio de sala recibido:', data);
      setSalas(prev => prev.map(sala =>
        sala.id === data.salaId ? { ...sala, cerrada: data.cerrada } : sala
      ));
      setToast({
        type: 'ok',
        msg: `Sala "${data.nombre}" ${data.cerrada ? 'cerrada' : 'abierta'} por administrador.`
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ── CARGAR SALAS ──
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    salasService.getSalas()
      .then((data) => setSalas(data))
      .catch(() => setError('No se pudieron cargar las salas.'))
      .finally(() => setLoading(false));
  }, [token]);

  // ── FILTRADO DE SALAS ──
  const salasFiltradas = useMemo(() => {
    return salas.filter(sala => {
      // Búsqueda por nombre o descripción
      const textoCoincide =
        sala.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (sala.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);

      // Filtro por tipo
      const tipoCoincide = filtroTipo === 'todos' || sala.tipo === filtroTipo;

      // Filtro por estado (abierta/cerrada)
      const estadoCoincide = filtroEstado === 'todos' ||
        (filtroEstado === 'abierta' && !sala.cerrada) ||
        (filtroEstado === 'cerrada' && sala.cerrada);

      // Filtro por época (90s / 2000s)
      let epocaCoincide = true;
      if (filtroEpoca !== 'todos') {
        if (sala.tipo === 'general_anual' && sala.ano) {
          if (filtroEpoca === '90s') epocaCoincide = sala.ano >= 1990 && sala.ano <= 1999;
          else if (filtroEpoca === '2000s') epocaCoincide = sala.ano >= 2000 && sala.ano <= 2009;
        } else if (sala.tipo === 'epoca_estilo' && sala.epoca) {
          if (filtroEpoca === '90s') epocaCoincide = sala.epoca.id === 1;
          else if (filtroEpoca === '2000s') epocaCoincide = sala.epoca.id === 2;
        } else {
          epocaCoincide = false;
        }
      }

      return textoCoincide && tipoCoincide && estadoCoincide && epocaCoincide;
    });
  }, [salas, busqueda, filtroTipo, filtroEstado, filtroEpoca]);

  // ── ABRIR / CERRAR SALA ──
  const toggleSala = async (sala: Sala) => {
    if (!token) return;
    setAccionando(prev => new Set(prev).add(sala.id));
    setToast(null);
    try {
      if (sala.cerrada) {
        await adminService.abrirSala(sala.id);
        // El socket actualizará la lista automáticamente
      } else {
        await adminService.cerrarSala(sala.id);
        // El socket actualizará la lista automáticamente
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cambiar el estado de la sala.';
      setToast({ type: 'err', msg: `${msg}` });
    } finally {
      setAccionando(prev => { const next = new Set(prev); next.delete(sala.id); return next; });
    }
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="ad-page">
        <AppHeader />
        <div className="ad-status">
          <i className="bi bi-arrow-repeat rs-spin" />
          <span>Cargando salas...</span>
        </div>
        <AppFooter />
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    return (
      <div className="ad-page">
        <AppHeader />
        <div className="ad-status ad-status--error">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{error}</span>
        </div>
        <AppFooter />
      </div>
    );
  }

  // ── RENDER ──
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
          <span className="ad-hero__badge"><i className="bi bi-gear-fill" style={{ marginRight: '0.5rem' }} /> Gestión</span>
          <h1 className="ad-hero__title">
            <span>Administración de </span><span className="ad-hero__highlight">Salas</span>
          </h1>
          <p className="ad-hero__sub">
            Visualiza, cierra y reabre las salas de RetroChat.
          </p>
        </div>
      </section>

      <section className="ad-main ad-main--fullwidth ad-main--bajito">

        {/* ── BARRA DE FILTROS ── */}
        <div className="ad-filters-bar">
          <div className="ad-filters-row">
            <div className="ad-filter-group ad-filter-group--grow">
              <i className="bi bi-search ad-filter-icon" />
              <input
                type="text"
                className="ad-filter-input"
                placeholder="Buscar por nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="ad-filter-group">
              <label className="ad-filter-label">Tipo</label>
              <select
                className="ad-filter-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="general_anual">Anuales</option>
                <option value="epoca_estilo">Temáticas</option>
              </select>
            </div>

            <div className="ad-filter-group">
              <label className="ad-filter-label">Estado</label>
              <select
                className="ad-filter-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="abierta">Abiertas</option>
                <option value="cerrada">Cerradas</option>
              </select>
            </div>

            <div className="ad-filter-group">
              <label className="ad-filter-label">Época</label>
              <select
                className="ad-filter-select"
                value={filtroEpoca}
                onChange={(e) => setFiltroEpoca(e.target.value as any)}
              >
                <option value="todos">Todas</option>
                <option value="90s">90s</option>
                <option value="2000s">2000s</option>
              </select>
            </div>

            <span className="ad-filters-count">
              {salasFiltradas.length} de {salas.length}
            </span>
          </div>
        </div>

        {/* ── TABLA ── */}
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Época / Año</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ad-table-empty">
                    No se encontraron salas con esos filtros.
                  </td>
                </tr>
              ) : (
                salasFiltradas.map((sala) => {
                  const ocupado = accionando.has(sala.id);
                  const salasConHorario = [
                    "Fiesta 90s", "Fiesta 2000s",
                    "Tropical 90s", "Tropical 2000s",
                    "Navidad 90s", "Navidad 2000s",
                    "TV Shows 90s", "TV Shows 2000s"
                  ];
                  const noSePuedeAbrir = salasConHorario.includes(sala.nombre);

                  return (
                    <tr key={sala.id}>
                      <td className="ad-table-nick">
                        <i className="bi bi-door-open" style={{ marginRight: '8px', color: 'var(--accent-color)' }} />
                        {sala.nombre}
                      </td>
                      <td>{sala.tipo === 'general_anual' ? 'Anual' : 'Temática'}</td>
                      <td>{sala.ano || sala.epoca?.nombre || '—'}</td>
                      <td className="ad-table-date">{sala.descripcion || '—'}</td>
                      <td>
                        <span className={`ad-badge ad-badge--${sala.cerrada ? 'baneada' : 'activa'}`}>
                          <i className={`bi ${sala.cerrada ? 'bi-lock-fill' : 'bi-check-circle-fill'}`} style={{ marginRight: '4px' }} />
                          {sala.cerrada ? 'Cerrada' : 'Abierta'}
                        </span>
                      </td>
                      <td>
                        <div className="ad-btn-group-acciones">
                          <button
                            className={`ad-btn-accion ${sala.cerrada ? 'ad-btn-accion--activar' : 'ad-btn-accion--suspender'}`}
                            onClick={() => toggleSala(sala)}
                            disabled={ocupado || (noSePuedeAbrir && sala.cerrada)}
                            title={sala.cerrada ? 'Abrir sala' : 'Cerrar sala'}
                          >
                            {ocupado
                              ? <i className="bi bi-arrow-repeat rs-spin" />
                              : sala.cerrada
                                ? <><i className="bi bi-unlock" /> Abrir</>
                                : <><i className="bi bi-lock" /> Cerrar</>
                            }
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
      </section>

      <AppFooter />
    </div>
  );
}