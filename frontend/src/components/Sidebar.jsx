import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus, MessageSquare, Trash2, ChevronLeft,
  Menu, User as UserIcon, Settings, LogIn
} from 'lucide-react';
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'Last 7 days';
    return 'Older';
  } catch {
    return 'Older';
  }
}
export default function Sidebar({ isOpen, onToggle }) {
  const { sessions, currentSessionId, loadHistory, loadSession, startNewChat, removeSession } = useChat();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  const grouped = {};
  sessions.forEach(s => {
    const group = formatDate(s.created_at);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(s);
  });
  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];
  return (
    <>
      {}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      {}
      <aside className={`fixed lg:relative top-0 left-0 h-full z-40 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-primary)] flex flex-col transition-all duration-300 ${
        isOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden'
      }`}>
        {}
        <div className="p-3 flex items-center gap-2 border-b border-[var(--color-border-primary)]">
          <button
            onClick={() => { startNewChat(); if (window.innerWidth < 1024) onToggle(); }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={onToggle}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
              <p className="text-xs text-[var(--color-text-tertiary)]">No conversations yet</p>
              {!isAuthenticated && (
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 px-4">
                  Sign up to save your chat history across sessions
                </p>
              )}
            </div>
          ) : (
            groupOrder.map(group => {
              if (!grouped[group] || grouped[group].length === 0) return null;
              return (
                <div key={group} className="mb-3">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    {group}
                  </p>
                  {grouped[group].map(session => (
                    <div
                      key={session.session_id}
                      className={`group relative flex items-center rounded-lg mb-0.5 transition-all ${
                        currentSessionId === session.session_id
                          ? 'bg-[var(--color-bg-active)]'
                          : 'hover:bg-[var(--color-bg-hover)]'
                      }`}
                      onMouseEnter={() => setHoveredId(session.session_id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <button
                        onClick={() => { loadSession(session.session_id); if (window.innerWidth < 1024) onToggle(); }}
                        className={`flex-1 text-left py-2.5 px-3 text-sm truncate ${
                          currentSessionId === session.session_id
                            ? 'text-[var(--color-text-primary)] font-medium'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {session.title}
                      </button>
                      {}
                      {hoveredId === session.session_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSession(session.session_id);
                          }}
                          className="absolute right-2 p-1.5 text-[var(--color-text-tertiary)] hover:text-red-400 rounded transition-all"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
        {}
        <div className="p-3 border-t border-[var(--color-border-primary)]">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--color-bg-hover)] cursor-pointer transition-all">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                  {user.provider === 'google' ? `🔵 ${user.email}` : user.provider === 'github' ? '🟣 GitHub' : '👤 Guest'}
                </p>
              </div>
              <Settings className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/20 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                <LogIn className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Sign Up</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Save your chat history</p>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}