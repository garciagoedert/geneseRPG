import React, { createContext, useState, useContext, type ReactNode } from 'react';

interface UIContextType {
  isToolbarOpen: boolean;
  toggleToolbar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const toggleToolbar = () => {
    setIsToolbarOpen(prev => !prev);
  };

  return (
    <UIContext.Provider value={{ isToolbarOpen, toggleToolbar }}>
      {children}
    </UIContext.Provider>
  );
};
