import { useMemo, useState } from "react";
import {
  generateBoard,
  getHexagonPoints,
  type HexCell,
  HEX_SIZE,
  CellType,
  areAdjacent,
} from "../utils/hexCoords";

/**
 * Composant HexBoard - Plateau de jeu hexagonal pour "Leaders"
 * Version améliorée avec animations et visuels stylisés
 */

// === TYPES ===

interface Piece {
  id: string;
  characterId: string;
  ownerIndex: number; // 0 = bleu (J1), 1 = rouge (J2)
  q: number;
  r: number;
  hasActed?: boolean; // A déjà effectué une action ce tour
}

type GamePhase = "ACTIONS" | "RECRUITMENT";

// === DONNÉES MOCKÉES ===

const MOCKED_PIECES: Piece[] = [
  {
    id: "piece-1",
    characterId: "LEADER",
    ownerIndex: 0,
    q: 0,
    r: 2,
    hasActed: false,
  },
  {
    id: "piece-2",
    characterId: "LEADER",
    ownerIndex: 1,
    q: 0,
    r: -2,
    hasActed: false,
  },
  {
    id: "piece-3",
    characterId: "ARCHER",
    ownerIndex: 0,
    q: 1,
    r: 1,
    hasActed: true,
  },
  {
    id: "piece-4",
    characterId: "CAVALIER",
    ownerIndex: 1,
    q: -1,
    r: -1,
    hasActed: false,
  },
];

// === CONSTANTES DE STYLE ===

const COLORS = {
  // Joueurs
  player1: "#3b82f6", // Bleu
  player1Glow: "#60a5fa",
  player2: "#ef4444", // Rouge
  player2Glow: "#f87171",

  // Cellules
  cellFill: "#1e293b",
  cellStroke: "#475569",
  cellHover: "#334155",

  // Cases spéciales
  leaderSpawnP1: "#1d4ed8",
  leaderSpawnP2: "#b91c1c",
  recruitment: "#d97706",
  center: "#6366f1",

  // États
  validMove: "#22c55e",
  selected: "#fbbf24",
};

// Dimensions du SVG
const SVG_WIDTH = 580;
const SVG_HEIGHT = 520;

// === COMPOSANTS ===

/**
 * Icône couronne pour les Leaders (SVG inline)
 */
function CrownIcon({ color }: { color: string }) {
  return (
    <g transform="translate(-12, -10) scale(0.8)">
      <path
        d="M3 18L6 8L12 12L18 4L24 8L27 18H3Z"
        fill={color}
        stroke="#fff"
        strokeWidth="1.5"
      />
      <circle cx="6" cy="6" r="2" fill={color} stroke="#fff" strokeWidth="1" />
      <circle cx="15" cy="2" r="2" fill={color} stroke="#fff" strokeWidth="1" />
      <circle cx="24" cy="4" r="2" fill={color} stroke="#fff" strokeWidth="1" />
    </g>
  );
}

/**
 * Composant pour afficher une pièce sur le plateau
 */
interface PieceComponentProps {
  piece: Piece;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: (piece: Piece) => void;
}

