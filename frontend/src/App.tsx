import { AuthProvider } from './context/AuthContext';
import { PrivateMessagesProvider } from './context/PrivateMessagesContext';
import AppRouter from './routes/AppRouter';
import SocketListener from './components/SocketListener';
import ToastManager from './components/ToastManager';

export default function App() {
  return (
    <AuthProvider>
      <PrivateMessagesProvider>
        <AppRouter>
          <SocketListener />
          <ToastManager />
        </AppRouter>
      </PrivateMessagesProvider>
    </AuthProvider>
  );
}