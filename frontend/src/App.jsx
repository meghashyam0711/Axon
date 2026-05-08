import { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModelProvider } from './context/ModelContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import AuthModal from './components/AuthModal';
import { ToastContainer } from './components/Toast';
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState([]);
  const { showAuthModal } = useAuth();
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      {}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={toggleSidebar} />
        <ChatArea onToast={addToast} />
      </div>
      {}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {}
      {showAuthModal && <AuthModal />}
    </div>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModelProvider>
          <ChatProvider>
            <AppLayout />
          </ChatProvider>
        </ModelProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}