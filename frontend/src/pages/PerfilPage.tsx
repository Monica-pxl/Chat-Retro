import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import { userService, type UserProfile } from '../services/user.service';
import '../styles/perfil.css';
import AppFooter from '../components/AppFooter';

const API = 'http://localhost:3000';

export default function PerfilPage() {
  const { token, isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔥 ESTADO SEPARADO PARA EL INPUT
  const [nicknameInput, setNicknameInput] = useState('');
  const [nickSaving, setNickSaving] = useState(false);
  const [nickMsg, setNickMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cargar perfil
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
    
    userService
      .getMe(token)
      .then(data => {
        setPerfil(data);
        setNicknameInput(data.nickname); // 🔥 Inicializar input con el nickname
        if (data.estado) {
          updateUser({ estado: data.estado });
        }
      })
      .catch(() => setError('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  // 🔥 Cuando el perfil cambia (después de actualizar), sincronizar el input
  useEffect(() => {
    if (perfil) {
      setNicknameInput(perfil.nickname);
    }
  }, [perfil]);

  const handleNickname = async () => {
    if (!token) {
      setNickMsg({ text: 'No autenticado', ok: false });
      return;
    }

    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      setNickMsg({ text: 'El nickname no puede estar vacío', ok: false });
      return;
    }

    if (trimmed === perfil?.nickname) {
      setNickMsg({ text: 'El nickname es el mismo', ok: false });
      return;
    }

    setNickSaving(true);
    setNickMsg(null);

    try {
      const updated = await userService.updateNickname(trimmed, token);
      setPerfil(updated);
      setNicknameInput(updated.nickname);
      updateUser({ nickname: updated.nickname });
      setNickMsg({ text: '✅ Nickname actualizado', ok: true });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al guardar';
      setNickMsg({ text: msg, ok: false });
    } finally {
      setNickSaving(false);
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !token) return;
    setAvatarUploading(true);
    setAvatarMsg(null);
    try {
      const { user: updated } = await userService.uploadAvatar(e.target.files[0], token);
      setPerfil(updated);
      updateUser({ avatar: updated.avatar });
      setAvatarMsg({ text: 'Avatar actualizado', ok: true });
    } catch (err: any) {
      setAvatarMsg({ text: err.response?.data?.error || 'Error al subir', ok: false });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const formatFecha = (str: string) =>
    new Date(str).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

  if (loading) {
    return (
      <div className="rp-page">
        <div className="rs-grid" />
        <AppHeader />
        <div className="rp-center">
          <i className="bi bi-arrow-repeat rs-spin" />
          <span>Cargando perfil...</span>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="rp-page">
        <div className="rs-grid" />
        <AppHeader />
        <div className="rp-center rp-center--error">
          <i className="bi bi-exclamation-circle" />
          <p>{error}</p>
        </div>
        <AppFooter />
      </div>
    );
  }

  const avatarSrc = perfil.avatar ? `${API}${perfil.avatar}` : null;

  return (
    <div className="rp-page">
      <div className="rs-grid" />

      <AppHeader />

      <div className="rp-hero">
        <div className="rp-hero__inner">
          <span className="rp-hero__badge">✦ Tu espacio</span>
          <h1 className="rp-hero__title">Mi Perfil</h1>
          <p className="rp-hero__sub">Visualiza y gestiona tu información personal</p>
        </div>
      </div>

      <main className="rp-main">
        <div className="rp-card">

          <div className="rp-avatar-section">
            <div className="rp-avatar-wrap" onClick={() => fileRef.current?.click()} title="Cambiar avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="rp-avatar-img" />
              ) : (
                <span className="rp-avatar-placeholder">
                  {perfil.nickname.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="rp-avatar-overlay">
                {avatarUploading
                  ? <i className="bi bi-arrow-repeat rs-spin" />
                  : <i className="bi bi-camera-fill" />}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatar}
            />
            {avatarMsg && (
              <p className={`rp-feedback ${avatarMsg.ok ? 'rp-feedback--ok' : 'rp-feedback--err'}`}>
                {avatarMsg.ok ? <i className="bi bi-check-circle" /> : <i className="bi bi-x-circle" />}
                {avatarMsg.text}
              </p>
            )}

            <div className="rp-estado-badge">
              <span className={`rp-dot ${user?.estado === 'en_linea' ? 'rp-dot--on' : 'rp-dot--off'}`} />
              {user?.estado === 'en_linea' ? 'En línea' : 'Desconectado'}
            </div>
          </div>

          <div className="rp-info">

            <h1 className="rp-nombre">{perfil.nickname}</h1>

            {/* Editar nickname - CON ESTADO SEPARADO */}
            <div className="rp-section">
              <label className="rp-label">
                <i className="bi bi-at" /> Nickname
              </label>
              <div className="rp-input-row">
                <input
                  className="rp-input"
                  type="text"
                  value={nicknameInput}
                  maxLength={24}
                  onChange={(e) => {
                    setNicknameInput(e.target.value);
                    setNickMsg(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleNickname()}
                />
                <button
                  className="rp-btn rp-btn--primary"
                  onClick={handleNickname}
                  disabled={nickSaving || !nicknameInput.trim()}
                >
                  {nickSaving ? <i className="bi bi-arrow-repeat rs-spin" /> : 'Guardar'}
                </button>
              </div>
              {nickMsg && (
                <p className={`rp-feedback ${nickMsg.ok ? 'rp-feedback--ok' : 'rp-feedback--err'}`}>
                  {nickMsg.ok ? <i className="bi bi-check-circle" /> : <i className="bi bi-x-circle" />}
                  {nickMsg.text}
                </p>
              )}
            </div>

            <div className="rp-section">
              <label className="rp-label"><i className="bi bi-envelope" /> Email</label>
              <div className="rp-readonly">{perfil.email}</div>
            </div>

            <div className="rp-row-2">
              <div className="rp-section">
                <label className="rp-label"><i className="bi bi-shield" /> Rol</label>
                <div className={`rp-badge ${perfil.rol === 'admin' ? 'rp-badge--admin' : 'rp-badge--user'}`}>
                  <i className={`bi ${perfil.rol === 'admin' ? 'bi-shield-fill' : 'bi-person-fill'}`} />
                  {perfil.rol}
                </div>
              </div>

              <div className="rp-section">
                <label className="rp-label"><i className="bi bi-calendar3" /> Miembro desde</label>
                <div className="rp-readonly">{formatFecha(perfil.fecha_creacion)}</div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}