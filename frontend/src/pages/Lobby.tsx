import { useState, useEffect, useRef } from "react";
import { authService } from "../services/auth.service";
import { joinPublicQueue, createPrivateSession, joinPrivateSession, cancelSearch } from "../api/gameApi";
import { webSocketService } from "../services/WebSocketService";
import type { User } from "../types/auth.types";
import RankBadge from "../components/RankBadge";
import { createGame, SCENARIO_NAMES, API_BASE_URL } from "../api/gameApi";

import useSound from 'use-sound';
import buttonClickSfx from '../sounds/buttonClick.mp3';
import buttonHoverSfx from '../sounds/buttonHover.mp3';

// --- STYLES & ANIMATIONS ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

  .font-orbitron { font-family: 'Orbitron', sans-serif; }
  .font-rajdhani { font-family: 'Rajdhani', sans-serif; }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  .scanlines::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    z-index: 2;
    background-size: 100% 2px, 3px 100%;
    pointer-events: none;
  }
  .animate-scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: rgba(0, 245, 255, 0.3);
    animation: scanline 6s linear infinite;
    pointer-events: none;
    z-index: 3;
  }
  
  .bg-cyber-grid {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  }

  .text-glow { text-shadow: 0 0 10px rgba(0, 245, 255, 0.7); }
  .box-glow { box-shadow: 0 0 20px rgba(0, 245, 255, 0.2); }
  
  /* Custom Scrollbar for lists */
  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  .custom-scroll::-webkit-scrollbar-thumb { background: #00f5ff; border-radius: 4px; }

  /* 🆕 Animation pour le badge Masters */
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.5); }
    50% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.8); }
  }
  .masters-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`;

export default function Lobby({
  onStartGame,
  onOpenRules,
}: {
  onStartGame: (id: string) => void;
  onOpenRules: () => void;
}) {
  const [joinMode, setJoinMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(0); // 0% by default as requested
  const [sfxEnabled, setSfxEnabled] = useState(false); // Disabled by default
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [createdSessionCode, setCreatedSessionCode] = useState<string | null>(null);

  // ... (keeping other states)

  // 🆕 Mode Masters par défaut (scénario 0)
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  // Login/Register State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Matchmaking State
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = useRef(isSearching);

  // Update ref when state changes
  useEffect(() => {
    isSearchingRef.current = isSearching;

    // Cleanup function when component unmounts - if searching, cancel it
    return () => {
      // This cleanup runs when isSearching changes OR when component unmounts
      // But we only want to cancel on UNMOUNT, not on state change?
      // Actually, if we put this in a separate effect with empty dependency it runs on unmount.
    };
  }, [isSearching]);

  // Cleanup on unmount - using ref to access latest state
  useEffect(() => {
    return () => {
      if (isSearchingRef.current && user && user.id) {
        console.log("Unmounting lobby while searching - cancelling search");
        cancelSearch(user.id).catch(err => console.error("Failed to cancel search on unmount", err));
      }
    };
  }, [user]); // Re-bind if user changes, but mainly for unmount

  const [_currentSession, setCurrentSession] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");

  // Heartbeat while searching/waiting
  useEffect(() => {
    if (!isSearching || !user?.id || !_currentSession?.id) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/sessions/${_currentSession.id}/heartbeat`, { method: 'POST' })
        .catch(err => console.error("Lobby heartbeat failed", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [isSearching, user?.id, _currentSession?.id]);

  // 🆕 Stats State
  const [stats, setStats] = useState<{ inGame: number; inQueue: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store", headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          console.log("STATS RECEIVED:", data);
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      clearInterval(interval);
      // We can't easily access isSearching state here in cleanup of exact this effect due to closure
      // But we can add a separate effect for cleanup/cancellation on unmount if needed.
      // However, usually navigating away unmounts.
    };
  }, []);

  // Cleanup effect for searching
  useEffect(() => {
    return () => {
      // If we want to cancel on unmount, we need a ref to track if searching was active
      // But React state in cleanup is tricky. 
      // For now, let's just rely on the button. 
      // Users often close tab which we can't always catch.
      // But if they navigate to "Home", we should cancel.
    };
  }, []);

  useEffect(() => {
    let currentUser = authService.getUser();

    // If no user is logged in (Guest), or if the user is a legacy "Joueur",
    // we MUST ensure a unique ID per tab to allow local testing.
    // We use sessionStorage to persist across refreshes but NOT across tabs.
    if (!currentUser || currentUser.username === "Joueur") {
      const sessionGuestId = sessionStorage.getItem('guest_id') || crypto.randomUUID();
      sessionStorage.setItem('guest_id', sessionGuestId);

      currentUser = {
        id: sessionGuestId,
        username: "Joueur",
        email: "",
        elo: 1000,
        roles: []
      };
      // Do NOT save to localStorage, or it will contaminate other tabs.
    }

    setUser(currentUser);

    // Refresh user profile from backend if they are NOT a guest
    if (currentUser && currentUser.username !== "Joueur" && currentUser.email !== "") {
      authService.getProfile(currentUser.id)
        .then(updatedUser => {
          console.log("Profile refreshed:", updatedUser);
          setUser(updatedUser);
        })
        .catch(err => console.error("Failed to refresh profile", err));
    }
  }, []);

  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isRegistering) {
        await authService.register({ email, password, username });
        // Succès de l'inscription : on bascule vers le login
        setIsRegistering(false);
        setSuccessMsg("Compte créé avec succès ! Veuillez vous connecter.");
        // On garde la modale ouverte pour qu'il puisse se connecter
      } else {
        const response = await authService.login({ email, password });
        if (response.user) {
          setUser(response.user);
        } else {
          // Fallback if login returns no user (unlikely but safe)
          const guestId = sessionStorage.getItem('guest_id') || crypto.randomUUID();
          sessionStorage.setItem('guest_id', guestId);
          setUser({ username: "Joueur", id: guestId, email, elo: 1000, roles: [] });
        }
        setLoginOpen(false);
      }
    } catch (err) {
      setError(
        isRegistering
          ? "Échec de l'inscription."
          : "Échec de la connexion. Vérifiez vos identifiants."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setDropdownOpen(false);
  };

  const handleCodeChange = async (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-focus next
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    // Attempt join if all 6 digits are filled
    if (newCode.every(char => char !== "")) {
      const fullCode = newCode.join("");
      try {
        setSessionStatus("REJOINDRE LA SESSION...");
        const session = await joinPrivateSession(fullCode, user?.id);
        setCurrentSession(session);

        if (session.status === "ACTIVE") {
          onStartGame(session.id);
        } else {
          webSocketService.subscribeToSession(session.id, (updatedSession) => {
            if (updatedSession.status === "ACTIVE") {
              onStartGame(updatedSession.id);
            }
          });
        }
      } catch (err: any) {
        console.error("Join private session failed", err);
        setError("Code invalide ou session pleine.");
        setSessionStatus("");
      }
    }
  };

  const handleCreateGame = async () => {
    try {
      playButtonClickSfx();
      const gameId = await createGame(selectedScenario);
      console.log("Partie créée avec l'ID:", gameId, "| Scénario:", selectedScenario === 0 ? "MODE MASTERS" : selectedScenario);
      onStartGame(gameId);
    } catch (error) {
      console.error("Erreur lors de la création de la partie:", error);
      alert("Erreur lors de la création de la partie. Vérifiez que le backend est lancé.");
    }
  };

  const [playClick] = useSound(buttonClickSfx, { volume: volume / 100 });
  const [playHover] = useSound(buttonHoverSfx, { volume: (volume / 100) * 0.5 });

  const playButtonClickSfx = () => {
    if (sfxEnabled) playClick();
  };
  const playButtonHoverSfx = () => {
    if (sfxEnabled) playHover();
  };

  const closeAllModals = () => {
    setLoginOpen(false);
    setSettingsOpen(false);
    setAboutOpen(false);
    setDropdownOpen(false);
    setSuccessMsg(null);
    setError(null);
  };

  // 🆕 Déterminer si c'est le Mode Masters
  const isMastersMode = selectedScenario === 0;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      <style>{styles}</style>

      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#050b1f] to-[#020617]" />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
        <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl" />
        <div className="scanlines absolute inset-0 opacity-40" />
        <div className="animate-scan-line" />
      </div>

      {/* --- UI CONTENT --- */}
      <div className="relative z-10 flex flex-col items-center min-h-screen w-full px-6 overflow-hidden">

        {/* TOP BAR */}
        <div className="absolute top-8 left-8 flex gap-4 z-50">
          <button
            onClick={onOpenRules}
            onMouseEnter={() => playButtonHoverSfx()}
            className="border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500/10 font-rajdhani font-bold py-2 px-4 rounded transition-all tracking-wider text-sm backdrop-blur-sm flex items-center gap-2"
          >
            RÈGLES
          </button>
        </div>

        <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
          <div className="hidden md:block bg-yellow-400 text-black font-orbitron font-bold px-3 py-1 text-xs transform rotate-3 shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            BETA 2.0
          </div>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseEnter={() => playButtonHoverSfx()}
            className="group relative border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500/10 font-rajdhani font-bold py-1.5 px-4 rounded transition-all tracking-wider text-sm backdrop-blur-sm flex items-center gap-4 pr-6"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-cyan-500/50 uppercase tracking-tighter leading-none mb-1">Identité Confirmée</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white group-hover:text-cyan-400 transition-colors uppercase">
                  {user ? user.username : "CONNEXION"}
                </span>
              </div>
            </div>
            {user && (
              <div className="border-l border-white/10 pl-4 py-1">
                <RankBadge elo={user.elo} size="md" />
              </div>
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] opacity-30 group-hover:opacity-100 transition-opacity">▼</div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="py-1 font-rajdhani font-semibold">
                {!user ? (
                  <button
                    onClick={() => { closeAllModals(); setSuccessMsg(null); setError(null); setLoginOpen(true); }}
                    className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20 hover:text-cyan-400 border-b border-white/5"
                  >
                    CONNEXION
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 border-b border-white/5"
                  >
                    DÉCONNEXION
                  </button>
                )}
                <button
                  className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => { closeAllModals(); setSettingsOpen(true); }}
                >
                  PARAMÈTRES
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => { closeAllModals(); setAboutOpen(true); }}
                >
                  INFOS_SYSTÈME
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col items-center justify-center mt-20 lg:mt-32 mb-16 shrink-0">
          <h1 className="font-orbitron text-6xl lg:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-wider drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] leading-tight transform scale-y-110">
            LEADERS
          </h1>
          <p className="font-orbitron text-xs lg:text-sm tracking-[0.8em] opacity-80 animate-pulse mt-4">
            DIGITAL WARFARE SIMULATION
          </p>
        </div>

        {/* MAIN CARDS CONTAINER */}
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-stretch justify-center flex-1 mb-12">

          {/* --- LEFT: MATCHMAKING --- */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 hover:border-cyan-500/50 transition-all duration-300 group shadow-[0_0_20px_rgba(0,0,0,0.3)] flex flex-col">

            <div className="mb-3">
              <h2 className="font-orbitron font-black italic text-xl lg:text-2xl text-white mb-1">
                CRÉER UNE PARTIE
              </h2>
              <p className="text-slate-400 font-rajdhani text-sm leading-tight font-medium">
                Choisissez un scénario et lancez une partie.
              </p>
            </div>

            <div className="mt-auto w-full space-y-4">
              {/* 🆕 Sélecteur de scénario AMÉLIORÉ */}
              {/* 🆕 Stats Display */}
              <div className="flex justify-between items-center text-[10px] font-orbitron text-cyan-400/80 tracking-widest bg-cyan-950/30 px-3 py-2 rounded border border-cyan-500/20 mb-4">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  JEU: <span className="text-white font-bold">{stats ? stats.inGame : 0}</span>
                </span>
                <span className="text-cyan-500/30">|</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  JOUEURS DANS LA FILE: <span className="text-white font-bold">{stats ? stats.inQueue : 0}</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2 font-rajdhani">
                  Mode de jeu
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(Number(e.target.value))}
                  className={`w-full font-rajdhani font-medium rounded-lg px-4 py-3 outline-none transition-all cursor-pointer
                    ${isMastersMode
                      ? 'bg-purple-950/80 border-2 border-purple-500/50 text-purple-200 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-950/80 border border-cyan-500/30 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    }`}
                >
                  {Object.entries(SCENARIO_NAMES).map(([id, name]) => (
                    <option key={id} value={id} className={Number(id) === 0 ? "bg-purple-900" : "bg-slate-900"}>
                      {Number(id) === 0 ? name : `${id}. ${name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🆕 Badge Mode Masters */}
              {isMastersMode && (
                <div className="flex items-center gap-3 p-3 bg-purple-950/40 border border-purple-500/30 rounded-lg masters-glow">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <p className="text-purple-300 font-orbitron text-xs font-bold tracking-wider">MODE MASTERS ACTIVÉ</p>
                    <p className="text-purple-400/70 font-rajdhani text-[10px]">16 personnages • Combos uniques • Parties imprévisibles</p>
                  </div>
                </div>
              )}

              {/* Info scénario standard */}
              {!isMastersMode && (
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <p className="text-cyan-400 font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase">
                    Scénario {selectedScenario} sélectionné
                  </p>
                </div>
              )}

              <button
                onClick={async () => {
                  playButtonClickSfx();

                  // CANCEL LOGIC
                  if (isSearching) {
                    if (user && user.id) {
                      try {
                        await cancelSearch(user.id);
                        setSessionStatus("RECHERCHE ANNULÉE");
                        setTimeout(() => setSessionStatus(""), 1000);
                      } catch (e) {
                        console.error("Error cancelling search:", e);
                      }
                    }
                    setIsSearching(false);
                    return;
                  }

                  try {
                    setIsSearching(true);
                    setSessionStatus("RECHERCHE DE PARTIE... (CLIQUER POUR ANNULER)");

                    // Priorité au matchmaking si l'utilisateur est connecté et qu'on ne force pas un scénario particulier
                    // Pour Leaders, on va simplifier : "TROUVER UN MATCH" utilise le matchmaking standard
                    // "LANCER MODE MASTERS" ou "INITIALISER" utilise createGame direct pour du local/private?
                    // On va fusionner : Le bouton principal utilise joinPublicQueue avec le scenarioId si possible?
                    // Le backend joinPublicQueue ne prend pas de scenarioId actuellement.

                    if (user && user.id) {
                      const session = await joinPublicQueue(user.id);
                      setCurrentSession(session);

                      if (session.status === "ACTIVE") {
                        onStartGame(session.id);
                      } else {
                        setSessionStatus("EN ATTENTE D'UN JOUEUR... (CLIQUER POUR ANNULER)");
                        webSocketService.subscribeToSession(session.id, (updatedSession) => {
                          console.log("WS UPDATE:", updatedSession);
                          if (updatedSession.status === "ACTIVE") {
                            onStartGame(updatedSession.id);
                          }
                        });
                      }
                    } else {
                      // Fallback: create game direct (old behavior)
                      handleCreateGame();
                    }
                  } catch (e) {
                    console.error(e);
                    setIsSearching(false);
                    setSessionStatus("");
                    setError("Impossible de rejoindre la file d'attente.");
                  }
                }}
                disabled={false}
                onMouseEnter={() => playButtonHoverSfx()}
                className={`w-full font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 tracking-widest text-sm
                  ${isMastersMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                  } ${isSearching ? 'animate-pulse bg-amber-600 hover:bg-amber-500' : ''}`}
              >
                {isSearching ? sessionStatus : (isMastersMode ? '🎲 LANCER MODE MASTERS' : 'TROUVER UN MATCH')}
              </button>
            </div>
          </div>

          {/* --- RIGHT: JOIN GAME --- */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 hover:border-cyan-500/50 transition-all duration-300 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)] flex flex-col">

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-orbitron font-black italic text-xl lg:text-2xl text-white">
                  REJOINDRE UNE PARTIE PRIVÉE
                </h2>
                {joinMode && (
                  <button
                    onClick={() => setJoinMode(false)}
                    className="text-slate-500 hover:text-white text-[10px] font-rajdhani font-bold uppercase"
                  >
                    ANNULER
                  </button>
                )}
              </div>

              {!joinMode ? (
                <p className="text-slate-400 font-rajdhani text-sm leading-tight font-medium">
                  Rejoindre une partie privée avec un code.
                </p>
              ) : (
                <p className="text-cyan-400 text-[10px] font-orbitron tracking-[0.2em] font-bold">
                  SÉQUENCE D'IDENTIFICATION...
                </p>
              )}
            </div>

            {!joinMode && !createdSessionCode ? (
              <div className="mt-auto w-full flex flex-col gap-3">
                <button
                  onClick={async () => {
                    playButtonClickSfx();
                    try {
                      setIsCreatingPrivate(true);
                      setSessionStatus("CRÉATION DE LA SESSION...");
                      const session = await createPrivateSession(user?.id);
                      setCurrentSession(session);
                      setCreatedSessionCode(session.code || null);
                      setSessionStatus(`CODE: ${session.code} - EN ATTENTE...`);

                      webSocketService.subscribeToSession(session.id, (updatedSession) => {
                        console.log("PRIVATE SESSION UPDATE:", updatedSession);
                        if (updatedSession.status === "ACTIVE") {
                          onStartGame(updatedSession.id);
                        }
                      });
                    } catch (e) {
                      console.error(e);
                      setError("Erreur lors de la création de la partie.");
                      setIsCreatingPrivate(false);
                      setSessionStatus("");
                    }
                  }}
                  disabled={isCreatingPrivate}
                  onMouseEnter={() => playButtonHoverSfx()}
                  className={`w-full ${isCreatingPrivate ? 'opacity-50 cursor-not-allowed bg-emerald-900/40' : 'bg-emerald-600/20 hover:bg-emerald-600/40'} text-emerald-400 border border-emerald-500/50 font-orbitron font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] tracking-widest text-sm`}
                >
                  {isCreatingPrivate ? "SÉQUENCE DE LANCEMENT..." : "CRÉER UNE PARTIE"}
                </button>

                <button
                  onClick={() => setJoinMode(true)}
                  onMouseEnter={() => playButtonHoverSfx()}
                  className="w-full bg-white text-black hover:bg-cyan-200 font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] tracking-widest text-sm"
                >
                  ENTRER UN CODE
                </button>
              </div>
            ) : createdSessionCode ? (
              <div className="mt-auto w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="text-center">
                  <p className="text-cyan-500 font-orbitron text-[10px] tracking-[0.3em] font-bold mb-4 uppercase">CODE DE TRANSMISSION</p>
                  <div className="flex gap-2 justify-center mb-2">
                    {createdSessionCode.split('').map((char, i) => (
                      <div key={i} className="w-10 h-12 bg-cyan-950/40 border-2 border-cyan-500/50 flex items-center justify-center text-white text-2xl font-orbitron font-black rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-emerald-400 font-rajdhani text-sm font-bold tracking-widest animate-pulse uppercase">EN ATTENTE D'UN JOUEUR...</p>
                  </div>
                  <button
                    onClick={() => {
                      setCreatedSessionCode(null);
                      setIsCreatingPrivate(false);
                      setSessionStatus("");
                    }}
                    className="text-slate-500 hover:text-white text-[10px] font-rajdhani font-bold uppercase tracking-widest transition-colors"
                  >
                    ANNULER LA SESSION
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300 flex flex-col justify-end mt-auto">
                <div className="flex gap-2 mb-6 justify-center">
                  {code.map((char, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      className="w-8 h-10 bg-slate-900/80 border border-cyan-500/30 text-center text-lg font-orbitron font-bold text-white rounded focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all uppercase"
                    />
                  ))}
                </div>
                <button
                  onClick={async () => {
                    const codeStr = code.join("");
                    if (codeStr.length < 4) return;
                    playButtonClickSfx();
                    try {
                      const session = await joinPrivateSession(codeStr, user?.id);
                      if (session.status === "ACTIVE") {
                        onStartGame(session.id);
                      } else {
                        // If waiting (shouldn't happen for 2nd player but logic safe)
                        onStartGame(session.id);
                      }
                    } catch (e) {
                      console.error(e);
                      setError("Code invalide ou session pleine.");
                    }
                  }}
                  onMouseEnter={() => playButtonHoverSfx()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-widest text-sm"
                >
                  VALIDER
                </button>
              </div>
            )}

          </div>
        </div>

        <div className="mt-auto shrink-0 pb-2 flex flex-col items-center gap-1">

          <p className="text-[10px] font-orbitron text-slate-500 tracking-[0.3em] uppercase opacity-70">
            System Ready • Neural Interface Standby • Latency: 14ms • Link: {webSocketService.isConnected() ? "ONLINE" : "OFFLINE"}
          </p>
        </div>
      </div>

      {/* --- MODALS --- */}

      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLoginOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-cyan-500"></span>
              {isRegistering ? "NOUVELLE RECRUE" : "IDENTIFICATION"}
            </h2>

            <div className="space-y-5 font-rajdhani">
              {successMsg && <div className="text-emerald-400 text-sm font-bold text-center bg-emerald-900/20 p-2 rounded border border-emerald-500/20">{successMsg}</div>}
              {error && <div className="text-red-400 text-sm font-bold text-center bg-red-900/20 p-2 rounded border border-red-500/20">{error}</div>}
              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Identifiant</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="COMMANDEUR..." />
              </div>
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Nom de code</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="PSEUDO" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Clef de sécurité</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="••••••••" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300">
                  <input type="checkbox" className="rounded bg-slate-800 border-slate-700 accent-cyan-500" />
                  Se souvenir de moi
                </label>
                <button className="hover:text-cyan-400 transition-colors">Mot de passe oublié ?</button>
              </div>

              <button
                onClick={handleAuth}
                onMouseEnter={() => playButtonHoverSfx()}
                disabled={isLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-orbitron font-bold tracking-widest rounded mt-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {isLoading ? "TRAITEMENT..." : (isRegistering ? "S'ENROLER" : "ACCÉDER")}
              </button>

              <div className="text-center mt-4">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-cyan-400 text-sm underline decoration-dotted underline-offset-4">
                  {isRegistering ? "J'ai déjà un matricule" : "Créer un nouveau profil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]" onClick={(e: any) => e.stopPropagation()}>
            <button onClick={() => setSettingsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-emerald-500"></span>
              PARAMÈTRES SYSTÈME
            </h2>
            <div className="space-y-8 font-rajdhani text-lg">
              <div>
                <label className="text-emerald-400 font-bold tracking-widest text-sm uppercase block mb-3">Volume Audio</label>
                <input type="range" min="0" max="100" value={volume} onChange={(e: any) => setVolume(Number(e.target.value))} className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                <div className="text-right text-slate-400 text-sm mt-1">{volume}%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded border border-white/5">
                <span className="text-slate-200">Effets Sonores (SFX)</span>
                <input type="checkbox" checked={sfxEnabled} onChange={(e: any) => setSfxEnabled(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)]" onClick={(e: any) => e.stopPropagation()}>
            <button onClick={() => setAboutOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-purple-500"></span>
              BASE DE DONNÉES
            </h2>
            <div className="space-y-4 font-rajdhani text-lg text-slate-300 leading-relaxed">
              <p>Simulation tactique développée pour l'entraînement des unités d'élite.</p>
              <p className="text-sm text-slate-500 border-t border-white/10 pt-4 mt-8">
                Projet Hackathon ESIEA 2026<br />
                Version du Noyau : 2.0.42-BETA
              </p>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}