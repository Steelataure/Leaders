import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  volume: number;
  setVolume: (v: number) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (enabled: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // On initialise avec localStorage pour que le volume reste le même après un rafraîchissement
  const [volume, setVolumeState] = useState(() => {
    return Number(localStorage.getItem('app-volume')) || 25;
  });
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const setVolume = (v: number) => {
    setVolumeState(v);
    localStorage.setItem('app-volume', v.toString());
  };

  return (
    <AudioContext.Provider value={{ volume, setVolume, sfxEnabled, setSfxEnabled }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio doit être utilisé dans un AudioProvider");
  return context;
};