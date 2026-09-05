import { AuthProvider } from './context/AuthContext';
import { PrivateMessagesProvider } from './context/PrivateMessagesContext';
import AppRouter from './routes/AppRouter';
import SocketListener from './components/SocketListener';
import ToastManager from './components/ToastManager';
import AlertModal from './components/AlertModal';

export default function App() {
  return (
    <AuthProvider>
      <PrivateMessagesProvider>
        <AppRouter>
          <SocketListener />
          <ToastManager />
          <AlertModal />
        </AppRouter>
      </PrivateMessagesProvider>
    </AuthProvider>
  );
}