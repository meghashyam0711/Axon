import { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  sendMessage as apiSendMessage,
  streamMessage as apiStreamMessage,
  fetchHistory,
  fetchSession,
  createNewSession,
  deleteSession,
  uploadFile as apiUploadFile,
} from '../api/chat';
const ChatContext = createContext();
export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef(null);
  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);
  const startNewChat = useCallback(async () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);
  const loadSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSession(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load conversation.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  const sendMessage = useCallback(async (text, modelId = null) => {
    if (!text.trim()) return;
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    const aiMsgPlaceholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: modelId,
      isStreaming: true,
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);
    let accumulatedText = '';
    let sessionId = currentSessionId;
    apiStreamMessage(
      text,
      currentSessionId,
      modelId,
      (chunk, sessionInfo) => {
        accumulatedText += chunk;
        setStreamingContent(accumulatedText);
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: accumulatedText,
            };
          }
          return updated;
        });
        if (sessionInfo?.session_id && !sessionId) {
          sessionId = sessionInfo.session_id;
          setCurrentSessionId(sessionId);
        }
      },
      async (payload, sessionInfo) => {
        setIsLoading(false);
        setStreamingContent('');
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: accumulatedText,
              model: payload?.model || modelId,
              isStreaming: false,
              timestamp: new Date().toISOString(),
            };
          }
          return updated;
        });
        await loadHistory();
      },
      (err) => {
        console.error('Stream error:', err);
        setIsLoading(false);
        setStreamingContent('');
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: accumulatedText || `❌ **Error:** ${err.message || 'Connection failed.'}\n\nPlease check your backend server is running at \`http://127.0.0.1:8000\``,
              isError: !accumulatedText,
              isStreaming: false,
            };
          }
          return updated;
        });
      }
    );
  }, [currentSessionId, loadHistory]);
  const uploadFileMessage = useCallback(async (file, message = '') => {
    if (!file) return;
    const userContent = message
      ? `${message}\n\n📎 *Attached: ${file.name}*`
      : `📎 *Uploaded: ${file.name}* — Summarize this document.`;
    const userMsg = {
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiUploadFile(file, message);
      const aiMsg = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        model: response.model,
        meta: {
          filename: response.filename,
          wordCount: response.word_count,
        },
      };
      setMessages(prev => [...prev, aiMsg]);
      if (response.session_id && !currentSessionId) {
        setCurrentSessionId(response.session_id);
      }
      await loadHistory();
      return response;
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'File upload failed.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Upload Error:** ${errorMsg}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, loadHistory]);
  const regenerateLastMessage = useCallback(async (modelId = null) => {
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    const actualIndex = messages.length - 1 - lastUserMsgIndex;
    const lastUserMsg = messages[actualIndex];
    setMessages(prev => prev.slice(0, actualIndex));
    await sendMessage(lastUserMsg.content, modelId);
  }, [messages, sendMessage]);
  const removeSession = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [currentSessionId]);
  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      messages,
      isLoading,
      error,
      streamingContent,
      loadHistory,
      startNewChat,
      loadSession,
      sendMessage,
      uploadFileMessage,
      regenerateLastMessage,
      removeSession,
      setError,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}