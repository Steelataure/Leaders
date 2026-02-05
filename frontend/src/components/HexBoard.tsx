import { useMemo, useState } from "react";
import {
  generateBoard,
  getHexagonPoints,
  type HexCell,
  HEX_SIZE,
  areAdjacent,
} from "../utils/hexCoords";

// @ts-ignore
import useSound from 'use-sound';
import boardPlacementSfx from '../sounds/boardPlacement.mp3';
import pawnSelectSfx from '../sounds/pawnSelect.mp3';

// === TYPES ===
export interface Piece {
  id: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActed: boolean;
}

export type GamePhase = "ACTIONS" | "RECRUITMENT";

interface HexBoardProps {
  pieces: Piece[];
  currentPlayer: number;
  phase: GamePhase;
  turnNumber: number;
  onMove: (pieceId: string, toQ: number, toR: number) => void;
  // New props for lifted state
  selectedPiece: Piece | null;
  onSelectPiece: (piece: Piece | null) => void;
}

// === CONSTANTES DE STYLE ===
const COLORS = {
  player1: "#00f5ff",     // Cyan neon
  player1Glow: "#00f5ff",
  player2: "#ef4444",     // Red/Pink neon
  player2Glow: "#f87171",
  cellFill: "#0f1a2a",    // Dark blue
  cellStroke: "#1e4a5a",  // Cyan dim
  cellHover: "#1e3a4a",
  validMove: "#00f5ff",
  selected: "#fbbf24",    // Amber
};

const SVG_WIDTH = 700;
const SVG_HEIGHT = 600;

// === SOUS-COMPOSANTS ===

// Mapping des characterId vers les fichiers images
const CHARACTER_IMAGES: Record<string, string> = {
  COGNEUR: "/image/cogneur.png",
  RODEUR: "/image/rodeuse.png",
  RODEUSE: "/image/rodeuse.png",
  ILLUSIONISTE: "/image/illusioniste.png",
  MANIPULATRICE: "/image/manipulatrice.png",
  TAVERNIER: "/image/tavernier.png",
  GARDE: "/image/garderoyal.png",
  ARCHER: "/image/archere.png",
  ARCHERE: "/image/archere.png",
  CAVALIER: "/image/cavalier.png",
  LEADER: "/image/vizir.png",
  ASSASSIN: "/image/assassin.png",
  ACROBATE: "/image/acrobate.png",
  GEOLIER: "/image/geolier.png",
  PROTECTEUR: "/image/protecteur.png",
  NEMESIS: "/image/nemesis.png",
  VIEILOURS: "/image/vieilours&ourson.png",
};

function CrownIcon({ color }: { color: string }) {
  return (
    <g transform="translate(-12, -10) scale(0.8)">
      <path d="M3 18L6 8L12 12L18 4L24 8L27 18H3Z" fill={color} stroke="#fff" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="2" fill={color} stroke="#fff" strokeWidth="1" />
      <circle cx="15" cy="2" r="2" fill={color} stroke="#fff" strokeWidth="1" />
      <circle cx="24" cy="4" r="2" fill={color} stroke="#fff" strokeWidth="1" />
    </g>
  );
}

