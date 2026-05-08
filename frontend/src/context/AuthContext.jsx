import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { googleSignIn, getGoogleClientId, logoutAPI } from '../api/chat';
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [authError, setAuthError] = useState(null);
  const googleInitialized = useRef(false);
  useEffect(() => {
    const saved = localStorage.getItem('aivorax-ai-user');
    const token = localStorage.getItem('aivorax-token');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {  }
    }
    setIsAuthLoading(false);
  }, []);
  useEffect(() => {
    getGoogleClientId().then(id => {
      if (id) setGoogleClientId(id);
    });
  }, []);
  useEffect(() => {
    if (user) {
      localStorage.setItem('aivorax-ai-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aivorax-ai-user');
      localStorage.removeItem('aivorax-token');
    }
  }, [user]);
  const handleGoogleCredential = useCallback(async (response) => {
    setAuthError(null);
    try {
      const result = await googleSignIn(response.credential);
      if (result.token) {
        localStorage.setItem('aivorax-token', result.token);
      }
      const googleUser = {
        id: result.user.id,
        name: result.user.username,
        email: result.user.email,
        avatar: result.user.avatar,
        provider: 'google',
      };
      setUser(googleUser);
      setShowAuthModal(false);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setAuthError(err.response?.data?.detail || 'Google sign-in failed. Please try again.');
    }
  }, []);
  const initializeGoogle = useCallback(() => {
    if (!googleClientId) return false;
    if (!window.google?.accounts?.id) return false;
    if (googleInitialized.current) return true;
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
      });
      googleInitialized.current = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
      return false;
    }
  }, [googleClientId, handleGoogleCredential]);
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    let attempts = 0;
    while (!window.google?.accounts?.id && attempts < 20) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }
    if (!googleClientId) {
      setAuthError('Google Client ID not configured. Please add google_client_id to config.yaml');
      return;
    }
    if (!window.google?.accounts?.id) {
      setAuthError('Google Sign-In library failed to load. Check your internet connection.');
      return;
    }
    const ready = initializeGoogle();
    if (!ready) {
      setAuthError('Failed to initialize Google Sign-In.');
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('One Tap not displayed, reason:', notification.getNotDisplayedReason());
        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 350,
          });
        }
      }
      if (notification.isSkippedMoment()) {
        console.log('One Tap skipped, reason:', notification.getSkippedReason());
      }
    });
  }, [googleClientId, initializeGoogle]);
  const renderGoogleButton = useCallback((containerId) => {
    if (!googleClientId || !window.google?.accounts?.id) return;
    initializeGoogle();
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 350,
        logo_alignment: 'left',
      });
    }
  }, [googleClientId, initializeGoogle]);
  const signInAsGuest = useCallback((name, email) => {
    setAuthError(null);
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: name || 'Guest User',
      email: email || '',
      avatar: null,
      provider: 'guest',
    };
    setUser(guestUser);
    setShowAuthModal(false);
    return guestUser;
  }, []);
  const signOut = useCallback(async () => {
    try {
      await logoutAPI();
    } catch {  }
    if (user?.provider === 'google' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch {  }
    }
    setUser(null);
    localStorage.removeItem('aivorax-ai-user');
    localStorage.removeItem('aivorax-token');
    googleInitialized.current = false;
  }, [user]);
  const openAuthModal = useCallback(() => {
    setAuthError(null);
    setShowAuthModal(true);
  }, []);
  const closeAuthModal = useCallback(() => {
    setAuthError(null);
    setShowAuthModal(false);
  }, []);
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAuthLoading,
      showAuthModal,
      authError,
      googleClientId,
      signInWithGoogle,
      renderGoogleButton,
      signInAsGuest,
      signOut,
      openAuthModal,
      closeAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}