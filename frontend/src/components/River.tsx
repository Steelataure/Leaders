import { useState } from "react";

/**
 * Composant River - La rivière de cartes pour le recrutement
 * Affiche 3 cartes de personnages disponibles au recrutement
 * Jeu "Leaders" - Hackathon ESIEA
 */

// === TYPES ===

export type AbilityType = "ACTIVE" | "PASSIVE" | "SPECIAL";
export type GamePhase = "ACTIONS" | "RECRUITMENT";

export interface CharacterCard {
  id: string;
  characterId: string;
  name: string;
  description: string;
  type: AbilityType;
}

interface RiverProps {
  cards: CharacterCard[];
  phase: GamePhase;
  onRecruit: (cardId: string) => void;
}

// === DONNÉES MOCKÉES (pour test standalone) ===

const MOCK_CARDS: CharacterCard[] = [
  {
    id: "card-1",
    characterId: "ARCHER",
    name: "Archère",
    description: "Participe à la capture à 2 cases en ligne droite",
    type: "PASSIVE",
  },
  {
    id: "card-2",
    characterId: "COGNEUR",
    name: "Cogneur",
    description: "Pousse un ennemi adjacent vers l'opposé",
    type: "ACTIVE",
  },
  {
    id: "card-3",
    characterId: "RODEUR",
    name: "Rôdeuse",
    description: "Se déplace sur une case non-adjacente à un ennemi",
    type: "ACTIVE",
  },
];

// === CONSTANTES DE STYLE ===

const TYPE_STYLES: Record<
  AbilityType,
  { bg: string; border: string; text: string; label: string; icon: string }
> = {
  ACTIVE: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-400",
    label: "Active",
    icon: "⚡",
  },
  PASSIVE: {
    bg: "bg-violet-500/20",
    border: "border-violet-500/50",
    text: "text-violet-400",
    label: "Passive",
    icon: "🛡️",
  },
  SPECIAL: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    label: "Spéciale",
    icon: "✨",
  },
};

// Icônes personnalisées par personnage
const CHARACTER_ICONS: Record<string, { icon: string; color: string }> = {
  ARCHER: { icon: "🏹", color: "#f472b6" },
  COGNEUR: { icon: "🦬", color: "#fb923c" },
  RODEUR: { icon: "🦇", color: "#a78bfa" },
  CAVALIER: { icon: "🐎", color: "#fbbf24" },
  ACROBATE: { icon: "🤸", color: "#34d399" },
  ILLUSIONISTE: { icon: "🎭", color: "#818cf8" },
  LANCE_GRAPPIN: { icon: "🪝", color: "#f87171" },
  MANIPULATRICE: { icon: "🕸️", color: "#c084fc" },
  TAVERNIER: { icon: "🍺", color: "#fcd34d" },
  GEOLIER: { icon: "⛓️", color: "#94a3b8" },
  PROTECTEUR: { icon: "🛡️", color: "#60a5fa" },
  ASSASSIN: { icon: "🗡️", color: "#ef4444" },
  GARDE_ROYAL: { icon: "👑", color: "#fbbf24" },
  VIZIR: { icon: "📜", color: "#a855f7" },
  NEMESIS: { icon: "👁️", color: "#ec4899" },
  VIEIL_OURS: { icon: "🐻", color: "#92400e" },
  DEFAULT: { icon: "⚔️", color: "#64748b" },
};

// === COMPOSANTS ===

/**
 * Badge du type de compétence
 */
