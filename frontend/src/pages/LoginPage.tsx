import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import '../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-auth-page rs-auth-page--login">
      <div className="rs-grid" />
      <AppHeader />

      <main className="rs-auth-main">
        <div className="rs-auth-card rs-auth-card--login">

          {/* Cabecera */}
          <div className="rs-auth-card__header">
            <i className="bi bi-lock rs-auth-card__icon" />
            <h1 className="rs-auth-card__title">Iniciar sesión</h1>
            <p className="rs-auth-card__subtitle">Accede a tu cuenta de RetroSocial</p>
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
              <label className="rs-auth-label">Correo electrónico</label>
              <input
                type="email"
                className="rs-auth-input rs-auth-input--blue"
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
                className="rs-auth-input rs-auth-input--blue"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="rs-auth-submit rs-auth-submit--blue"
              disabled={loading}
            >
              {loading ? (
                <><i className="bi bi-arrow-repeat rs-spin" /> Entrando...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Iniciar sesión</>
              )}
            </button>
          </form>

          {/* Enlace a registro */}
          <p className="rs-auth-footer-link rs-auth-footer-link--blue">
            ¿No tienes cuenta?{' '}
            <Link to="/registro">Crear cuenta</Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
