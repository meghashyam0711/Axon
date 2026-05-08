import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Paperclip, Loader2, Globe } from 'lucide-react';
import VoiceRecordingOverlay from './VoiceRecordingOverlay';
export default function InputBar({ onSend, onFileUpload, isLoading, initialValue = '', onToast }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          autoResize();
        }
      }, 50);
    }
  }, [initialValue]);
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isRecording) {
        cancelRecording();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isRecording]);
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };
  const handleChange = (e) => {
    setText(e.target.value);
    autoResize();
  };
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const messageToSend = webSearchEnabled ? `search ${trimmed}` : trimmed;
    onSend(messageToSend);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const showToast = useCallback((message, type = 'info') => {
    onToast?.(message, type);
  }, [onToast]);
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {  }
    }
    setIsRecording(false);
  }, []);
  const cancelRecording = useCallback(() => {
    stopRecording();
    setLiveTranscript('');
  }, [stopRecording]);
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showToast('Voice input requires HTTPS or localhost. Open via 127.0.0.1.', 'warning');
      } else {
        showToast('Speech recognition not supported. Please use Chrome.', 'error');
      }
      return;
    }
    if (isRecording) {
      stopRecording();
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalResult = '';
    recognition.onstart = () => {
      setIsRecording(true);
      setLiveTranscript('');
      finalResult = '';
    };
    recognition.onresult = (event) => {
      let interim = '';
      let final_ = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_ += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final_) finalResult = final_;
      setLiveTranscript(final_ || interim);
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (finalResult.trim()) {
        setText(finalResult.trim());
        showToast('Voice captured! Press Enter to send.', 'success');
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            autoResize();
          }
        }, 100);
      } else if (liveTranscript.trim()) {
        setText(liveTranscript.trim());
      }
      setLiveTranscript('');
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      setLiveTranscript('');
      const errorMap = {
        'not-allowed': { msg: 'Microphone access denied. Allow mic permission in browser settings.', type: 'error' },
        'no-speech': { msg: 'No speech detected. Please try again.', type: 'warning' },
        'audio-capture': { msg: 'No microphone found. Check your device.', type: 'error' },
        'network': { msg: 'Network error during speech recognition.', type: 'error' },
        'aborted': { msg: 'Speech recognition was cancelled.', type: 'info' },
      };
      const err = errorMap[event.error] || { msg: `Speech error: ${event.error}`, type: 'error' };
      showToast(err.msg, err.type);
    };
    recognitionRef.current = recognition;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(t => t.stop());
          try {
            recognition.start();
          } catch (err) {
            showToast('Could not start voice input. Try again.', 'warning');
          }
        })
        .catch(() => {
          showToast('Microphone permission denied. Please allow access in browser settings.', 'error');
        });
    } else {
      try {
        recognition.start();
      } catch (err) {
        showToast('Could not start voice input.', 'error');
      }
    }
  }, [isRecording, stopRecording, showToast, liveTranscript]);
  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const handleAttach = () => fileRef.current?.click();
  const canSend = text.trim().length > 0 && !isLoading;
  return (
    <>
      {}
      {isRecording && (
        <VoiceRecordingOverlay
          transcript={liveTranscript}
          onStop={stopRecording}
          onCancel={cancelRecording}
        />
      )}
      {}
      <div className="px-4 pb-4 pt-2 w-full max-w-3xl mx-auto">
        <div className="relative bg-[var(--color-bg-input)] border border-[var(--color-border-input)] rounded-2xl shadow-xl transition-all duration-200 focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_20px_var(--color-accent-glow)]">
          <div className="flex items-end p-2 gap-1">
            {}
            <button
              type="button"
              onClick={handleAttach}
              className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              ref={fileRef} 
              type="file" 
              className="hidden" 
              accept=".pdf,.txt,.docx" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) { 
                    onToast?.('File must be smaller than 5MB', 'error');
                  } else {
                    onFileUpload?.(file, text);
                    setText('');
                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                  }
                }
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            {}
            <button
              type="button"
              onClick={() => {
                setWebSearchEnabled(prev => !prev);
                onToast?.(webSearchEnabled ? 'Web search disabled' : 'Web search enabled — your query will search the web', webSearchEnabled ? 'info' : 'success');
              }}
              className={`p-2.5 rounded-xl transition-all relative group ${
                webSearchEnabled
                  ? 'text-blue-400 bg-blue-500/15 ring-1 ring-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
              title={webSearchEnabled ? 'Disable web search' : 'Enable web search'}
              id="web-search-toggle"
            >
              <Globe className="w-5 h-5" />
              {}
              {webSearchEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
              {}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-white bg-[var(--color-bg-tooltip)] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {webSearchEnabled ? '🌐 Web search ON' : 'Search the web'}
              </span>
            </button>
            {}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] px-2 py-2.5 text-sm resize-none overflow-hidden focus:outline-none max-h-40 self-center"
              style={{ minHeight: '24px' }}
            />
            {}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all ${
                isRecording
                  ? 'text-red-400 bg-red-500/10 animate-mic-pulse'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              <Mic className="w-5 h-5" />
            </button>
            {}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`p-2.5 rounded-xl transition-all ${
                canSend
                  ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-md'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              }`}
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          {webSearchEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-3 h-3" />
              Web search active
            </span>
          )}
          <p className="text-[10px] text-[var(--color-text-tertiary)]">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  );
}