function PieceComponent({ piece, x, y, isSelected, onSelect }: any) {
  const isLeader = piece.characterId === "LEADER";
  const color = piece.ownerIndex === 0 ? COLORS.player1 : COLORS.player2;
  const radius = HEX_SIZE * 0.55;
  const glowId = `glow-${piece.id}`;
  const clipId = `clip-${piece.id}`;
  const imageUrl = CHARACTER_IMAGES[piece.characterId] || "/image/vizir.png";

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(piece); }} style={{ cursor: "pointer" }} opacity={piece.hasActed ? 0.6 : 1}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Masque circulaire pour l'image */}
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={radius - 3} />
        </clipPath>
      </defs>

      {/* Selection Ring */}
      {isSelected && (
        <circle cx={x} cy={y} r={radius + 8} fill="none" stroke={COLORS.selected} strokeWidth="2">
          <animate attributeName="r" values={`${radius + 6};${radius + 10};${radius + 6}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Cercle de fond avec couleur du joueur */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="#1a1a2e"
        stroke={color}
        strokeWidth={isLeader ? 4 : 3}
        filter={`url(#${glowId})`}
      />

      {/* Image du personnage */}
      <image
        href={imageUrl}
        x={x - radius + 3}
        y={y - radius + 3}
        width={(radius - 3) * 2}
        height={(radius - 3) * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Couronne pour le Leader */}
      {isLeader && (
        <g transform={`translate(${x}, ${y - radius - 8})`}>
          <CrownIcon color={color} />
        </g>
      )}

      {/* Acted Status */}
      {piece.hasActed && (
        <g transform={`translate(${x + radius - 5}, ${y - radius + 5})`}>
          <circle r="8" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
          <text y="3.5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">✓</text>
        </g>
      )}
    </g>
  );
}

// === COMPOSANT PRINCIPAL ===

export default function HexBoard({
  pieces,
  currentPlayer,
  phase,
  selectedPiece,
  onSelectPiece,
  onMove,
}: HexBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);

  // Sons
  const [playBoardPlacementSfx] = useSound(boardPlacementSfx);
  const [playPawnSelectSfx] = useSound(pawnSelectSfx);

  // Generate board centered
  const cells = useMemo(() => generateBoard(SVG_WIDTH / 2, SVG_HEIGHT / 2), []);

  const findPieceAtCell = (q: number, r: number) => pieces.find((p) => p.q === q && p.r === r);

  const validMoves = useMemo(() => {
    // On ne peut bouger qu'en phase ACTIONS et avec une pièce qui n'a pas encore agi
    if (!selectedPiece || selectedPiece.hasActed || phase !== "ACTIONS")
      return new Set<string>();

    const moves = new Set<string>();
    cells.forEach((cell) => {
      // Logic: Adjacent + Empty
      if (areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) && !findPieceAtCell(cell.q, cell.r)) {
        moves.add(`${cell.q},${cell.r}`);
      }
    });
    return moves;
  }, [selectedPiece, pieces, phase, cells]);

  const handlePieceSelect = (piece: Piece) => {
    // Interdit de sélectionner une pièce adverse ou si on est en phase recrutement
    if (piece.ownerIndex !== currentPlayer || phase !== "ACTIONS") return;

    // Si on sélectionne une nouvelle pièce (différente de null et différente de l'actuelle)
    if (piece && selectedPiece?.id !== piece.id) {
      playPawnSelectSfx();
    }

    onSelectPiece(selectedPiece?.id === piece.id ? null : piece);
  };

  const handleCellClick = (cell: HexCell) => {
    if (selectedPiece && validMoves.has(`${cell.q},${cell.r}`)) {
      playBoardPlacementSfx();
      onMove(selectedPiece.id, cell.q, cell.r);
      onSelectPiece(null);
    } else {
      // Deselect if clicking on empty cell not in valid moves
      onSelectPiece(null);
    }
  };

  return (
    <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="drop-shadow-2xl overflow-visible">
      {/* Defs pour les effets de brillance */}
      <defs>
        <filter id="glow-player1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-player2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hexagons */}
      {cells.map((cell) => {
        const isValid = validMoves.has(`${cell.q},${cell.r}`);
        const isHovered = hoveredCell?.q === cell.q && hoveredCell?.r === cell.r;

        // Vérifier si cette cellule contient une pièce du joueur actif
        const pieceOnCell = findPieceAtCell(cell.q, cell.r);
        const isCurrentPlayerPiece = pieceOnCell && pieceOnCell.ownerIndex === currentPlayer;
        const canAct = isCurrentPlayerPiece && !pieceOnCell.hasActed && phase === "ACTIONS";

        // Couleurs de surbrillance selon le joueur
        const playerHighlightColor = currentPlayer === 0 ? COLORS.player1 : COLORS.player2;
        const playerHighlightFill = currentPlayer === 0 ? "rgba(0, 245, 255, 0.1)" : "rgba(239, 68, 68, 0.1)";

        return (
          <polygon
            key={`${cell.q}-${cell.r}`}
            points={getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.93)}
            fill={
              isValid ? "rgba(0, 245, 255, 0.15)" :
                canAct ? playerHighlightFill :
                  isHovered ? COLORS.cellHover : COLORS.cellFill
            }
            stroke={
              isValid ? COLORS.validMove :
                canAct ? playerHighlightColor :
                  isHovered ? "#00f5ff" : COLORS.cellStroke
            }
            strokeWidth={isValid ? 2 : canAct ? 2.5 : 1}
            filter={canAct ? `url(#glow-player${currentPlayer + 1})` : undefined}
            onMouseEnter={() => setHoveredCell(cell)}
            onMouseLeave={() => setHoveredCell(null)}
            onClick={() => handleCellClick(cell)}
            className="transition-colors duration-200 cursor-pointer"
          />
        );
      })}

      {/* Pieces */}
      {pieces.map((piece) => {
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
  );
}
