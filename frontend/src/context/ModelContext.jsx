import { createContext, useContext, useState, useEffect } from 'react';
const ModelContext = createContext();
export const AVAILABLE_MODELS = [
  {
    id: 'qwen-2.5-local',
    name: 'Qwen 2.5 (Local)',
    description: 'Running locally on your machine',
    badge: 'Local',
    badgeColor: 'violet',
    icon: '💻',
    category: 'Local Models',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast & efficient cloud model',
    badge: 'Cloud',
    badgeColor: 'emerald',
    icon: '⚡',
    category: 'Cloud Models',
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