import React, {createContext, useContext, ReactNode} from 'react';

interface FavoritesContextType {
  favorites: string[];
  onToggleFavorite: (path: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
  favorites: string[];
  onToggleFavorite: (path: string) => void;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ 
  children, 
  favorites, 
  onToggleFavorite 
}) => {
  return (
    <FavoritesContext.Provider value={{ favorites, onToggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
