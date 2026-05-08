export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-slide-up">
      <div className="flex items-start gap-3 max-w-[85%]">
        {}
        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        {}
        <div className="bg-[var(--color-bg-ai-bubble)] border border-[var(--color-border-primary)] rounded-2xl rounded-tl-sm px-5 py-4">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)]"
                style={{
                  animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}