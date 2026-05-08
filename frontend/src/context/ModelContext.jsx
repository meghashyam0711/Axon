import { createContext, useContext, useState, useEffect } from 'react';
const ModelContext = createContext();
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast & efficient',
    badge: 'Default',
    badgeColor: 'emerald',
    icon: '⚡',
    category: 'Gemini 2.x',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable thinking model',
    badge: 'Thinking',
    badgeColor: 'violet',
    icon: '🧠',
    category: 'Gemini 2.x',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Lightweight 2.5 model',
    badge: 'Lite',
    badgeColor: 'cyan',
    icon: '💨',
    category: 'Gemini 2.x',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2 Flash',
    description: 'Balanced performance',
    badge: 'Stable',
    badgeColor: 'blue',
    icon: '💎',
    category: 'Gemini 2.x',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2 Flash Lite',
    description: 'Lightweight & quick',
    badge: 'Lite',
    badgeColor: 'cyan',
    icon: '🪶',
    category: 'Gemini 2.x',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Next-gen fast model',
    badge: 'New',
    badgeColor: 'emerald',
    icon: '🚀',
    category: 'Gemini 3.x',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Next-gen pro model',
    badge: 'New',
    badgeColor: 'violet',
    icon: '✨',
    category: 'Gemini 3.x',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-light 3.1 model',
    badge: 'Lite',
    badgeColor: 'cyan',
    icon: '⚡',
    category: 'Gemini 3.1',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    description: 'Advanced 3.1 pro model',
    badge: 'Pro',
    badgeColor: 'violet',
    icon: '💠',
    category: 'Gemini 3.1',
  },
  {
    id: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 3.1 Flash TTS',
    description: 'Text-to-speech optimised',
    badge: 'TTS',
    badgeColor: 'amber',
    icon: '🔊',
    category: 'Specialised',
  },
  {
    id: 'gemini-robotics-er-1.5-preview',
    name: 'Robotics ER 1.6',
    description: 'Robotics & embodiment',
    badge: 'Robot',
    badgeColor: 'blue',
    icon: '🤖',
    category: 'Specialised',
  },
  {
    id: 'gemini-2.5-computer-use-preview-10-2025',
    name: 'Computer Use',
    description: 'Autonomous computer control',
    badge: 'Agent',
    badgeColor: 'emerald',
    icon: '🖥️',
    category: 'Specialised',
  },
  {
    id: 'deep-research-pro-preview-12-2025',
    name: 'Deep Research Pro',
    description: 'Deep multi-step research',
    badge: 'Research',
    badgeColor: 'violet',
    icon: '🔬',
    category: 'Specialised',
  },
  {
    id: 'gemini-2.0-flash-001',
    name: 'Gemini 2 (Search)',
    description: 'Search grounding — Gemini 2',
    badge: 'Search',
    badgeColor: 'blue',
    icon: '🌐',
    category: 'Search',
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 (Search)',
    description: 'Search grounding — Gemini 2.5',
    badge: 'Search',
    badgeColor: 'blue',
    icon: '🌐',
    category: 'Search',
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 (Search)',
    description: 'Search grounding — Gemini 3',
    badge: 'Search',
    badgeColor: 'blue',
    icon: '🌐',
    category: 'Search',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash Image',
    description: 'Next-gen image generation',
    badge: 'Image',
    badgeColor: 'rose',
    icon: '🎨',
    category: 'Image',
  },
  {
    id: 'gemma-3-1b-it',
    name: 'Gemma 3 1B',
    description: 'Compact on-device model',
    badge: '1B',
    badgeColor: 'rose',
    icon: '🔹',
    category: 'Gemma',
  },
  {
    id: 'gemma-3-4b-it',
    name: 'Gemma 3 4B',
    description: 'Small but capable',
    badge: '4B',
    badgeColor: 'orange',
    icon: '🔸',
    category: 'Gemma',
  },
  {
    id: 'gemma-3-12b-it',
    name: 'Gemma 3 12B',
    description: 'Mid-size open model',
    badge: '12B',
    badgeColor: 'amber',
    icon: '🟡',
    category: 'Gemma',
  },
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B',
    description: 'Largest Gemma model',
    badge: '27B',
    badgeColor: 'red',
    icon: '🔴',
    category: 'Gemma',
  },
  {
    id: 'gemma-3n-e4b-it',
    name: 'Gemma 3n E4B',
    description: 'Efficient nano 4B',
    badge: 'Nano',
    badgeColor: 'cyan',
    icon: '🔷',
    category: 'Gemma',
  },
  {
    id: 'gemma-3n-e2b-it',
    name: 'Gemma 3n E2B',
    description: 'Efficient nano 2B',
    badge: 'Nano',
    badgeColor: 'cyan',
    icon: '🔵',
    category: 'Gemma',
  },
];
export function ModelProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('aivorax-ai-model');
    if (saved) {
      const found = AVAILABLE_MODELS.find(m => m.id === saved);
      if (found) return found;
    }
    return AVAILABLE_MODELS[0]; 
  });
  useEffect(() => {
    localStorage.setItem('aivorax-ai-model', selectedModel.id);
  }, [selectedModel]);
  const selectModel = (modelId) => {
    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (found) setSelectedModel(found);
  };
  return (
    <ModelContext.Provider value={{
      selectedModel,
      selectModel,
      availableModels: AVAILABLE_MODELS,
    }}>
      {children}
    </ModelContext.Provider>
  );
}
export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}