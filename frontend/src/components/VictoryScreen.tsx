import { useEffect, useState } from "react";
import { CHARACTER_IMAGES } from "../constants/characters";

/**
 * Composant VictoryScreen - Écran de victoire DYNAMIQUE
 * S'affiche quand un leader est capturé ou encerclé
 * Jeu "Leaders" - Hackathon ESIEA
 */

// === TYPES ===

type VictoryType = "CAPTURE" | "ENCIRCLEMENT" | "TIMEOUT" | "RESIGNATION";

interface VictoryScreenProps {
  winner: 0 | 1;
  victoryType: VictoryType;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  // 🆕 Props dynamiques
  turnNumber?: number;
  winnerPieceCount?: number;
  loserPieceCount?: number;
  winnerElo?: number; // 🆕 Added optionally
  winnerEloChange?: number; // 🆕 Added
  loserEloChange?: number; // 🆕 Added
  isLocalPlayerWinner?: boolean; // 🆕 Added for context
  winnerName?: string; // 🆕 Added for animation
  winnerAvatar?: string; // 🆕 Added
  reason?: string; // 🆕 Added for specifics
  onViewBoard?: () => void; // 🆕 Added to minify
}

// === CONSTANTES ===

const PLAYER_CONFIG = {
  0: {
    name: "Joueur 1",
    color: "#00f5ff", // Cyan
    colorLight: "#67e8f9",
    gradient: "from-cyan-500 to-blue-500",
    bgGlow: "rgba(0, 245, 255, 0.3)",
    emoji: "👑",
  },
  1: {
    name: "Joueur 2",
    color: "#ef4444",
    colorLight: "#f87171",
    gradient: "from-red-500 to-rose-500",
    bgGlow: "rgba(239, 68, 68, 0.3)",
    emoji: "👑",
  },
};

const VICTORY_CONFIG: Record<
  VictoryType,
  { label: string; icon: string; description: string }
> = {
  CAPTURE: {
    label: "Capture du Leader",
    icon: "⚔️",
    description: "Le Leader adverse a été capturé !",
  },
  ENCIRCLEMENT: {
    label: "Encerclement Total",
    icon: "🔄",
    description: "Le Leader adverse n'a plus aucune issue !",
  },
  TIMEOUT: {
    label: "Temps Épuisé",
    icon: "⌛",
    description: "Le temps de l'adversaire est écoulé !",
  },
  RESIGNATION: {
    label: "Abandon",
    icon: "🏳️",
    description: "L'adversaire a capitulé !",
  },
};

// === COMPOSANTS ===

function ConfettiPiece({ index, color }: { index: number; color: string }) {
  const size = Math.random() * 10 + 5;
  const left = Math.random() * 100;
  const delay = Math.random() * 3;
  const duration = Math.random() * 2 + 3;
  const rotation = Math.random() * 360;

  const shapes = ["●", "■", "▲", "★", "♦", "●"];
  const shape = shapes[index % shapes.length];

  return (
    <div
      className="confetti-piece absolute text-2xl pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-20px",
        color: color,
        fontSize: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {shape}
    </div>
  );
}

function ConfettiSystem({ winnerColor }: { winnerColor: string }) {
  const colors = [
    winnerColor,
    "#fbbf24",
    "#f472b6",
    "#34d399",
    "#a78bfa",
    "#ffffff",
  ];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} index={piece.id} color={piece.color} />
      ))}
    </div>
  );
}

