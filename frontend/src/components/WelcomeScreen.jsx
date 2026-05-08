import { Sparkles, Code, BookOpen, Lightbulb } from 'lucide-react';
const suggestions = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Explain a concept',
    prompt: 'Explain quantum computing in simple terms',
    color: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/20 hover:border-violet-500/40',
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: 'Write some code',
    prompt: 'Write a Python function to sort a list using merge sort',
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/20 hover:border-blue-500/40',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Summarize text',
    prompt: 'Summarize the key principles of clean code architecture',
    color: 'from-emerald-500/20 to-green-500/10',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: 'Brainstorm ideas',
    prompt: 'Give me 5 creative startup ideas using AI in healthcare',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/20 hover:border-amber-500/40',
  },
];
export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-slide-up">
      {}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-[var(--color-accent-glow)]">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          How can I help you today?
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Ask anything — I can code, explain, search, calculate, and more.
        </p>
      </div>
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(item.prompt)}
            className={`group text-left p-4 rounded-xl border ${item.border} bg-gradient-to-br ${item.color} backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-[var(--color-text-primary)]">
              {item.icon}
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors">
              "{item.prompt}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}