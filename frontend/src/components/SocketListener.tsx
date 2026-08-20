import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';

export default function SocketListener() {
  const { isAuthenticated, token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.estado_cuenta === 'suspendida' && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(API, { auth: { token } });

    // 🔥 Eventos del Admin
    socket.on('admin-action', (data: { type: string; message: string }) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: data.type === 'baneada' ? 'error' 
                : data.type === 'rol_actualizado' ? 'success' 
                : 'warning', 
          message: data.message 
        }
      }));

      if (data.type === 'baneada') {
        logout();
        navigate('/', { replace: true });
      } else if (data.type === 'suspendida') {
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } else if (data.type === 'rol_actualizado') {
        // 🔥 Recargamos la página para que el rol se actualice en el localStorage
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    });

    // 🔥 Eventos de solicitudes de amistad
    socket.on('solicitud-aceptada', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'success', 
          message: '✅ Tu solicitud de amistad ha sido aceptada.' 
        }
      }));
    });

    socket.on('solicitud-rechazada', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'error', 
          message: '❌ Tu solicitud de amistad ha sido rechazada.' 
        }
      }));
    });

    socket.on('solicitud-cancelada', (data: any) => {
      // Esto es para el receptor, pero podemos mostrar un aviso suave
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'warning', 
          message: '⚠️ El usuario ha cancelado la solicitud de amistad.' 
        }
      }));
    });

    socket.on('nueva-solicitud', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'info', 
          message: `📩 Has recibido una solicitud de amistad de ${data.emisor.nickname}.` 
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, logout, navigate, location.pathname]);

  return null;
}