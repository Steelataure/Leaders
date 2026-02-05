import React, { createContext, useContext, useState } from 'react';

interface AudioContextType {
  volume: number;
  setVolume: (v: number) => void;
  sfxVolume: number; // Ajouté
  setSfxVolume: (v: number) => void; // Ajouté
  sfxEnabled: boolean;
  setSfxEnabled: (enabled: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialisation du volume principal
  const [volume, setVolumeState] = useState(() => {
    return Number(localStorage.getItem('app-volume')) ?? 3;
  });

  // Initialisation du volume des effets sonores (SFX)
  const [sfxVolume, setSfxVolumeState] = useState(() => {
    return Number(localStorage.getItem('app-sfx-volume')) ?? 5;
  });

  const [sfxEnabled, setSfxEnabled] = useState(true);

  const setVolume = (v: number) => {
    setVolumeState(v);
    localStorage.setItem('app-volume', v.toString());
  };

  const setSfxVolume = (v: number) => {
    setSfxVolumeState(v);
    localStorage.setItem('app-sfx-volume', v.toString());
  };

  return (
    <AudioContext.Provider 
      value={{ 
        volume, 
        setVolume, 
        sfxVolume, 
        setSfxVolume, 
        sfxEnabled, 
        setSfxEnabled 
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio doit être utilisé dans un AudioProvider");
  return context;
};