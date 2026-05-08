import { useRef, useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useModel } from '../context/ModelContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import InputBar from './InputBar';
export default function ChatArea({ onToast }) {
  const { messages, isLoading, sendMessage, uploadFileMessage, regenerateLastMessage } = useChat();
  const { selectedModel } = useModel();
  const [suggestionText, setSuggestionText] = useState('');
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  const handleSuggestionClick = (prompt) => {
    setSuggestionText(prompt);
    setTimeout(() => setSuggestionText(''), 100);
  };
  const handleSend = (text) => {
    sendMessage(text, selectedModel.id);
  };
  const handleFileUpload = (file, message) => {
    uploadFileMessage(file, message);
  };
  const handleRegenerate = () => {
    regenerateLastMessage(selectedModel.id);
  };
  const hasMessages = messages.length > 0;
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                isError={msg.isError}
                model={msg.model}
                isStreaming={msg.isStreaming}
                isLast={idx === messages.length - 1 && msg.role === 'assistant'}
                onRegenerate={handleRegenerate}
              />
            ))}
            {}
            {isLoading && (!messages.length || !messages[messages.length - 1]?.isStreaming) && (
              <TypingIndicator />
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      {}
      <InputBar
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        initialValue={suggestionText}
        onToast={onToast}
      />
    </div>
  );
}