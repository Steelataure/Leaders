import { useState, useEffect, useRef } from "react";
import { authService } from "../services/auth.service";
import { joinPublicQueue, createPrivateSession, joinPrivateSession, cancelSearch, createGame, createAiGame, API_BASE_URL } from "../api/gameApi";
import { webSocketService } from "../services/WebSocketService";
import type { User } from "../types/auth.types";
import { CHARACTER_IMAGES } from "../constants/characters";
import RankBadge from "../components/RankBadge";
import Leaderboard from "../components/Leaderboard";
import { Rain } from "../components/Rain";
import { GlitchText } from "../components/GlitchText";
import { HexGrid } from "../components/HexGrid";
import { SystemStatus } from "../components/SystemStatus";
import useSound from 'use-sound';
import buttonClickSfx from '../sounds/buttonClick.mp3';
import { LogOut, Plus, Settings, Trophy, User as UserIcon } from "lucide-react";

export default function Lobby({
  onStartGame,
  onOpenRankInfo,
}: {
  onStartGame: (id: string) => void;
  onOpenRankInfo: () => void;
}) {
  const [joinMode, setJoinMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [createdSessionCode, setCreatedSessionCode] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Matchmaking
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = useRef(isSearching);
  const [_currentSession, setCurrentSession] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");

  // Game Mode
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  // Stats
  const [stats, setStats] = useState<{ inGame: number; inQueue: number } | null>(null);

  // Sound
  const [playClick] = useSound(buttonClickSfx, { volume: volume / 100 });
  const playButtonClickSfx = () => { if (sfxEnabled) playClick(); };

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    return () => {
      if (isSearchingRef.current && user && user.id) {
        cancelSearch(user.id).catch(err => console.error("Failed to cancel search on unmount", err));
      }
    };
  }, [user]);

  useEffect(() => {
    if (!isSearching || !user?.id || !_currentSession?.id) return;
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/sessions/${_currentSession.id}/heartbeat`, { method: 'POST' })
        .catch(err => console.error("Lobby heartbeat failed", err));
    }, 5000);
    return () => clearInterval(interval);
  }, [isSearching, user?.id, _currentSession?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats`, { cache: "no-store", headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let currentUser = authService.getUser();
    if (!currentUser || currentUser.username === "Joueur") {
      const sessionGuestId = sessionStorage.getItem('guest_id') || crypto.randomUUID();
      sessionStorage.setItem('guest_id', sessionGuestId);
      currentUser = { id: sessionGuestId, username: "Joueur", email: "", elo: 1000, roles: [] };
    }
    setUser(currentUser);

    if (currentUser && currentUser.username !== "Joueur" && currentUser.email !== "") {
      authService.getProfile(currentUser.id)
        .then(updatedUser => setUser(updatedUser))
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
        setIsRegistering(false);
        setSuccessMsg("Compte créé avec succès ! Veuillez vous connecter.");
      } else {
        const response = await authService.login({ email, password });
        if (response.user) {
          setUser(response.user);
        } else {
          const guestId = sessionStorage.getItem('guest_id') || crypto.randomUUID();
          sessionStorage.setItem('guest_id', guestId);
          setUser({ username: "Joueur", id: guestId, email, elo: 1000, roles: [] });
        }
        setLoginOpen(false);
      }
    } catch (err) {
      setError(isRegistering ? "Échec de l'inscription." : "Échec de la connexion.");
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

    if (value && index < 5) document.getElementById(`code-${index + 1}`)?.focus();

    if (newCode.every(char => char !== "")) {
      const fullCode = newCode.join("");
      try {
        setSessionStatus("CONNEXION...");
        const session = await joinPrivateSession(fullCode, user?.id);
        setCurrentSession(session);
        if (session.status === "ACTIVE") {
          onStartGame(session.id);
        } else {
          // FIX: On s'abonne ET on vérifie si l'état a déjà changé entre temps (Bug Sync)
          console.log("Subscribing to session for private join:", session.id);
          webSocketService.subscribeToSession(session.id, (updatedSession) => {
            console.log("Session update received via WS:", updatedSession.status);
            if (updatedSession.status === "ACTIVE") onStartGame(updatedSession.id);
          });
        }
      } catch (err) {
        setError("Code invalide ou session pleine.");
        setSessionStatus("");
      }
    }
  };

  const handleCreateGame = async () => {
    try {
      playButtonClickSfx();
      const gameId = await createGame(selectedScenario);
      onStartGame(gameId);
    } catch (error) {
      alert("Erreur création partie.");
    }
  };

  const closeAllModals = () => {
    setLoginOpen(false); setSettingsOpen(false); setAboutOpen(false); setDropdownOpen(false);
    setSuccessMsg(null); setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans relative overflow-hidden flex flex-col">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: 'url("/bg.png")' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-slate-950/80 to-slate-900/50" />
      <HexGrid />
      <Rain />

      {/* Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />


      {/* TOP HEADER */}
      <div className="relative z-50 flex items-center justify-between px-4 md:px-8 py-4 md:py-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            LEADERS
          </h1>
          <div className="hidden lg:flex flex-col ml-4">
            <span className="text-[10px] font-rajdhani text-cyan-500/60 uppercase tracking-[0.2em] leading-none">Tactical Interface</span>
            <span className="text-[10px] font-rajdhani text-cyan-500/40 uppercase tracking-[0.2em] leading-none">v2.1.0-STABLE</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={onOpenRankInfo} className="text-sm font-rajdhani font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">CLASSEMENT</span>
          </button>

          <button onClick={() => setSettingsOpen(true)} className="text-slate-400 hover:text-white transition-colors">
            <Settings className="w-6 h-6" />
          </button>

          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`group relative border px-3 md:px-4 py-1.5 md:py-2 rounded flex items-center gap-2 md:gap-3 transition-all backdrop-blur-sm
              ${user && user.username !== "Joueur" ? 'border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-900/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}
            `}
          >
            <div className="flex flex-col items-end leading-none hidden xs:flex">
              <span className="text-[8px] md:text-[10px] text-slate-500 font-orbitron uppercase tracking-widest text-right">Opérateur</span>
              <span className={`font-rajdhani font-bold text-sm md:text-lg transition-colors uppercase tracking-wide ${user && user.username !== "Joueur" ? 'text-cyan-400' : 'text-slate-300'}`}>
                {user && user.username !== "Joueur" ? user.username : "SESSION INVITÉ"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {user && user.username !== "Joueur" && user.avatar ? (
                <img src={CHARACTER_IMAGES[user.avatar]} className="w-6 h-6 rounded-full border border-cyan-500/50 object-cover" alt="Avatar" />
              ) : (
                <UserIcon className={`w-5 h-5 ${user && user.username !== "Joueur" ? 'text-cyan-400' : 'text-slate-400'}`} />
              )}
              {user && user.username !== "Joueur" && <RankBadge elo={user.elo} size="sm" showElo={true} />}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 border border-cyan-500/20 rounded-xl backdrop-blur-xl shadow-2xl z-50 overflow-hidden font-rajdhani font-semibold">
              {(!user || user.username === "Joueur") ? (
                <div className="flex flex-col p-2 gap-1">
                  <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-bold border-b border-white/5 mb-1">
                    Compte Invité
                  </div>
                  <button onClick={() => { closeAllModals(); setLoginOpen(true); setIsRegistering(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-cyan-500/20 hover:text-cyan-400 rounded transition-colors flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
                    SE CONNECTER
                  </button>
                  <button onClick={() => { closeAllModals(); setLoginOpen(true); setIsRegistering(true); }} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 rounded transition-colors flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Plus className="w-4 h-4" /></div>
                    CRÉER UN COMPTE
                  </button>
                </div>
              ) : (
                <div className="flex flex-col p-2">
                  <div className="px-3 py-2 text-xs text-cyan-500/70 uppercase tracking-wider font-bold border-b border-white/5 mb-1 flex justify-between items-center">
                    Compte Actif
                    <span className="text-[10px] bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-400">{user.elo} ELO</span>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded transition-colors flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
                    DÉCONNEXION
                  </button>
                  <button
                    onClick={() => { setAvatarModalOpen(true); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
                    CHANGER D'AVATAR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch justify-center lg:h-[calc(100vh-100px)] pb-12 overflow-y-auto lg:overflow-hidden">
        {/* LEFT: ACTION PANEL */}
        <div className="flex-[2] flex flex-col gap-6 h-full">

          {/* HERO / PLAY */}
          <div className="flex-1 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-md border-l-2 border-cyan-500/50 rounded-r-xl p-8 flex flex-col justify-between group relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] holo-corner bg-scanline" >

            {/* Decorative Lines */}
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5" />

            <div className="relative z-10 w-full">
              {user && user.username !== "Joueur" ? (
                <div className="flex items-center gap-4 mb-6 bg-cyan-950/20 p-4 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-sm animate-in fade-in slide-in-from-left duration-500">
                  <div className="relative cursor-pointer group/avatar" onClick={() => setAvatarModalOpen(true)}>
                    <div className="w-14 h-14 bg-cyan-900/20 rounded hexagon-mask flex items-center justify-center border-2 border-cyan-500/50 overflow-hidden relative">
                      {user.avatar ? (
                        <img src={CHARACTER_IMAGES[user.avatar]} className="w-full h-full object-cover" alt="Avatar" />
                      ) : (
                        <UserIcon className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                      )}
                      <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-500/80 font-orbitron tracking-widest uppercase">Identité Confirmée</span>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">OPERATOR</span>
                    </div>
                    <div className="text-2xl text-white font-bold font-orbitron tracking-wide text-shadow-neon">{user.username}</div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>RANG: <span className="text-amber-400 font-bold">{user.elo}</span></span>
                      <span className="w-px h-3 bg-white/10" />
                      <span>ID: #{user.id.substring(0, 4).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4"></div>
              )}

              <h2 className="font-orbitron text-2xl md:text-4xl font-black text-white mb-2 tracking-wide uppercase italic">
                <GlitchText text="RECHERCHE DE PARTIE" />
              </h2>
              <p className="font-rajdhani font-medium text-slate-400 max-w-lg text-base md:text-lg leading-tight mb-4">
                Rejoignez le champ de bataille. Prouvez votre valeur. Dominez le classement.
              </p>

              {(!user || user.username === "Joueur") && (
                <div className="bg-amber-500/10 border-l-2 border-amber-500 pl-3 py-2 text-amber-500 text-sm font-rajdhani font-bold max-w-md animate-pulse">
                  ⚠️ Vous devez être connecté pour gagner ou perdre de l'Elo.
                </div>
              )}
            </div>

            <div className="relative z-10 mt-8 flex flex-col gap-4">

              {/* Stats Bar */}
              <div className="flex items-center gap-6 text-xs font-orbitron tracking-widest text-slate-500 bg-black/40 p-2 rounded border border-white/5 w-fit">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  JEU: <span className="text-white">{stats ? stats.inGame : 0}</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  FILE: <span className="text-white">{stats ? stats.inQueue : 0}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(Number(e.target.value))}
                  className="bg-slate-950 border border-white/10 text-slate-200 font-rajdhani font-bold text-lg rounded px-4 py-3 outline-none focus:border-cyan-500 min-w-full sm:min-w-[240px] appearance-none"
                >
                  <option value={0}>⚔️ MODE CLASSÉ</option>
                  <option value={-1}>🤖 VS IA (FACILE)</option>
                  <option value={-2}>😈 VS IA (DIFFICILE)</option>
                  <option value={-3}>👹 VS IA (EXPERT)</option>
                </select>

                <button
                  onClick={async () => {
                    playButtonClickSfx();
                    if (isSearching) {
                      if (user && user.id) cancelSearch(user.id);
                      setIsSearching(false);
                    } else {
                      // VS AI Check
                      if (selectedScenario === -1 || selectedScenario === -2 || selectedScenario === -3) {
                        try {
                          let difficulty: "EASY" | "HARD" | "EXPERT" = "EASY";
                          if (selectedScenario === -2) difficulty = "HARD";
                          if (selectedScenario === -3) difficulty = "EXPERT";
                          const gameId = await createAiGame(user?.id || "GUEST", difficulty);
                          onStartGame(gameId);
                        } catch (e) {
                          alert("Erreur création partie IA");
                        }
                        return;
                      }

                      setIsSearching(true);
                      setSessionStatus("RECHERCHE...");
                      try {
                        if (user?.id) {
                          const session = await joinPublicQueue(user.id);
                          setCurrentSession(session);
                          if (session.status === "ACTIVE") {
                            onStartGame(session.id);
                          } else {
                            // FIX: S'abonner et vérifier l'état pour éviter de rater le message WS (Race Condition)
                            console.log("Subscribing to session topic:", session.id);
                            webSocketService.subscribeToSession(session.id, (s) => {
                              console.log("Lobby: Session event:", s.status);
                              if (s.status === "ACTIVE") onStartGame(s.id);
                            });
                          }
                        } else {
                          handleCreateGame();
                        }
                      } catch (e) {
                        setIsSearching(false);
                        setSessionStatus("ERREUR");
                      }
                    }
                  }}
                  className={`
                              relative flex-1 py-4 px-8 font-orbitron font-bold tracking-[0.1em] uppercase transition-all duration-300
                              clip-path-button
                              ${isSearching
                      ? 'bg-amber-600/20 border-amber-500 text-amber-500 hover:bg-amber-600/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'}
                              `}
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                >
                  {isSearching ? sessionStatus : (selectedScenario < 0 ? "LANCER VS IA" : "RECHERCHER UNE PARTIE")}
                </button>
              </div>
            </div>
          </div>

          {/* PRIVATE GAME */}
          <div className="bg-slate-900/80 backdrop-blur border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition-colors holo-corner">
            <div className="flex-1">
              <h3 className="font-orbitron text-lg font-bold text-slate-200 uppercase tracking-wide">Partie Privée</h3>
              <p className="text-slate-500 text-sm font-rajdhani">Code d'accès requis pour la connexion sécurisée.</p>
            </div>

            {joinMode ? (
              <div className="flex flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-right w-full md:w-auto">
                <div className="flex gap-1 md:gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      className="w-9 h-9 md:w-10 md:h-10 bg-black border border-white/20 rounded text-center text-lg md:text-xl font-mono text-cyan-400 focus:border-cyan-500 outline-none uppercase"
                    />
                  ))}
                </div>
                <button onClick={() => setJoinMode(false)} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400">✕</button>
              </div>
            ) : createdSessionCode ? (
              <div className="flex-1 flex items-center justify-end gap-4 animate-in fade-in">
                <div className="text-right">
                  <div className="text-xs text-emerald-500 font-orbitron tracking-widest uppercase mb-1">Code Session</div>
                  <span className="font-mono text-3xl text-white tracking-widest bg-emerald-900/20 px-4 py-1 rounded border border-emerald-500/30">{createdSessionCode}</span>
                </div>
                <button onClick={() => { setCreatedSessionCode(null); setIsCreatingPrivate(false); }} className="text-xs text-red-400 hover:text-red-300 font-orbitron tracking-widest bg-red-900/10 px-3 py-2 rounded h-fit">ANNULER</button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button
                  onClick={async () => {
                    try {
                      setIsCreatingPrivate(true);
                      const s = await createPrivateSession(user?.id);
                      setCreatedSessionCode(s.code ?? null);
                      console.log("Lobby: Private session created:", s.id);
                      webSocketService.subscribeToSession(s.id, (us) => {
                        console.log("Lobby: Private session event:", us.status);
                        if (us.status === "ACTIVE") onStartGame(us.id);
                      });
                    } catch (e) {
                      setIsCreatingPrivate(false);
                    }
                  }}
                  disabled={isCreatingPrivate}
                  className="w-full sm:w-auto px-6 py-2 border-l-2 border-emerald-500 bg-emerald-900/20 hover:bg-emerald-500/20 text-emerald-400 font-orbitron text-sm font-bold tracking-widest transition-all skew-x-[-10deg] hover:skew-x-[-15deg]"
                >
                  <span className="skew-x-[10deg] block">CRÉER</span>
                </button>
                <button
                  onClick={() => setJoinMode(true)}
                  className="w-full sm:w-auto px-6 py-2 border-l-2 border-white/30 bg-white/5 hover:bg-white/10 text-slate-200 font-orbitron text-sm font-bold tracking-widest transition-all skew-x-[-10deg] hover:skew-x-[-15deg]"
                >
                  <span className="skew-x-[10deg] block">REJOINDRE</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LEADERBOARD */}
        <div className="flex-1 min-w-full lg:min-w-[320px] bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl holo-corner bg-scanline lg:h-full min-h-[400px]">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="font-orbitron font-bold text-cyan-400 tracking-widest text-sm uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              Classement Global
            </h3>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <Leaderboard />
          </div>
        </div>
      </div>

      <SystemStatus />

      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-slate-900 border border-cyan-500/30 p-6 md:p-8 rounded-xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <button onClick={() => setLoginOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="font-orbitron text-xl md:text-2xl font-bold text-white mb-6 uppercase tracking-wider text-center border-b border-white/10 pb-4">
              {isRegistering ? "Initialisation" : "Authentification"}
            </h2>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded mb-4 text-sm font-rajdhani font-bold flex items-center gap-2">⚠️ {error}</div>}
            {successMsg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded mb-4 text-sm font-rajdhani font-bold flex items-center gap-2">✓ {successMsg}</div>}

            <div className="space-y-4 font-rajdhani">
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors" />
              </div>
              {isRegistering && (
                <div>
                  <label className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1 block">Pseudo</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors" />
                </div>
              )}
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1 block">Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors" />
              </div>

              <button
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold py-3 rounded uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Traitement..." : (isRegistering ? "S'enregistrer" : "Connexion")}
              </button>
            </div>

            <div className="mt-6 text-center border-t border-white/10 pt-4">
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 text-sm font-rajdhani font-bold hover:text-cyan-400 transition-colors">
                {isRegistering ? "Déjà un compte ? Se connecter" : "Créer un nouveau compte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-xl p-6 md:p-8 shadow-2xl" onClick={(e: any) => e.stopPropagation()}>
            <button onClick={() => setSettingsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <Settings className="w-6 h-6 text-slate-400" />
              PARAMÈTRES
            </h2>
            <div className="space-y-8 font-rajdhani text-lg">
              <div>
                <label className="text-slate-300 font-bold tracking-wider text-sm uppercase block mb-3">Volume Mixage</label>
                <input type="range" min="0" max="100" value={volume} onChange={(e: any) => setVolume(Number(e.target.value))} className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                <div className="text-right text-slate-400 text-sm mt-1 font-mono">{volume}%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/30 rounded border border-white/5">
                <span className="text-slate-200">Effets Sonores (SFX)</span>
                <input type="checkbox" checked={sfxEnabled} onChange={(e: any) => setSfxEnabled(e.target.checked)} className="w-5 h-5 accent-cyan-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 p-8 rounded-xl max-w-lg text-slate-300 relative border border-white/10">
            <button onClick={() => setAboutOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="font-orbitron font-bold text-2xl mb-4 text-white">PROTOCOLE LEADERS</h2>
            <p className="font-rajdhani">Version 2.0.4. Système de simulation tactique.</p>
          </div>
        </div>
      )}

      {avatarModalOpen && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-slate-900/90 border border-cyan-500/30 p-8 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setAvatarModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <GlitchText text="✕" />
            </button>

            <h2 className="font-orbitron text-2xl font-bold text-white mb-8 uppercase tracking-[0.2em] text-center border-b border-cyan-500/20 pb-4">
              <GlitchText text="SÉLECTION D'AVATAR" />
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Object.keys(CHARACTER_IMAGES).filter(key => key !== "CUB" && !key.startsWith("LEADER_")).map((key) => (
                <button
                  key={key}
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const updatedUser = await authService.updateAvatar(user.id, key);
                      setUser(updatedUser);
                      setAvatarModalOpen(false);
                    } catch (err) {
                      setError("Erreur lors de la mise à jour de l'avatar");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className={`
                    group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${user.avatar === key ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/10 hover:border-cyan-500/50'}
                  `}
                >
                  <img src={CHARACTER_IMAGES[key]} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <span className="text-[10px] font-orbitron text-cyan-400 font-bold tracking-widest">{key}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}