function TypeBadge({ type }: { type: AbilityType }) {
  const style = TYPE_STYLES[type];

  return (
    <span
      className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${style.bg} ${style.border} ${style.text} border
    `}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  );
}

/**
 * Carte de personnage individuelle
 */
interface CardProps {
  card: CharacterCard;
  isDisabled: boolean;
  isLeaving: boolean;
  isEntering: boolean;
  onClick: () => void;
}

function Card({ card, isDisabled, isLeaving, isEntering, onClick }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Récupération de l'icône du personnage
  const charIcon = CHARACTER_ICONS[card.characterId] || CHARACTER_ICONS.DEFAULT;
  const typeStyle = TYPE_STYLES[card.type];

  // Classes d'animation
  const animationClasses = isLeaving
    ? "animate-card-leave"
    : isEntering
      ? "animate-card-enter"
      : "";

  return (
    <div
      onClick={() => !isDisabled && onClick()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group
        w-48 h-72
        rounded-xl
        transition-all duration-300 ease-out
        ${animationClasses}
        ${
          isDisabled
            ? "cursor-not-allowed opacity-50 grayscale"
            : "cursor-pointer hover:scale-105 hover:-translate-y-2"
        }
      `}
      style={{
        transform:
          isHovered && !isDisabled ? "scale(1.05) translateY(-8px)" : undefined,
      }}
    >
      {/* Glow effect au hover */}
      {!isDisabled && (
        <div
          className={`
            absolute inset-0 rounded-xl blur-xl transition-opacity duration-300
            ${isHovered ? "opacity-60" : "opacity-0"}
          `}
          style={{ backgroundColor: charIcon.color }}
        />
      )}

      {/* Carte principale */}
      <div
        className={`
        relative h-full
        bg-gradient-to-b from-slate-800 to-slate-900
        border-2 rounded-xl overflow-hidden
        transition-all duration-300
        ${
          isDisabled
            ? "border-slate-700"
            : isHovered
              ? "border-white/50 shadow-lg"
              : "border-slate-600 hover:border-slate-400"
        }
      `}
        style={{
          borderColor: isHovered && !isDisabled ? charIcon.color : undefined,
          boxShadow:
            isHovered && !isDisabled
              ? `0 0 30px ${charIcon.color}40`
              : undefined,
        }}
      >
        {/* Header avec type */}
        <div className="absolute top-3 right-3 z-10">
          <TypeBadge type={card.type} />
        </div>

        {/* Zone icône principale */}
        <div className="h-32 flex items-center justify-center relative overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at center, ${charIcon.color}40 0%, transparent 70%)`,
            }}
          />

          {/* Cercle décoratif */}
          <div
            className="absolute w-24 h-24 rounded-full opacity-20 border-2"
            style={{ borderColor: charIcon.color }}
          />

          {/* Icône principale */}
          <span className="text-6xl relative z-10 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
            {charIcon.icon}
          </span>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-4" />

        {/* Contenu */}
        <div className="p-4 flex flex-col h-[calc(100%-128px-1px)]">
          {/* Nom du personnage */}
          <h3
            className="text-lg font-bold mb-2 transition-colors"
            style={{
              color: isHovered && !isDisabled ? charIcon.color : "#f1f5f9",
            }}
          >
            {card.name}
          </h3>

          {/* Lettre indicateur */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-slate-700"
              style={{ color: charIcon.color }}
            >
              {card.characterId.charAt(0)}
            </span>
            <span className="text-slate-500 text-xs uppercase tracking-wider">
              {card.characterId.replace("_", " ")}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed flex-grow">
            {card.description}
          </p>

          {/* Bouton recruter (visible au hover) */}
          {!isDisabled && (
            <div
              className={`
              mt-3 py-2 rounded-lg text-center text-sm font-semibold
              transition-all duration-300
              ${isHovered ? "bg-white/10 text-white opacity-100" : "opacity-0"}
            `}
              style={{
                backgroundColor: isHovered ? `${charIcon.color}30` : undefined,
                color: isHovered ? charIcon.color : undefined,
              }}
            >
              ✨ Recruter
            </div>
          )}
        </div>

        {/* Indicateur désactivé */}
        {isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl">
            <div className="text-center">
              <span className="text-3xl">🔒</span>
              <p className="text-slate-400 text-xs mt-2">Phase Actions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Indicateur de pioche
 */
function DeckIndicator({ remaining }: { remaining: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Stack de cartes */}
      <div className="relative w-16 h-24">
        {[...Array(Math.min(3, remaining))].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border border-slate-600"
            style={{
              top: i * -3,
              left: i * 2,
              zIndex: 3 - i,
            }}
          >
            {i === 0 && (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl opacity-50">🎴</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compteur */}
      <span className="text-slate-400 text-sm">{remaining} restantes</span>
    </div>
  );
}

/**
 * Composant principal River
 */
export default function River({
  cards = MOCK_CARDS,
  phase = "RECRUITMENT",
  onRecruit = (id) => console.log(`Recruited: ${id}`),
}: Partial<RiverProps>) {
  const [leavingCardId, setLeavingCardId] = useState<string | null>(null);
  const [enteringCardId, setEnteringCardId] = useState<string | null>(null);

  const isDisabled = phase !== "RECRUITMENT";

  // Gestion du clic sur une carte
  const handleCardClick = (cardId: string) => {
    if (isDisabled) return;

    // Animation de sortie
    setLeavingCardId(cardId);

    // Après l'animation, déclencher le recrutement
    setTimeout(() => {
      onRecruit(cardId);
      setLeavingCardId(null);

      // Animation d'entrée pour la nouvelle carte
      // (simulé ici - en vrai ce serait la nouvelle carte)
      setEnteringCardId(cardId);
      setTimeout(() => setEnteringCardId(null), 500);
    }, 300);
  };

  return (
    <div className="w-full">
      {/* Styles d'animation */}
      <style>{`
        @keyframes cardLeave {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-30px);
          }
        }
        
        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-card-leave {
          animation: cardLeave 0.3s ease-out forwards;
        }
        
        .animate-card-enter {
          animation: cardEnter 0.5s ease-out forwards;
        }
      `}</style>

      {/* Container principal */}
      <div className="relative p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h2 className="text-lg font-bold text-white">La Rivière</h2>
              <p className="text-slate-400 text-sm">
                {isDisabled
                  ? "Terminez vos actions pour recruter"
                  : "Choisissez un personnage à recruter"}
              </p>
            </div>
          </div>

          {/* Indicateur de phase */}
          <div
            className={`
            px-4 py-2 rounded-full text-sm font-semibold
            ${
              isDisabled
                ? "bg-slate-700 text-slate-400"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }
          `}
          >
            {isDisabled ? "⏳ Phase Actions" : "✅ Recrutement ouvert"}
          </div>
        </div>

        {/* Cartes + Pioche */}
        <div className="flex items-center justify-center gap-6">
          {/* Les 3 cartes */}
          <div className="flex gap-5">
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isDisabled={isDisabled}
                isLeaving={leavingCardId === card.id}
                isEntering={enteringCardId === card.id}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>

          {/* Séparateur vertical */}
          <div className="h-48 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

          {/* Pioche */}
          <DeckIndicator remaining={14} />
        </div>

        {/* Hint en bas */}
        {!isDisabled && (
          <div className="mt-6 text-center">
            <span className="text-slate-500 text-sm">
              💡 Survolez une carte pour voir les détails, cliquez pour recruter
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
