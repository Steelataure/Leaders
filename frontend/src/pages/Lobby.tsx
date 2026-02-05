
import { useState, useEffect } from "react";
import { authService } from "../services/auth.service";
import type { User } from "../types/auth.types";

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
  const [volume, setVolume] = useState(50);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  // Login/Register State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
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
          setUser({ username: "Joueur", id: "0", email, roles: [] });
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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const [playButtonClickSfx] = useSound(buttonClickSfx);
  const [playButtonHoverSfx] = useSound(buttonHoverSfx);

  const closeAllModals = () => {
    setLoginOpen(false);
    setSettingsOpen(false);
    setAboutOpen(false);
    setDropdownOpen(false);
    setSuccessMsg(null);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 font-sans relative overflow-hidden">
      <style>{styles}</style>

      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#050b1f] to-[#020617]" />

        {/* Animated Grid */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />

        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] animate-pulse delay-1000" />

        {/* Border Gradients */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
        <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Corner Accents */}
        <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-xl" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-xl" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl" />

        {/* Scanlines Overlay */}
        <div className="scanlines absolute inset-0 opacity-40" />
        <div className="animate-scan-line" />
      </div>

      {/* --- UI CONTENT --- */}
      <div className="relative z-10 flex flex-col items-center min-h-screen w-full px-6 overflow-hidden">

        {/* TOP BAR / Login / Rules */}
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
          {/* Beta Badge */}
          <div className="hidden md:block bg-yellow-400 text-black font-orbitron font-bold px-3 py-1 text-xs transform rotate-3 shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            BETA 2.0
          </div>

          {/* Auth Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseEnter={() => playButtonHoverSfx()}
            className="relative border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500/10 font-rajdhani font-bold py-2 px-6 rounded transition-all tracking-wider text-sm backdrop-blur-sm flex items-center gap-2"
            data-testid="connexionUserButton"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {user ? user.username.toUpperCase() : "CONNEXION"}
          </button>

          {/* Dropdown Auth */}
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="py-1 font-rajdhani font-semibold">
                {!user ? (
                  <button
                    onClick={() => { closeAllModals(); setSuccessMsg(null); setError(null); setLoginOpen(true); }}
                    className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20 hover:text-cyan-400 border-b border-white/5"
                    data-testid="connexionButtonDropdown"
                  >
                    CONNEXION
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 border-b border-white/5"
                    data-testid="deconnexionButtonDropdown"
                  >
                    DÉCONNEXION
                  </button>
                )}
                <button
                  className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => { closeAllModals(); setSettingsOpen(true); }}
                  data-testid="parametresButtonDropdown"
                >
                  PARAMÈTRES
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => { closeAllModals(); setAboutOpen(true); }}
                  data-testid="infosSystemeButtonDropdown"
                >
                  INFOS_SYSTÈME
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HEADER SECTION - Spacious */}
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
                REJOINDRE UNE PARTIE EN LIGNE
              </h2>
              <p className="text-slate-400 font-rajdhani text-sm leading-tight font-medium">
                Affrontez un adversaire aléatoire dans un duel classé.
              </p>
            </div>

            <div className="mt-auto w-full">
              <div className="flex items-center gap-2 mb-3 pl-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                <p className="text-cyan-400 font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse">
                  VOTRE ELO : <span className="text-white text-xs">1200</span>
                </p>
              </div>
              <button
                onClick={() => {
                  playButtonClickSfx();
                  onStartGame("create");
                }}
                onMouseEnter={() => playButtonHoverSfx()}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] tracking-widest text-sm"
              >
                TROUVER UN MATCH
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

            {!joinMode ? (
              <button
                onClick={() => setJoinMode(true)}
                onMouseEnter={() => playButtonHoverSfx()}
                className="mt-auto w-full bg-white text-black hover:bg-cyan-200 font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] tracking-widest text-sm"
              >
                ENTRER UN CODE
              </button>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300 flex flex-col justify-end mt-auto">
                <div className="flex gap-2 mb-3 justify-center">
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
                  onClick={() => onStartGame(code.join(""))}
                  onMouseEnter={() => playButtonHoverSfx()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-widest text-sm"
                >
                  VALIDER
                </button>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-auto shrink-0 pb-2 flex flex-col items-center">
          <p className="text-[10px] font-orbitron text-slate-500 tracking-[0.3em] uppercase opacity-70">
            System Ready • Neural Interface Standby • Latency: 14ms
          </p>
        </div>
      </div>

      {/* --- MODALS (Login, Settings, About) --- */}

      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLoginOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-cyan-500"></span>
              <span data-testid="connexionPopUpTitle">{isRegistering ? "NOUVELLE RECRUE" : "IDENTIFICATION"}</span>
            </h2>

            <div className="space-y-5 font-rajdhani">
              {successMsg && <div className="text-emerald-400 text-sm font-bold text-center bg-emerald-900/20 p-2 rounded border border-emerald-500/20" data-testid='messageSuccesConnexion'>{successMsg}</div>}
              {error && <div className="text-red-400 text-sm font-bold text-center bg-red-900/20 p-2 rounded border border-red-500/20" data-testid='messageErreurConnexion_Inscription'>{error}</div>}
              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Identifiant</label>
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="COMMANDEUR..." data-testid="connexionIdentifiantInput" />
              </div>
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Nom de code</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="PSEUDO" data-testid="connexionPseudoInput" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Clef de sécurité</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-4 py-3 text-white outline-none font-medium" placeholder="••••••••" data-testid="connexionMdpInput" />
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
                data-testid="connexionProfilButton"
              >
                {isLoading ? "TRAITEMENT..." : (isRegistering ? "S'ENROLER" : "ACCÉDER")}
              </button>

              <div className="text-center mt-4">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-cyan-400 text-sm underline decoration-dotted underline-offset-4" data-testid="registerButton">
                  {isRegistering ? "J'ai déjà un matricule" : "Créer un nouveau profil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSettingsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-emerald-500"></span>
              PARAMÈTRES SYSTÈME
            </h2>
            <div className="space-y-8 font-rajdhani text-lg">
              <div>
                <label className="text-emerald-400 font-bold tracking-widest text-sm uppercase block mb-3">Volume Audio</label>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                <div className="text-right text-slate-400 text-sm mt-1">{volume}%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded border border-white/5">
                <span className="text-slate-200">Effets Sonores (SFX)</span>
                <input type="checkbox" checked={sfxEnabled} onChange={(e) => setSfxEnabled(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)]" onClick={(e) => e.stopPropagation()}>
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

    </div>
  );
}
