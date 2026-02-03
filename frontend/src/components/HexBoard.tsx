import { useMemo, useState } from "react";
import {
  generateBoard,
  getHexagonPoints,
  type HexCell,
  HEX_SIZE,
  CellType,
  areAdjacent,
} from "../utils/hexCoords";

import useSound from 'use-sound';
import boardPlacementSfx from '../sounds/boardPlacement.mp3';
import pawnSelectSfx from '../sounds/pawnSelect.mp3';

// === TYPES ===
interface Piece {
  id: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActed: boolean;
}

type GamePhase = "ACTIONS" | "RECRUITMENT";

interface HexBoardProps {
  pieces: Piece[];
  currentPlayer: number;
  phase: GamePhase;
  turnNumber: number;
  onMove: (pieceId: string, toQ: number, toR: number) => void;
}

// === CONSTANTES DE STYLE ===
const COLORS = {
  player1: "#3b82f6",
  player1Glow: "#60a5fa",
  player2: "#ef4444",
  player2Glow: "#f87171",
  cellFill: "#1e293b",
  cellStroke: "#475569",
  cellHover: "#334155",
  recruitment: "#d97706",
  center: "#6366f1",
  validMove: "#22c55e",
  selected: "#fbbf24",
};

const SVG_WIDTH = 580;
const SVG_HEIGHT = 520;

// === SOUS-COMPOSANTS INTERNES ===

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

function PieceComponent({ piece, x, y, isSelected, onSelect }: any) {
  const isLeader = piece.characterId === "LEADER";
  const color = piece.ownerIndex === 0 ? COLORS.player1 : COLORS.player2;
  const glowColor =
    piece.ownerIndex === 0 ? COLORS.player1Glow : COLORS.player2Glow;
  const radius = isLeader ? HEX_SIZE * 0.45 : HEX_SIZE * 0.38;
  const glowId = `glow-${piece.id}`;

  return (
    <g
      onClick={() => onSelect(piece)}
      style={{ cursor: "pointer" }}
      opacity={piece.hasActed ? 0.6 : 1}
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`grad-${piece.id}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>

      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={radius + 10}
          fill="none"
          stroke={COLORS.selected}
          strokeWidth="3"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values={`${radius + 8};${radius + 14};${radius + 8}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={`url(#grad-${piece.id})`}
        stroke="#fff"
        strokeWidth={isLeader ? 3 : 2}
        filter={`url(#${glowId})`}
      />

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
          fontFamily="sans-serif"
        >
          {piece.characterId.charAt(0)}
        </text>
      )}

      {piece.hasActed && (
        <g transform={`translate(${x + radius - 5}, ${y - radius + 5})`}>
          <circle r="8" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
          <text
            y="3.5"
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

// === COMPOSANT PRINCIPAL ===

export default function HexBoard({
  pieces,
  currentPlayer,
  phase,
  turnNumber,
  onMove,
}: HexBoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);

  // Génération du plateau (centré dans le SVG)
  const cells = useMemo(() => generateBoard(SVG_WIDTH / 2, SVG_HEIGHT / 2), []);

  // Helper pour trouver si une case est occupée
  const findPieceAtCell = (q: number, r: number) =>
    pieces.find((p) => p.q === q && p.r === r);

  // Sons
  const [playBoardPlacementSfx] = useSound(boardPlacementSfx);
  const [playPawnSelectSfx] = useSound(pawnSelectSfx);

  // Calcul des mouvements valides
  const validMoves = useMemo(() => {
    
    // On ne peut bouger qu'en phase ACTIONS et avec une pièce qui n'a pas encore agi
    if (!selectedPiece || selectedPiece.hasActed || phase !== "ACTIONS")
      return new Set<string>();

    const moves = new Set<string>();
    cells.forEach((cell) => {
      // Adjacente + Vide
      if (
        areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) &&
        !findPieceAtCell(cell.q, cell.r)
      ) {
        moves.add(`${cell.q},${cell.r}`);
      }
    });
    return moves;
  }, [selectedPiece, pieces, phase, cells]);

  // Sélection d'une pièce
  const handlePieceSelect = (piece: Piece) => {

    // Interdit de sélectionner une pièce adverse ou si on est en phase recrutement
    if (piece.ownerIndex !== currentPlayer || phase !== "ACTIONS") return;
    setSelectedPiece(selectedPiece?.id === piece.id ? null : piece);
    
    // Si on vient de choisir la pièce
    if (validMoves.size == 0){
      playPawnSelectSfx();
    }
  };

  // Clic sur une cellule (Déplacement)
  const handleCellClick = (cell: HexCell) => {
    if (selectedPiece && validMoves.has(`${cell.q},${cell.r}`)) {
      playBoardPlacementSfx();
      onMove(selectedPiece.id, cell.q, cell.r);
      setSelectedPiece(null); // Reset sélection après mouvement
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* HEADER HUD */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 bg-slate-800/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <h1 className="text-xl font-black text-white italic tracking-tighter">
            PHASE_{phase}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase">
          <div className="text-slate-500 tracking-widest">
            Tour <span className="text-white">{turnNumber}</span>
          </div>
          <div
            className={`px-3 py-1 rounded-full border ${currentPlayer === 0 ? "border-blue-500 text-blue-400" : "border-red-500 text-red-400"}`}
          >
            J{currentPlayer + 1} EN LIGNE
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* PLATEAU SVG */}
        <div className="relative p-6 rounded-[40px] bg-slate-900/40 border border-white/5 shadow-2xl">
          <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            className="drop-shadow-2xl"
          >
            {/* Rendu des hexagones */}
            {cells.map((cell) => {
              const isValid = validMoves.has(`${cell.q},${cell.r}`);
              const isHovered =
                hoveredCell?.q === cell.q && hoveredCell?.r === cell.r;

              return (
                <polygon
                  key={`${cell.q}-${cell.r}`}
                  points={getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.93)}
                  fill={
                    isValid
                      ? "rgba(34, 197, 94, 0.2)"
                      : isHovered
                        ? "#334155"
                        : "#1e293b"
                  }
                  stroke={
                    isValid
                      ? COLORS.validMove
                      : isHovered
                        ? "#64748b"
                        : "#475569"
                  }
                  strokeWidth={isValid ? 3 : 1.5}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => handleCellClick(cell)}
                  className="transition-colors duration-200 cursor-pointer"
                />
              );
            })}

            {/* Rendu des pièces */}
            {pieces.map((piece) => {
              const cell = cells.find(
                (c) => c.q === piece.q && c.r === piece.r,
              );
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
        </div>

        {/* PANNEAU INFOS (DÉTAILS UNITÉ) */}
        <div className="w-64 space-y-4">
          {selectedPiece ? (
            <div className="bg-slate-800/80 backdrop-blur-xl border border-amber-500/50 p-6 rounded-3xl animate-in slide-in-from-right duration-300">
              <h2 className="text-xl font-black text-white uppercase italic">
                {selectedPiece.characterId}
              </h2>
              <div className="h-1 w-8 bg-amber-500 my-3 rounded-full" />
              <div className="text-xs text-slate-400 leading-relaxed font-mono">
                COORDONNÉES: [{selectedPiece.q}, {selectedPiece.r}]<br />
                STATUT:{" "}
                {selectedPiece.hasActed
                  ? "ATTENTE TOUR SUIVANT"
                  : "PRÊT AU COMBAT"}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl text-slate-600 text-[10px] uppercase font-bold p-8 text-center tracking-widest">
              SCANNER EN ATTENTE...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