function GlowingRings({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 opacity-20 animate-ping-slow"
          style={{
            width: `${150 + i * 100}px`,
            height: `${150 + i * 100}px`,
            borderColor: color,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function SparkleStars({ color }: { color: string }) {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2,
    size: Math.random() * 15 + 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-sparkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
          }}
        >
          <svg
            width={star.size}
            height={star.size}
            viewBox="0 0 24 24"
            fill={color}
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function AnimatedTrophy({ color }: { color: string }) {
  return (
    <div className="relative animate-bounce-slow">
      <div
        className="absolute inset-0 blur-2xl opacity-50 scale-150"
        style={{ backgroundColor: color }}
      />
      <svg
        width="120"
        height="120"
        viewBox="0 0 64 64"
        className="relative z-10 drop-shadow-2xl"
      >
        <path
          d="M20 8H44V12H48C52 12 56 16 56 20C56 28 50 32 44 32V36C44 40 40 44 36 44H28C24 44 20 40 20 36V32C14 32 8 28 8 20C8 16 12 12 16 12H20V8Z"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
        <path
          d="M16 16C12 16 12 20 12 22C12 26 14 28 18 28"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M48 16C52 16 52 20 52 22C52 26 50 28 46 28"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M32 16L34 22L40 22L35 26L37 32L32 28L27 32L29 26L24 22L30 22Z"
          fill="#fff"
        />
        <rect
          x="26"
          y="44"
          width="12"
          height="4"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
        <rect
          x="22"
          y="48"
          width="20"
          height="6"
          rx="2"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
        <rect
          x="18"
          y="54"
          width="28"
          height="4"
          rx="1"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute -top-2 -left-2 text-2xl animate-float">✨</div>
      <div className="absolute -top-4 right-0 text-xl animate-float-delayed">
        ⭐
      </div>
      <div className="absolute -bottom-2 -right-4 text-2xl animate-float">
        ✨
      </div>
    </div>
  );
}

interface StyledButtonProps {
  onClick: () => void;
  variant: "primary" | "secondary";
  children: React.ReactNode;
  color?: string;
}

function StyledButton({
  onClick,
  variant,
  children,
  color,
}: StyledButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={`
        relative px-8 py-4 rounded-xl font-bold text-lg w-full sm:w-auto
        transition-all duration-300 ease-out
        hover:scale-105 hover:-translate-y-1
        active:scale-95
        ${isPrimary
          ? "text-white shadow-lg hover:shadow-xl"
          : "bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-slate-400 hover:text-white"
        }
      `}
      style={
        isPrimary
          ? {
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 10px 40px ${color}50`,
          }
          : undefined
      }
    >
      {isPrimary && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
        </div>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}


/**
 * Composant principal VictoryScreen - DYNAMIQUE
 */
export default function VictoryScreen({
  winner,
  victoryType,
  onPlayAgain,
  onBackToLobby,
  turnNumber = 0,
  winnerPieceCount = 0,
  loserPieceCount = 0,
  winnerEloChange = 0,
  isLocalPlayerWinner = true, // Default to true for backward compatibility
  winnerName = "Joueur",
  winnerAvatar = "",
  reason = "",
}: VictoryScreenProps & { isLocalPlayerWinner?: boolean; winnerName?: string; winnerAvatar?: string; reason?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const playerConfig = PLAYER_CONFIG[winner];
  // Config for local player state (Victory vs Defeat)
  const titleText = isLocalPlayerWinner ? "VICTOIRE !" : "DÉFAITE...";
  const titleColor = isLocalPlayerWinner ? playerConfig.color : "#ef4444"; // Red for defeat
  const scoreText = `${winnerPieceCount} - ${loserPieceCount}`;

  const victoryConfig = VICTORY_CONFIG[victoryType];

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 500); // Delayed start for overlay effect
    const timer2 = setTimeout(() => setShowContent(true), 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (isMinimized) {
    return (
      <div className="absolute top-20 right-4 z-50 animate-in fade-in slide-in-from-top-10 flex flex-col gap-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-slate-900/90 backdrop-blur border border-white/20 text-white px-6 py-3 rounded-xl font-bold font-cyber shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <span>🏆</span>
          <span>RÉSULTATS</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          50% { opacity: 0.1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-10deg); }
        }
        @keyframes title-glow {
          0%, 100% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor; }
          50% { text-shadow: 0 0 40px currentColor, 0 0 80px currentColor, 0 0 100px currentColor; }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .confetti-piece { animation: confetti-fall linear infinite; }
        .animate-ping-slow { animation: ping-slow ease-out infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 3s ease-in-out infinite; animation-delay: 1s; }
        .animate-title-glow { animation: title-glow 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-slide-up-delayed-1 { animation: slide-up 0.6s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
        .animate-slide-up-delayed-2 { animation: slide-up 0.6s ease-out forwards; animation-delay: 0.4s; opacity: 0; }
        .animate-slide-up-delayed-3 { animation: slide-up 0.6s ease-out forwards; animation-delay: 0.6s; opacity: 0; }
      `}</style>

      {/* OVERLAY WRAPPER with pointer-events-none by default, content auto */}
      <div
        className={`absolute inset-0 z-[100] flex items-center justify-center transition-all duration-1000 ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{
          background: isLocalPlayerWinner
            ? `radial-gradient(circle at center, ${playerConfig.bgGlow} 0%, rgba(15, 23, 42, 0.9) 80%)`
            : `radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.95) 80%)`,
          backdropFilter: "blur(4px)",
        }}
      >
        {isLocalPlayerWinner && <GlowingRings color={playerConfig.color} />}
        {isLocalPlayerWinner && <SparkleStars color={playerConfig.colorLight} />}
        {isLocalPlayerWinner && <ConfettiSystem winnerColor={playerConfig.color} />}

        {showContent && (
          <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col md:flex-row items-stretch justify-center gap-8 h-[85vh]">

            {/* LEFT PANEL: RESULTS & BUTTONS */}
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">

              {/* Trophée or Skull */}
              <div className="mb-6">
                {isLocalPlayerWinner ? (
                  <AnimatedTrophy color={playerConfig.color} />
                ) : (
                  <div className="text-8xl animate-bounce-slow grayscale transition-all duration-1000 hover:grayscale-0">💀</div>
                )}
              </div>

              {/* Titre */}
              <h1
                className="text-5xl md:text-7xl font-black mb-2 animate-title-glow"
                style={{ color: titleColor }}
              >
                {titleText}
              </h1>

              <div className="mb-6">
                <div className="flex items-center justify-center gap-4">
                  {winnerAvatar && (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-amber-400 overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                      <img src={CHARACTER_IMAGES[winnerAvatar]} className="w-full h-full object-cover" alt="winner avatar" />
                    </div>
                  )}
                  <p className="font-cyber text-lg md:text-xl text-white tracking-widest uppercase">
                    <span style={{ color: playerConfig.color }}>{winnerName}</span> a gagné <span className="font-mono font-bold text-amber-400">{scoreText}</span>
                  </p>
                </div>
              </div>

              {/* Raison */}
              <div className="mb-8 w-full max-w-md">
                <div
                  className="flex items-center gap-4 px-6 py-3 rounded-2xl border-2 w-full"
                  style={{
                    backgroundColor: `${playerConfig.color}15`,
                    borderColor: `${playerConfig.color}40`,
                  }}
                >
                  <span className="text-3xl">{victoryConfig.icon}</span>
                  <div className="text-left">
                    <p className="text-white font-bold text-lg leading-tight">
                      {reason || victoryConfig.label}
                    </p>
                    <p className="text-slate-300 text-xs">
                      {victoryConfig.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-8 w-full max-w-lg bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="font-bold text-lg">{turnNumber}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Tours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⚔️</div>
                  <div className="font-bold text-lg text-green-400">{winnerPieceCount}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Gagnant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">💀</div>
                  <div className="font-bold text-lg text-red-400">{loserPieceCount}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Perdant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">📈</div>
                  <div className="font-bold text-lg text-blue-400">{(winnerEloChange ?? 0) >= 0 ? `+${winnerEloChange}` : winnerEloChange}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Elo</div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                <StyledButton
                  variant="primary"
                  color={playerConfig.color}
                  onClick={onPlayAgain}
                >
                  🔄 Rejouer
                </StyledButton>

                <StyledButton variant="secondary" onClick={() => setIsMinimized(true)}>
                  👁️ Plateau
                </StyledButton>
                <StyledButton variant="secondary" onClick={onBackToLobby}>
                  🏠 Accueil
                </StyledButton>
              </div>
            </div>


          </div>
        )}
      </div>
    </>
  );
}
