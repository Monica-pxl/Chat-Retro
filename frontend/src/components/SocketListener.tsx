import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';

export default function SocketListener() {
  const { isAuthenticated, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 🔥 Se conecta también sin sesión (invitado) para recibir eventos globales como el cierre de salas en tiempo real
    console.log('🔄 SocketListener - Conectando socket...');
    const socket = io(API, { auth: token ? { token } : {} });

    socket.on('connect', () => {
      console.log('✅ SocketListener - Socket conectado correctamente');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ SocketListener - Error de conexión:', err.message);
    });

    // 🔥 Eventos del Admin
    socket.on('admin-action', (data: { type: string; message: string }) => {
      console.log('📩 SocketListener - admin-action recibido:', data);

      if (data.type === 'rol_actualizado') {
        // 🔥 Mensaje persistente en el centro de la pantalla: nada de recargar solo, el usuario debe cerrar sesión y volver a entrar
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
        // 🔥 Actualiza el estado local YA, para que los checks de la UI (botones, salas, mensajes) reaccionen al instante
        updateUser({ estado_cuenta: 'suspendida' });
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      } else if (data.type === 'activa') {
        // 🔥 El admin quitó la suspensión: reflejarlo YA, sin esperar a un nuevo login
        updateUser({ estado_cuenta: 'activa' });
      }
    });

    // 🔥 NUEVO: Escuchar cambios de estado de salas
    socket.on('sala-estado-cambiado', (data: { salaId: number; cerrada: boolean; nombre: string }) => {
      console.log('📩 SocketListener - sala-estado-cambiado RECIBIDO:', data);
      window.dispatchEvent(new CustomEvent('sala-estado-cambiado', {
        detail: data
      }));
    });

    // 🔥 Eventos de solicitudes de amistad
    socket.on('solicitud-aceptada', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'success', 
          message: 'Tu solicitud de amistad ha sido aceptada.' 
        }
      }));
    });

    socket.on('solicitud-rechazada', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'error', 
          message: 'Tu solicitud de amistad ha sido rechazada.' 
        }
      }));
    });

    socket.on('solicitud-cancelada', (data: any) => {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          type: 'warning', 
          message: 'El usuario ha cancelado la solicitud de amistad.' 
        }
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
  }, [isAuthenticated, token, logout, updateUser, navigate, location.pathname]);

  return null;
}