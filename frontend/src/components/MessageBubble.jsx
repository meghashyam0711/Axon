import { useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import {
  Copy, Check, Bot, User as UserIcon, Code as CodeIcon,
  BookOpen, Play, ChevronDown, ChevronUp, Volume2, VolumeX,
  RefreshCw, ClipboardCopy
} from 'lucide-react';
import { getTtsAudioUrl } from '../api/chat';
function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const codeText = String(children).replace(/\n$/, '');
  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden border border-[#30363d] my-3 bg-[#0d1117]">
      {}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
            <CodeIcon className="w-3 h-3" />
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white bg-[#21262d] hover:bg-[#30363d] px-2.5 py-1 rounded transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <span className="flex items-center gap-1 text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-1 rounded">
            <Play className="w-3 h-3" />
            Run
          </span>
        </div>
      </div>
      {}
      <pre className="!m-0 !p-4 overflow-x-auto !bg-transparent">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}
function InlineCode({ children, ...props }) {
  return (
    <code
      className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}
function parseResponseSections(content) {
  if (!content || typeof content !== 'string') return { sections: [{ type: 'text', content: content || '' }] };
  const sections = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let hasCode = false;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    hasCode = true;
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      sections.push({ type: 'text', content: textBefore });
    }
    sections.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[0], 
      rawCode: match[2],
    });
    lastIndex = match.index + match[0].length;
  }
  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ type: 'text', content: remaining });
  }
  if (!hasCode) {
    return { sections: [{ type: 'text', content }], hasCode: false };
  }
  return { sections, hasCode: true };
}
function SectionHeader({ icon, title, color }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <div className={`w-5 h-5 rounded flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
    </div>
  );
}
function ExplanationSection({ content }) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="mt-4 border-t border-[var(--color-border-primary)] pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/15">
          <BookOpen className="w-3 h-3 text-emerald-400" />
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-1">
          Explanation
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
        )}
      </button>
      {isExpanded && (
        <div className="markdown-body animate-fade-slide-up">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              code({ inline, className, children, ...props }) {
                if (inline) {
                  return <InlineCode {...props}>{children}</InlineCode>;
                }
                return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
function MessageActions({ content, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const handleCopyAll = async () => {
    const plainText = content
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').replace(/```/g, ''))
      .replace(/[#*_`~\[\]()>|]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleSpeak = () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
      return;
    }
    const url = getTtsAudioUrl(content);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          content.replace(/[#*_`~\[\]()>|]/g, '').substring(0, 3000)
        );
        utterance.rate = 1;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    };
    audio.play().catch(() => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          content.replace(/[#*_`~\[\]()>|]/g, '').substring(0, 3000)
        );
        utterance.rate = 1;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    });
  };
  return (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200">
      {}
      <button
        onClick={handleCopyAll}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-all"
        title="Copy response"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {}
      <button
        onClick={handleSpeak}
        className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md transition-all ${
          isSpeaking
            ? 'text-[var(--color-accent)] bg-[var(--color-accent-soft)]'
            : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        }`}
        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
      >
        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        {isSpeaking ? 'Stop' : 'Speak'}
      </button>
      {}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-all"
          title="Regenerate response"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      )}
    </div>
  );
}
export default function MessageBubble({ role, content, timestamp, isError, model, isStreaming, isLast, onRegenerate }) {
  const isUser = role === 'user';
  const parsed = useMemo(() => {
    if (isUser) return null;
    return parseResponseSections(content);
  }, [content, isUser]);
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-slide-up group/bubble`}>
      <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} max-w-[85%] lg:max-w-[75%]`}>
        {}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
          isUser
            ? 'bg-[var(--color-accent)]'
            : isError
              ? 'bg-red-500/20 border border-red-500/30'
              : 'bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20'
        }`}>
          {isUser ? (
            <UserIcon className="w-4 h-4 text-white" />
          ) : (
            <Bot className={`w-4 h-4 ${isError ? 'text-red-400' : 'text-[var(--color-accent)]'}`} />
          )}
        </div>
        {}
        <div className="flex flex-col gap-1 min-w-0">
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--color-bg-user-bubble)] rounded-tr-sm text-[var(--color-text-primary)]'
              : isError
                ? 'bg-red-500/5 border border-red-500/20 rounded-tl-sm text-red-300'
                : 'bg-[var(--color-bg-ai-bubble)] border border-[var(--color-border-primary)] rounded-tl-sm text-[var(--color-text-primary)]'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : parsed?.hasCode ? (
              <div>
                {}
                {parsed.sections.filter(s => s.type === 'code').length > 0 && (
                  <div>
                    <SectionHeader
                      icon={<CodeIcon className="w-3 h-3 text-violet-400" />}
                      title={`Code${parsed.sections.find(s => s.type === 'code')?.language ? ` (${parsed.sections.find(s => s.type === 'code').language})` : ''}`}
                      color="bg-violet-500/15"
                    />
                    <div className="markdown-body">
                      {parsed.sections.filter(s => s.type === 'code').map((section, idx) => (
                        <ReactMarkdown
                          key={`code-${idx}`}
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight, rehypeRaw]}
                          components={{
                            code({ inline, className, children, ...props }) {
                              if (inline) return <InlineCode {...props}>{children}</InlineCode>;
                              return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                            },
                          }}
                        >
                          {section.content}
                        </ReactMarkdown>
                      ))}
                    </div>
                  </div>
                )}
                {}
                {parsed.sections.filter(s => s.type === 'text').length > 0 && (
                  <ExplanationSection
                    content={parsed.sections.filter(s => s.type === 'text').map(s => s.content).join('\n\n')}
                  />
                )}
              </div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      if (inline) {
                        return <InlineCode {...props}>{children}</InlineCode>;
                      }
                      return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
            {}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-[var(--color-accent)] animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
          {}
          <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {timestamp && (
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {formatTime(timestamp)}
              </span>
            )}
            {!isUser && model && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium">
                {model}
              </span>
            )}
          </div>
          {}
          {!isUser && !isStreaming && content && (
            <MessageActions
              content={content}
              onRegenerate={isLast ? onRegenerate : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}