function PieceComponent({
  piece,
  x,
  y,
  isSelected,
  onSelect,
}: PieceComponentProps) {
  const isLeader = piece.characterId === "LEADER";
  const color = piece.ownerIndex === 0 ? COLORS.player1 : COLORS.player2;
  const glowColor =
    piece.ownerIndex === 0 ? COLORS.player1Glow : COLORS.player2Glow;

  // Rayon de la pièce
  const radius = isLeader ? HEX_SIZE * 0.45 : HEX_SIZE * 0.38;

  // ID unique pour le filtre de glow
  const glowId = `glow-${piece.id}`;
  const pulseId = `pulse-${piece.id}`;

  return (
    <g
      onClick={() => onSelect(piece)}
      style={{ cursor: "pointer" }}
      opacity={piece.hasActed ? 0.6 : 1}
    >
      {/* Définition du filtre glow */}
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cercle de sélection animé */}
      {isSelected && (
        <>
          <circle
            cx={x}
            cy={y}
            r={radius + 8}
            fill="none"
            stroke={COLORS.selected}
            strokeWidth="3"
            opacity="0.8"
          >
            <animate
              attributeName="r"
              values={`${radius + 6};${radius + 12};${radius + 6}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0.4;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      {/* Ombre portée */}
      <ellipse
        cx={x + 2}
        cy={y + 4}
        rx={radius * 0.9}
        ry={radius * 0.4}
        fill="rgba(0,0,0,0.3)"
      />

      {/* Cercle principal avec glow */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={`url(#gradient-${piece.ownerIndex})`}
        stroke="#fff"
        strokeWidth={isLeader ? 3 : 2}
        filter={`url(#${glowId})`}
      />

      {/* Gradient pour effet 3D */}
      <defs>
        <radialGradient id={`gradient-${piece.ownerIndex}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>

      {/* Icône ou lettre */}
      {isLeader ? (
        <g transform={`translate(${x}, ${y})`}>
          <CrownIcon color="#fff" />
        </g>
      ) : (
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fill="#fff"
          fontSize="14"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {piece.characterId.charAt(0)}
        </text>
      )}

      {/* Badge "a agi" */}
      {piece.hasActed && (
        <g transform={`translate(${x + radius - 4}, ${y - radius + 4})`}>
          <circle r="8" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
          <text
            y="4"
            textAnchor="middle"
            fill="#fff"
            fontSize="10"
            fontWeight="bold"
          >
            ✓
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Composant pour une cellule hexagonale
 */
interface HexCellComponentProps {
  cell: HexCell;
  isValidMove: boolean;
  isHovered: boolean;
  onHover: (cell: HexCell | null) => void;
  onClick: (cell: HexCell) => void;
}

function HexCellComponent({
  cell,
  isValidMove,
  isHovered,
  onHover,
  onClick,
}: HexCellComponentProps) {
  // Points de l'hexagone (légèrement réduit pour l'espacement)
  const hexPoints = getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.92);

  // Couleurs selon le type de cellule
  const getCellColors = () => {
    if (isValidMove) {
      return {
        fill: "rgba(34, 197, 94, 0.3)",
        stroke: COLORS.validMove,
        strokeWidth: 3,
      };
    }

    switch (cell.type) {
      case CellType.LEADER_SPAWN_P1:
        return { fill: "#1e3a5f", stroke: COLORS.player1, strokeWidth: 3 };
      case CellType.LEADER_SPAWN_P2:
        return { fill: "#3f1e1e", stroke: COLORS.player2, strokeWidth: 3 };
      case CellType.RECRUITMENT_P1:
        return { fill: "#2d2006", stroke: COLORS.recruitment, strokeWidth: 2 };
      case CellType.RECRUITMENT_P2:
        return { fill: "#2d2006", stroke: COLORS.recruitment, strokeWidth: 2 };
      case CellType.CENTER:
        return { fill: "#1e1b4b", stroke: COLORS.center, strokeWidth: 2 };
      default:
        return {
          fill: isHovered ? COLORS.cellHover : COLORS.cellFill,
          stroke: COLORS.cellStroke,
          strokeWidth: 1.5,
        };
    }
  };

  const colors = getCellColors();

  return (
    <g
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(cell)}
      style={{ cursor: "pointer" }}
    >
      {/* Hexagone principal */}
      <polygon
        points={hexPoints}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
        style={{
          transition: "all 0.2s ease",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
          transformOrigin: `${cell.x}px ${cell.y}px`,
        }}
      />

      {/* Indicateur case spéciale */}
      {cell.type === CellType.RECRUITMENT_P1 ||
      cell.type === CellType.RECRUITMENT_P2 ? (
        <circle
          cx={cell.x}
          cy={cell.y}
          r={6}
          fill="none"
          stroke={COLORS.recruitment}
          strokeWidth="2"
          strokeDasharray="3,3"
          opacity="0.7"
        />
      ) : null}

      {/* Point central pour case de départ */}
      {(cell.type === CellType.LEADER_SPAWN_P1 ||
        cell.type === CellType.LEADER_SPAWN_P2) && (
        <circle
          cx={cell.x}
          cy={cell.y}
          r={4}
          fill={
            cell.type === CellType.LEADER_SPAWN_P1
              ? COLORS.player1
              : COLORS.player2
          }
        >
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

/**
 * Header du jeu avec infos de tour
 */
interface GameHeaderProps {
  currentPlayer: number;
  phase: GamePhase;
  turnNumber: number;
}

function GameHeader({ currentPlayer, phase, turnNumber }: GameHeaderProps) {
  const playerColor = currentPlayer === 0 ? COLORS.player1 : COLORS.player2;
  const playerName = currentPlayer === 0 ? "Joueur 1" : "Joueur 2";

  return (
    <div className="flex items-center justify-between mb-4 px-4">
      {/* Logo / Titre */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚔️</span>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
          LEADERS
        </h1>
      </div>

      {/* Info du tour */}
      <div className="flex items-center gap-6">
        {/* Phase actuelle */}
        <div className="text-sm">
          <span className="text-gray-400">Phase : </span>
          <span className="text-white font-semibold">
            {phase === "ACTIONS" ? "⚡ Actions" : "📥 Recrutement"}
          </span>
        </div>

        {/* Numéro du tour */}
        <div className="text-sm">
          <span className="text-gray-400">Tour : </span>
          <span className="text-white font-semibold">{turnNumber}</span>
        </div>

        {/* Joueur actuel */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: `${playerColor}30`,
            border: `2px solid ${playerColor}`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: playerColor }}
          />
          <span className="text-white font-semibold">{playerName}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Légende du plateau
 */
function BoardLegend() {
  const items = [
    { color: COLORS.player1, label: "Joueur 1", icon: "🔵" },
    { color: COLORS.player2, label: "Joueur 2", icon: "🔴" },
    { color: COLORS.recruitment, label: "Recrutement", icon: "🟡" },
    { color: COLORS.validMove, label: "Déplacement valide", icon: "🟢" },
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <span>{item.icon}</span>
          <span className="text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Composant principal du plateau hexagonal
 */
export default function HexBoard() {
  // États du jeu
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);
  const [currentPlayer] = useState(0);
  const [phase] = useState<GamePhase>("ACTIONS");
  const [turnNumber] = useState(1);

  // Génération du plateau centré
  const cells = useMemo(() => {
    return generateBoard(SVG_WIDTH / 2, SVG_HEIGHT / 2);
  }, []);

  // Recherche d'une pièce sur une cellule
  const findPieceAtCell = (q: number, r: number): Piece | undefined => {
    return MOCKED_PIECES.find((p) => p.q === q && p.r === r);
  };

  // Calcul des cases de déplacement valides
  const validMoves = useMemo(() => {
    if (!selectedPiece) return new Set<string>();

    const moves = new Set<string>();
    cells.forEach((cell) => {
      // Case adjacente et vide
      if (
        areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) &&
        !findPieceAtCell(cell.q, cell.r)
      ) {
        moves.add(`${cell.q},${cell.r}`);
      }
    });

    return moves;
  }, [selectedPiece, cells]);

  // Gestion de la sélection d'une pièce
  const handlePieceSelect = (piece: Piece) => {
    if (piece.ownerIndex !== currentPlayer) {
      console.log(`❌ Ce n'est pas votre pièce !`);
      return;
    }

    if (selectedPiece?.id === piece.id) {
      setSelectedPiece(null);
      console.log(`🔄 Désélection de ${piece.characterId}`);
    } else {
      setSelectedPiece(piece);
      console.log(`✅ Selected piece: ${piece.id} (${piece.characterId})`);
    }
  };

  // Gestion du clic sur une cellule
  const handleCellClick = (cell: HexCell) => {
    if (selectedPiece && validMoves.has(`${cell.q},${cell.r}`)) {
      console.log(
        `🚀 Déplacement de ${selectedPiece.characterId} vers (${cell.q}, ${cell.r})`,
      );
      // Ici on ferait le déplacement réel
      setSelectedPiece(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <GameHeader
        currentPlayer={currentPlayer}
        phase={phase}
        turnNumber={turnNumber}
      />

      {/* Conteneur du plateau avec effet glassmorphism */}
      <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
        {/* SVG du plateau */}
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="drop-shadow-lg"
        >
          {/* Fond avec gradient subtil */}
          <defs>
            <radialGradient id="boardGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Cercle de fond */}
          <circle
            cx={SVG_WIDTH / 2}
            cy={SVG_HEIGHT / 2}
            r={220}
            fill="url(#boardGradient)"
          />

          {/* Rendu des cellules */}
          {cells.map((cell) => (
            <HexCellComponent
              key={`cell-${cell.q}-${cell.r}`}
              cell={cell}
              isValidMove={validMoves.has(`${cell.q},${cell.r}`)}
              isHovered={hoveredCell?.q === cell.q && hoveredCell?.r === cell.r}
              onHover={setHoveredCell}
              onClick={handleCellClick}
            />
          ))}

          {/* Rendu des pièces */}
          {MOCKED_PIECES.map((piece) => {
            const cell = cells.find((c) => c.q === piece.q && c.r === piece.r);
            if (!cell) return null;

            return (
              <PieceComponent
                key={piece.id}
                piece={piece}
                x={cell.x}
                y={cell.y}
                isSelected={selectedPiece?.id === piece.id}
                onSelect={handlePieceSelect}
              />
            );
          })}
        </svg>

        {/* Indicateur de pièce sélectionnée */}
        {selectedPiece && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-full">
            <span className="text-amber-300 text-sm font-medium">
              👆 {selectedPiece.characterId} sélectionné - Cliquez sur une case
              verte pour déplacer
            </span>
          </div>
        )}
      </div>

      {/* Légende */}
      <BoardLegend />

      {/* Info debug */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {hoveredCell && (
          <span>
            Case: ({hoveredCell.q}, {hoveredCell.r}) - Type: {hoveredCell.type}
          </span>
        )}
      </div>
    </div>
  );
}
