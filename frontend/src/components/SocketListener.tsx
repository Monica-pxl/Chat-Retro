import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';

export default function SocketListener() {
  const { isAuthenticated, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔄 SocketListener - Conectando socket...');
    const socket = io(API, { auth: token ? { token } : {} });

    socket.on('connect', () => {
      console.log('✅ SocketListener - Socket conectado correctamente');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ SocketListener - Error de conexión:', err.message);
    });

    socket.on('admin-action', (data: { type: string; message: string }) => {
      console.log('📩 SocketListener - admin-action recibido:', data);

      if (data.type === 'rol_actualizado') {
        window.dispatchEvent(new CustomEvent('show-alert-modal', {
          detail: {
            variant: 'info',
            icon: 'bi-shield-lock-fill',
            title: 'Tu rol ha cambiado',
            message: data.message,
          }
        }));
        return;
      }

      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: data.type === 'baneada' ? 'error' 
                : data.type === 'activa' ? 'success'
                : 'warning', 
          message: data.message 
        }
      }));

      if (data.type === 'baneada') {
        logout();
        navigate('/', { replace: true });
      } else if (data.type === 'suspendida') {
        updateUser({ estado_cuenta: 'suspendida' });
        // 🔥 Usar window.location en vez de location de react-router
        if (window.location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } else if (data.type === 'activa') {
        updateUser({ estado_cuenta: 'activa' });
      }
    });

    socket.on('sala-estado-cambiado', (data: { salaId: number; cerrada: boolean; nombre: string }) => {
      console.log('📩 SocketListener - sala-estado-cambiado RECIBIDO:', data);
      window.dispatchEvent(new CustomEvent('sala-estado-cambiado', { detail: data }));
    });

    socket.on('solicitud-aceptada', () => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'success', message: 'Tu solicitud de amistad ha sido aceptada.' }
      }));
    });

    socket.on('solicitud-rechazada', () => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'error', message: 'Tu solicitud de amistad ha sido rechazada.' }
      }));
    });

    socket.on('solicitud-cancelada', () => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'warning', message: 'El usuario ha cancelado la solicitud de amistad.' }
      }));
    });

    socket.on('nueva-solicitud', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'info', 
          message: `Has recibido una solicitud de amistad de ${data.emisor.nickname}.` 
        }
      }));
    });

    return () => {
      console.log('🔌 SocketListener - Desconectando socket');
      socket.disconnect();
    };
    // 🔥 Solo depende del token y de si está autenticado. NADA de location, navigate, etc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  return null;
}