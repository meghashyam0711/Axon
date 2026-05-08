import { useState, useRef, useEffect } from 'react';
import { useModel, AVAILABLE_MODELS } from '../context/ModelContext';
import { ChevronDown, Check, Search } from 'lucide-react';
const badgeColors = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
};
const CATEGORY_ORDER = [
  'Gemini 2.x',
  'Gemini 3.x',
  'Gemini 3.1',
  'Specialised',
  'Search',
  'Image',
  'Gemma',
];
export default function ModelSelector() {
  const { selectedModel, selectModel, availableModels } = useModel();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef(null);
  const filterInputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    if (isOpen && filterInputRef.current) {
      setTimeout(() => filterInputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  const filteredModels = filter
    ? availableModels.filter(
        (m) =>
          m.name.toLowerCase().includes(filter.toLowerCase()) ||
          m.description.toLowerCase().includes(filter.toLowerCase()) ||
          m.badge.toLowerCase().includes(filter.toLowerCase())
      )
    : availableModels;
  const grouped = {};
  filteredModels.forEach((model) => {
    const cat = model.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(model);
  });
  return (
    <div ref={dropdownRef} className="relative">
      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 transition-all hover:shadow-md"
        id="model-selector-trigger"
      >
        <span>{selectedModel.icon}</span>
        <span className="hidden sm:inline">{selectedModel.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-slide-up">
          {}
          <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Select Model</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              {availableModels.length} models available · Same API key
            </p>
          </div>
          {}
          <div className="px-3 py-2 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--color-bg-tertiary)] rounded-lg">
              <Search className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />
              <input
                ref={filterInputRef}
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter models..."
                className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
              />
            </div>
          </div>
          {}
          <div className="py-1 max-h-[420px] overflow-y-auto">
            {filteredModels.length === 0 && (
              <p className="text-center text-xs text-[var(--color-text-tertiary)] py-6">
                No models match "{filter}"
              </p>
            )}
            {CATEGORY_ORDER.map((category) => {
              if (!grouped[category] || grouped[category].length === 0) return null;
              return (
                <div key={category}>
                  {}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {category}
                    </p>
                  </div>
                  {}
                  {grouped[category].map((model) => {
                    const isSelected = selectedModel.id === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          selectModel(model.id);
                          setIsOpen(false);
                          setFilter('');
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all hover:bg-[var(--color-bg-hover)] ${
                          isSelected ? 'bg-[var(--color-accent-soft)]' : ''
                        }`}
                        id={`model-option-${model.id}`}
                      >
                        {}
                        <span className="text-base mt-0.5">{model.icon}</span>
                        {}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--color-text-primary)]">{model.name}</span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-semibold border ${badgeColors[model.badgeColor]}`}
                            >
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{model.description}</p>
                        </div>
                        {}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-accent)] mt-1 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}