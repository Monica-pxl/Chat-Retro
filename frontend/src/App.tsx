import { AuthProvider } from './context/AuthContext';
import { PrivateMessagesProvider } from './context/PrivateMessagesContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <PrivateMessagesProvider>
        <AppRouter />
      </PrivateMessagesProvider>
    </AuthProvider>
  );
}