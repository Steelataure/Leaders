import { useState, useEffect } from "react";
import { authService } from "../services/auth.service";
import type { User } from "../types/auth.types";

// --- ANIMATIONS CSS (à garder dans le fichier ou index.css) ---
const styles = `
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(1000%); }
  }
  .animate-scan { animation: scanline 8s linear infinite; }
  .glass-card { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); }
  .letter-slot { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); }
  .letter-slot:focus-within { border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
`;

export default function Lobby({
  onStartGame,
}: {
  onStartGame: (id: string) => void;
}) {
  const [joinMode, setJoinMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  // Login State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response.user) {
        setUser(response.user);
      } else {
        // Fallback/Mock si l'API ne renvoie pas l'user complet
        setUser({ username: "Joueur", id: "0", email, roles: [] });
      }
      setLoginOpen(false);
    } catch (err) {
      setError("Échec de la connexion. Vérifiez vos identifiants.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setDropdownOpen(false);
  };

  // Gestion de l'input segmenté pour le code
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-focus le suivant
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 font-mono overflow-hidden">
      <style>{styles}</style>

      {/* --- BACKGROUND LAYER --- */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 animate-scan bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-20 w-full" />
        <div className="absolute top-10 left-10 text-[10px] text-blue-500/40">
          SYS_LOG: INITIALIZING_TACTICAL_LOBBY...
        </div>
        <div className="absolute bottom-10 right-10 text-[10px] text-amber-500/40">
          COORDS: 48.8566° N, 2.3522° E
        </div>
      </div>

      {/* --- TOP RIGHT LOGIN MENU --- */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-900/40 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition-all backdrop-blur-md"
        >
          <span className="text-sm font-bold uppercase tracking-wider">
            {user ? user.username : "CONNEXION"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-blue-500/30 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="py-1">
              {!user ? (
                <button
                  onClick={() => {
                    setLoginOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors border-b border-white/5"
                >
                  Se connecter
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors border-b border-white/5"
                >
                  Déconnexion
                </button>
              )}
              <button
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors border-b border-white/5"
                onClick={() => console.log("Settings placeholder")}
              >
                Paramètres
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                onClick={() => {
                  setAboutOpen(true);
                  setDropdownOpen(false);
                }}
              >
                A propos
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* --- HEADER --- */}
        <header className="text-center mb-16">
          <div className="inline-block relative">
            <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-white opacity-90 leading-none">
              LEADERS
            </h1>
            <div className="absolute -right-12 -top-4 bg-amber-500 text-black text-xs font-black px-2 py-1 rotate-12">
              BETA 2.0
            </div>
          </div>
          <p className="mt-4 text-blue-400 tracking-[0.8em] font-bold text-xs uppercase pl-[0.8em]">
            Digital Warfare Simulation
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* --- LEFT: CREATE GAME --- */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-card rounded-3xl border border-white/10 p-8 flex-1 flex flex-col justify-between hover:border-blue-500/30 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                    🏰
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-blue-500 font-bold uppercase">
                      Instance
                    </div>
                    <div className="text-white font-bold">ALPHA_STATION</div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 italic">
                  CRÉER UNE PARTIE
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Générez un environnement de combat sécurisé et attendez qu'un
                  opposant se connecte à votre fréquence.
                </p>
              </div>
              <button
                onClick={() => onStartGame("create")}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Initialiser le Serveur
              </button>
            </div>
          </div>

          {/* --- RIGHT: JOIN GAME --- */}
          <div className="lg:col-span-7">
            <div
              className={`glass-card rounded-3xl border ${joinMode ? "border-blue-500" : "border-white/10"} p-8 transition-all duration-500`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white italic">
                  REJOINDRE
                </h2>
                {!joinMode ? (
                  <button
                    onClick={() => setJoinMode(true)}
                    className="px-6 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white rounded-full text-xs font-bold transition-all uppercase tracking-widest"
                  >
                    Activer le Terminal
                  </button>
                ) : (
                  <button
                    onClick={() => setJoinMode(false)}
                    className="text-slate-500 hover:text-white text-xs"
                  >
                    ANNULER
                  </button>
                )}
              </div>

              {!joinMode ? (
                <div className="space-y-4">
                  {/* Liste des serveurs existants ultra-stylisée */}
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <div className="text-sm font-bold text-white">
                            FREQUENCE_{i * 42}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            Host: Commander_Z
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all font-bold">
                        CONNECTER _
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  <p className="text-blue-500 text-[10px] mb-4 uppercase tracking-[0.2em] font-bold">
                    Input Authentication Code :
                  </p>
                  <div className="flex gap-2 mb-8">
                    {code.map((char, i) => (
                      <input
                        key={i}
                        id={`code-${i}`}
                        type="text"
                        maxLength={1}
                        value={char}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        className="w-full aspect-square text-center text-3xl font-black text-white letter-slot rounded-xl focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => onStartGame(code.join(""))}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Établir la Connexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- FOOTER STATUS --- */}
        <footer className="mt-12 flex justify-between items-end">
          <div className="flex gap-12">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                Status
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-white text-xs font-bold">
                  SERVEURS_OPÉRATIONNELS
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                Latency
              </div>
              <div className="text-white text-xs font-bold">14ms</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-700 font-bold italic">
              © 2026 LEADERS_PROJECT. ALL RIGHTS RESERVED.
            </div>
          </div>
        </footer>
      </div>

      {/* --- LOGIN MODAL --- */}
      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div
            className="relative w-full max-w-md bg-[#0f172a] border border-blue-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLoginOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
              CONNEXION
            </h2>

            <div className="space-y-4">
              {error && (
                <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-2 rounded">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="Pseudo ou Email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300">
                  <input type="checkbox" className="rounded bg-slate-800 border-slate-700" />
                  Se souvenir de moi
                </label>
                <button className="hover:text-blue-400 transition-colors">Mot de passe oublié ?</button>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Accéder au système"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ABOUT MODAL --- */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div
            className="relative w-full max-w-lg bg-[#0f172a] border border-blue-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              A PROPOS
            </h2>

            <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
              <p>
                Ce projet à été réalisé dans le cadre d'un Hackathon réalisé en
                5ème année d'école d'Ingénieur au sein de l'ESIEA Ivry-sur-seine.
                Tout droits réservés.
              </p>
              <p className="font-bold text-white">Merci aux contributeurs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
