import axios from 'axios';
const API_BASE = 'http://127.0.0.1:8000';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aivorax-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export async function sendOTP(email) {
  const { data } = await api.post('/auth/send-otp', { email });
  return data;
}
export async function verifyOTP(email, otp, username, provider = 'email') {
  const { data } = await api.post('/auth/verify-otp', { email, otp, username, provider });
  return data;
}
export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
export async function logoutAPI() {
  const { data } = await api.post('/auth/logout');
  return data;
}
export async function googleSignIn(credential) {
  const { data } = await api.post('/auth/google', { credential });
  return data;
}
export async function getGoogleClientId() {
  try {
    const { data } = await api.get('/auth/google-client-id');
    return data.client_id || '';
  } catch {
    return '';
  }
}
export async function sendMessage(message, sessionId = null, modelId = null) {
  const payload = { message };
  if (sessionId) payload.session_id = sessionId;
  if (modelId) payload.model_id = modelId;
  const { data } = await api.post('/chat', payload);
  return data;
}
export function streamMessage(message, sessionId = null, modelId = null, onChunk, onDone, onError) {
  const token = localStorage.getItem('aivorax-token');
  const body = JSON.stringify({
    message,
    session_id: sessionId || undefined,
    model_id: modelId || undefined,
  });
  fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body,
  })
    .then(async (response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sessionInfo = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); 
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.type === 'start') {
                sessionInfo = payload;
              } else if (payload.type === 'chunk') {
                onChunk?.(payload.text, sessionInfo);
              } else if (payload.type === 'done') {
                onDone?.(payload, sessionInfo);
              }
            } catch {  }
          }
        }
      }
    })
    .catch((err) => {
      onError?.(err);
    });
}
export async function createNewSession() {
  const { data } = await api.post('/session/new');
  return data;
}
export async function fetchHistory() {
  const { data } = await api.get('/history');
  return data.sessions || [];
}
export async function fetchSession(sessionId) {
  const { data } = await api.get(`/history/${sessionId}`);
  return data;
}
export async function deleteSession(sessionId) {
  const { data } = await api.delete(`/session/${sessionId}`);
  return data;
}
export async function uploadFile(file, message = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', message);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}
export function getTtsAudioUrl(text, lang = 'en') {
  return `${API_BASE}/tts?text=${encodeURIComponent(text.substring(0, 5000))}&lang=${lang}`;
}
export async function checkTtsStatus() {
  try {
    const { data } = await api.get('/tts/status');
    return data.available;
  } catch {
    return false;
  }
}
export async function fetchAvailableModels() {
  try {
    const { data } = await api.get('/models');
    return data.models || [];
  } catch {
    return [];
  }
}
export default api;