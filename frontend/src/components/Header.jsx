import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Menu, Sun, Moon, Sparkles, LogOut } from 'lucide-react';
import ModelSelector from './ModelSelector';
export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut, openAuthModal } = useAuth();
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] flex-shrink-0">
      {}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-all"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[var(--color-text-primary)] text-lg hidden sm:block">
            Axon
          </span>
        </div>
      </div>
      {}
      <div className="flex items-center gap-2">
        {}
        <ModelSelector />
        {}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-all"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {}
        {isAuthenticated ? (
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
              title={user.name}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden sm:block text-xs text-[var(--color-text-secondary)] max-w-[80px] truncate">
                {user.name}
              </span>
            </button>
            {}
            <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-all shadow-md"
          >
            Sign Up
          </button>
        )}
      </div>
    </header>
  );
}