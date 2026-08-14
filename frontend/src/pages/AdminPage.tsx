import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { adminService, type AdminStats } from '../services/admin.service';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { token } = useAuth(); 
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        setError('No hay sesión activa.');
        return;
      }

      try {
        setLoading(true);
        const data = await adminService.getEstadisticas(token);
        setStats(data);
        setError('');
      } catch (err: any) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="ad-page">
      <AppHeader />

      {/* ── HERO DEL ADMIN ── */}
      <section className="ad-hero ad-hero--tall">
        <div className="ad-hero__content">
          <span className="ad-hero__badge">✦ Control Panel</span>
          <h1 className="ad-hero__title">
            <span>Panel de </span><span className="ad-hero__highlight">Administración</span>
          </h1>
          <p className="ad-hero__sub">
            Monitoriza el estado de la comunidad, gestiona usuarios y supervisa las salas.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <section className="ad-main">
        {loading && (
          <div className="ad-status">
            <i className="bi bi-arrow-repeat rs-spin" />
            <span>Cargando datos del sistema...</span>
          </div>
        )}

        {error && !loading && (
          <div className="ad-status ad-status--error">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{error}</span>
          </div>
        )}

        {stats && !loading && !error && (
          <>
            {/* ════════════════════════════════════════════
               SECCIÓN 1: RESUMEN GENERAL (ESTADO DE LA APP) 
               ════════════════════════════════════════════ */}
            <div className="ad-section">
              <div className="ad-section__header">
                <i className="bi bi-speedometer2" /> 
                <h2>Resumen General</h2>
              </div>
              
              <div className="ad-grid ad-grid--4cols">
                <div className="ad-card ad-card--total">
                  <div className="ad-card__icon"><i className="bi bi-people-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.usuarios}</span>
                    <span className="ad-card__label">Usuarios Totales</span>
                  </div>
                </div>

                <div className="ad-card ad-card--online">
                  <div className="ad-card__icon"><i className="bi bi-wifi" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.usuariosOnline}</span>
                    <span className="ad-card__label">Conectados Ahora</span>
                    <div className="ad-card__dot ad-card__dot--online" />
                  </div>
                </div>

                <div className="ad-card ad-card--rooms-total">
                  <div className="ad-card__icon"><i className="bi bi-door-open-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.salas}</span>
                    <span className="ad-card__label">Salas Totales</span>
                  </div>
                </div>

                <div className="ad-card ad-card--chats">
                  <div className="ad-card__icon"><i className="bi bi-chat-dots-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.chatsPrivados}</span>
                    <span className="ad-card__label">Chats Privados</span>
                    <span className="ad-card__sub">Hilos de conversación abiertos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════
               SECCIÓN 2: ESTADO DE LA COMUNIDAD 
               ════════════════════════════════════════════ */}
            <div className="ad-section">
              <div className="ad-section__header">
                <i className="bi bi-heart-fill" /> 
                <h2>Salud de la Comunidad</h2>
              </div>
              
              <div className="ad-grid ad-grid--3cols">
                <div className="ad-card ad-card--active">
                  <div className="ad-card__icon"><i className="bi bi-person-check-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.usuariosActivos}</span>
                    <span className="ad-card__label">Usuarios Activos</span>
                    <span className="ad-card__sub">Cuentas con estado "Activa"</span>
                    <div className="ad-card__dot ad-card__dot--active" />
                  </div>
                </div>

                <div className="ad-card ad-card--friends">
                  <div className="ad-card__icon"><i className="bi bi-person-plus-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.amistades}</span>
                    <span className="ad-card__label">Conexiones de Amistad</span>
                    <span className="ad-card__sub">Amistades aceptadas en la plataforma</span>
                  </div>
                </div>

                <div className="ad-card ad-card--rooms">
                  <div className="ad-card__icon"><i className="bi bi-door-open" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.salas}</span>
                    <span className="ad-card__label">Estado de Salas</span>
                    <div className="ad-card__sub">
                      <span className="ad-card__sub-item" style={{ color: '#4ade80' }}><i className="bi bi-check-circle-fill" /> {stats.salasAbiertas} abiertas</span>
                      <span className="ad-card__sub-item" style={{ color: '#f87171' }}><i className="bi bi-lock-fill" /> {stats.salasCerradas} cerradas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════
               SECCIÓN 3: GESTIÓN Y ACCIONES RÁPIDAS 
               ════════════════════════════════════════════ */}
            <div className="ad-section">
              <div className="ad-section__header">
                <i className="bi bi-gear-fill" /> 
                <h2>Gestión Rápida</h2>
              </div>
              
              <div className="ad-grid ad-grid--4cols">
                <div 
                  className="ad-card ad-card--action" 
                  onClick={() => navigate('/admin/usuarios')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ad-card__icon"><i className="bi bi-shield-fill-check" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f1f5f9' }}>Gestionar Usuarios</span>
                    <span className="ad-card__sub">Administrar roles y estados</span>
                  </div>
                </div>

                <div 
                  className="ad-card ad-card--action" 
                  onClick={() => navigate('/admin/salas')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ad-card__icon"><i className="bi bi-house-door-fill" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f1f5f9' }}>Gestionar Salas</span>
                    <span className="ad-card__sub">Abrir o cerrar salas</span>
                  </div>
                </div>

                <div className="ad-card ad-card--suspended">
                  <div className="ad-card__icon"><i className="bi bi-pause-circle" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.usuariosSuspendidos}</span>
                    <span className="ad-card__label">Usuarios Suspendidos</span>
                    <div className="ad-card__dot ad-card__dot--suspended" />
                  </div>
                </div>

                <div className="ad-card ad-card--banned">
                  <div className="ad-card__icon"><i className="bi bi-shield-slash" /></div>
                  <div className="ad-card__data">
                    <span className="ad-card__number">{stats.usuariosBaneados}</span>
                    <span className="ad-card__label">Usuarios Baneados</span>
                    <div className="ad-card__dot ad-card__dot--banned" />
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════
               SECCIÓN 4: NOTICIAS / ACTIVIDAD RECIENTE 
               ════════════════════════════════════════════ */}
            <div className="ad-section">
              <div className="ad-section__header">
                <i className="bi bi-megaphone-fill" /> 
                <h2>Actividad Reciente</h2>
              </div>
              
              <div className="ad-grid ad-grid--1col">
                <div className="ad-card ad-card--news">
                  <div className="ad-card__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    <i className="bi bi-newspaper" />
                  </div>
                  <div className="ad-card__data" style={{ gap: '0.5rem' }}>
                    <span className="ad-card__label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f1f5f9' }}>
                      Estado del sistema
                    </span>
                    <span className="ad-card__sub" style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
                      <strong>{stats.usuarios}</strong> usuarios registrados. <strong>{stats.usuariosOnline}</strong> usuarios conectados en este momento.
                      <br />
                      La comunidad ha establecido <strong>{stats.amistades}</strong> conexiones de amistad y ha iniciado <strong>{stats.chatsPrivados}</strong> conversaciones privadas.
                      <br /><br />
                      <span style={{ color: '#4ade80' }}><i className="bi bi-check-circle-fill" /> Sistema operativo con normalidad.</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <AppFooter />
    </div>
  );
}