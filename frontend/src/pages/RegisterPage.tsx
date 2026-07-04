import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/auth.css';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, nickname);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Error al crear la cuenta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-auth-page rs-auth-page--registro">
      <div className="rs-grid" />
      <AppHeader />

      <main className="rs-auth-main">
        <div className="rs-auth-card rs-auth-card--registro">

          {/* Cabecera */}
          <div className="rs-auth-card__header">
            <i className="bi bi-person-plus rs-auth-card__icon" />
            <h1 className="rs-auth-card__title">Crear cuenta</h1>
            <p className="rs-auth-card__subtitle">Únete a la comunidad de RetroSocial</p>
          </div>

          {/* Error */}
          {error && (
            <div className="rs-auth-error">
              <i className="bi bi-exclamation-circle" />
              {error}
            </div>
          )}

          {/* Formulario */}
          <form className="rs-auth-form" onSubmit={handleSubmit}>
            <div className="rs-auth-field">
              <label className="rs-auth-label">Nickname</label>
              <input
                type="text"
                className="rs-auth-input rs-auth-input--purple"
                placeholder="Tu nombre en RetroSocial"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="rs-auth-field">
              <label className="rs-auth-label">Correo electrónico</label>
              <input
                type="email"
                className="rs-auth-input rs-auth-input--purple"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="rs-auth-field">
              <label className="rs-auth-label">Contraseña</label>
              <input
                type="password"
                className="rs-auth-input rs-auth-input--purple"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="rs-auth-field">
              <label className="rs-auth-label">Confirmar contraseña</label>
              <input
                type="password"
                className="rs-auth-input rs-auth-input--purple"
                placeholder="Repite tu contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="rs-auth-submit rs-auth-submit--purple"
              disabled={loading}
            >
              {loading ? (
                <><i className="bi bi-arrow-repeat rs-spin" /> Creando cuenta...</>
              ) : (
                <><i className="bi bi-person-check" /> Crear cuenta</>
              )}
            </button>
          </form>

          {/* Enlace a login */}
          <p className="rs-auth-footer-link rs-auth-footer-link--purple">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
