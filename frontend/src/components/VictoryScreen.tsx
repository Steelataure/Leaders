import { useEffect, useState } from "react";
import RankBadge from "./RankBadge";

/**
 * Composant VictoryScreen - Écran de victoire DYNAMIQUE
 * S'affiche quand un leader est capturé ou encerclé
 * Jeu "Leaders" - Hackathon ESIEA
 */

// === TYPES ===

type VictoryType = "CAPTURE" | "ENCIRCLEMENT" | "TIMEOUT";

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
        relative px-8 py-4 rounded-xl font-bold text-lg
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
 * 🆕 Carte de statistique
 */
function StatCard({
  value,
  label,
  icon,
}: {
  value: number | string;
  label: string;
  icon: string;
}) {
  return (
    <div className="text-center px-4">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
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
  winnerElo = 0,
}: VictoryScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const playerConfig = PLAYER_CONFIG[winner];
  const victoryConfig = VICTORY_CONFIG[victoryType];

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={{
          background: `radial-gradient(circle at center, ${playerConfig.bgGlow} 0%, rgba(15, 23, 42, 0.98) 70%)`,
          backdropFilter: "blur(8px)",
        }}
      >
        <GlowingRings color={playerConfig.color} />
        <SparkleStars color={playerConfig.colorLight} />
        <ConfettiSystem winnerColor={playerConfig.color} />

        {showContent && (
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
            {/* Trophée */}
            <div className="mb-6 animate-slide-up">
              <AnimatedTrophy color={playerConfig.color} />
            </div>

            {/* Titre VICTOIRE */}
            <h1
              className="text-6xl md:text-8xl font-black mb-4 animate-slide-up-delayed-1 animate-title-glow"
              style={{ color: playerConfig.color }}
            >
              VICTOIRE !
            </h1>

            {/* Nom du gagnant */}
            <div className="animate-slide-up-delayed-1">
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl">{playerConfig.emoji}</span>
                  <h2
                    className={`text-3xl md:text-5xl font-black bg-gradient-to-r ${playerConfig.gradient} bg-clip-text text-transparent uppercase tracking-wider italic`}
                  >
                    {playerConfig.name}
                  </h2>
                  <span className="text-4xl">{playerConfig.emoji}</span>
                </div>
                {winnerElo !== undefined && (
                  <div className="mt-2 scale-125">
                    <RankBadge elo={winnerElo} size="md" />
                  </div>
                )}
              </div>
            </div>

            {/* 🆕 Type de victoire AMÉLIORÉ */}
            <div className="animate-slide-up-delayed-2 mb-8">
              <div
                className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl border-2"
                style={{
                  backgroundColor: `${playerConfig.color}15`,
                  borderColor: `${playerConfig.color}40`,
                }}
              >
                <span className="text-4xl">{victoryConfig.icon}</span>
                <div className="text-left">
                  <p className="text-white font-bold text-xl">
                    {victoryConfig.label}
                  </p>
                  <p className="text-slate-300 text-sm">
                    {victoryConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 🆕 Stats DYNAMIQUES */}
            <div className="animate-slide-up-delayed-2 flex gap-4 mb-10 bg-slate-900/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-700/50">
              <StatCard value={turnNumber} label="Tours joués" icon="🎯" />
              <div className="w-px bg-slate-700" />
              <StatCard
                value={winnerPieceCount}
                label="Unités gagnant"
                icon="⚔️"
              />
              <div className="w-px bg-slate-700" />
              <StatCard
                value={loserPieceCount}
                label="Unités perdant"
                icon="💀"
              />
            </div>

            {/* Boutons */}
            <div className="animate-slide-up-delayed-3 flex flex-col sm:flex-row gap-4">
              <StyledButton
                variant="primary"
                color={playerConfig.color}
                onClick={onPlayAgain}
              >
                🔄 Rejouer
              </StyledButton>
              <StyledButton variant="secondary" onClick={onBackToLobby}>
                🏠 Retour au lobby
              </StyledButton>
            </div>

            {/* Message fun */}
            <p className="mt-8 text-slate-500 text-sm animate-slide-up-delayed-3">
              « Tactique, audace et stratégie distingueront les véritables
              Leaders ! »
            </p>
          </div>
        )}
      </div>
    </>
  );
}
