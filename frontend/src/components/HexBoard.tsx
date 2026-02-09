import React, { useMemo } from "react";
import {
  generateBoard,
  getHexagonPoints,
  type HexCell,
  HEX_SIZE,
  areAdjacent,
} from "../utils/hexCoords";
import type { PieceFrontend, GamePhase } from "../api/gameApi";

// @ts-ignore
import useSound from "use-sound";
import boardPlacementSfx from "../sounds/boardPlacement.mp3";
import pawnSelectSfx from "../sounds/pawnSelect.mp3";

// === TYPES ===
interface HexBoardProps {
  pieces: PieceFrontend[];
  currentPlayer: number;
  phase: GamePhase;
  turnNumber: number;
  onMove: (pieceId: string, toQ: number, toR: number) => void;
  selectedPiece: PieceFrontend | null;
  onSelectPiece: (piece: PieceFrontend | null) => void;
  placementMode?: { cardId: string; cardName: string } | null;
  availablePlacementCells?: { q: number; r: number }[];
  onPlacementConfirm?: (q: number, r: number) => void;
  onAbilityUse?: (
    pieceId: string,
    abilityId: string,
    targetId: string,
    destination?: { q: number; r: number },
  ) => void;
  // Mode Manipulatrice (2 étapes)
  manipulatorTarget?: PieceFrontend | null;
  onManipulatorTargetSelect?: (target: PieceFrontend | null) => void;
  // Mode Cogneur (2 étapes)
  brawlerTarget?: PieceFrontend | null;
  onBrawlerTargetSelect?: (target: PieceFrontend | null) => void;
  // Mode Lance-Grappin (2 étapes pour MOVE)
  grapplerTarget?: PieceFrontend | null;
  onGrapplerTargetSelect?: (target: PieceFrontend | null) => void;
  grapplerMode?: "PULL" | "MOVE" | null;
  onGrapplerModeSelect?: (mode: "PULL" | "MOVE" | null) => void;
  // Mode Tavernier (2 étapes)
  innkeeperTarget?: PieceFrontend | null;
  onInnkeeperTargetSelect?: (target: PieceFrontend | null) => void;
  isLocalTurn?: boolean;
  volume?: number;
}

// === CONSTANTES DE STYLE ===
const COLORS = {
  player1: "#00f5ff",
  player1Glow: "#00f5ff",
  player2: "#ef4444",
  player2Glow: "#f87171",
  cellFill: "#0f1a2a",
  cellStroke: "#1e4a5a",
  cellHover: "#1e3a4a",
  validMove: "#00f5ff",
  selected: "#fbbf24",
};

const SVG_WIDTH = 700;
const SVG_HEIGHT = 600;

// === IMAGES DES PERSONNAGES ===
const CHARACTER_IMAGES: Record<string, string> = {
  LEADER: "/image/garderoyal.png",
  ARCHER: "/image/archere.png",
  BRAWLER: "/image/cogneur.png",
  PROWLER: "/image/rodeuse.png",
  CAVALRY: "/image/cavalier.png",
  ACROBAT: "/image/acrobate.png",
  ILLUSIONIST: "/image/illusioniste.png",
  GRAPPLER: "/image/lance-grappin.png",
  MANIPULATOR: "/image/manipulatrice.png",
  INNKEEPER: "/image/tavernier.png",
  JAILER: "/image/geolier.png",
  PROTECTOR: "/image/protecteur.png",
  ASSASSIN: "/image/assassin.png",
  ROYAL_GUARD: "/image/garderoyal.png",
  VIZIER: "/image/vizir.png",
  NEMESIS: "/image/nemesis.png",
};

// === SOUS-COMPOSANTS ===

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

function LockIcon() {
  return (
    <g transform="translate(-8, -8) scale(0.7)">
      <rect x="4" y="10" width="16" height="12" rx="2" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
      <path d="M8 10V6a4 4 0 1 1 8 0v4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="#fff" />
    </g>
  );
}

function ShieldIcon() {
  return (
    <g transform="translate(-8, -8) scale(0.7)">
      <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

interface PieceComponentProps {
  piece: PieceFrontend;
  x: number;
  y: number;
  isSelected: boolean;
  isBlocked: boolean;
  isProtected: boolean;
  isAbilityTarget: boolean;
  targetColor?: string;
  onSelect: (piece: PieceFrontend) => void;
  onAbilityTargetClick?: () => void;
}

function PieceComponent({
  piece,
  x,
  y,
  isSelected,
  isBlocked,
  isProtected,
  isAbilityTarget,
  targetColor = "#a855f7",
  onSelect,
  onAbilityTargetClick,
}: PieceComponentProps) {
  const isLeader = piece.characterId === "LEADER";
  const isJailer = piece.characterId === "JAILER";
  const isProtector = piece.characterId === "PROTECTOR";
  const color = piece.ownerIndex === 0 ? COLORS.player1 : COLORS.player2;
  const radius = HEX_SIZE * 0.55;
  const glowId = `glow-${piece.id}`;
  const clipId = `clip-${piece.id}`;
  const imageUrl = CHARACTER_IMAGES[piece.characterId] || "/image/garderoyal.png";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAbilityTarget && onAbilityTargetClick) {
      onAbilityTargetClick();
    } else {
      onSelect(piece);
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: "pointer" }}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="grayscale">
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0" />
        </filter>
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={radius - 3} />
        </clipPath>
      </defs>

      {/* Selection/Ability Rings */}
      {isSelected && (
        <circle cx={x} cy={y} r={radius + 8} fill="none" stroke={COLORS.selected} strokeWidth="2">
          <animate attributeName="r" values={`${radius + 6};${radius + 10};${radius + 6}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {isAbilityTarget && (
        <circle cx={x} cy={y} r={radius + 10} fill="none" stroke={targetColor} strokeWidth="3">
          <animate attributeName="r" values={`${radius + 8};${radius + 12};${radius + 8}`} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Scenario Rings */}
      {isBlocked && (
        <circle cx={x} cy={y} r={radius + 5} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2">
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {isProtected && !isProtector && (
        <circle cx={x} cy={y} r={radius + 5} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2">
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="#1a1a2e"
        stroke={isAbilityTarget ? targetColor : isBlocked ? "#ef4444" : isProtected ? "#f59e0b" : color}
        strokeWidth={isAbilityTarget ? 4 : isLeader ? 4 : 3}
        filter={`url(#${glowId})`}
        opacity={piece.hasActed ? 0.6 : 1}
      />

      <image
        href={imageUrl}
        x={x - radius + 3}
        y={y - radius + 3}
        width={(radius - 3) * 2}
        height={(radius - 3) * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: piece.hasActed ? "grayscale(100%) brightness(70%)" : "none" }}
        opacity={piece.hasActed ? 0.6 : 1}
      />

      {isLeader && <g transform={`translate(${x}, ${y - radius - 8})`}><CrownIcon color={color} /></g>}
      {isJailer && <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}><LockIcon /></g>}
      {isProtector && <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}><ShieldIcon /></g>}
      {isBlocked && !isJailer && <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}><LockIcon /></g>}
      {isProtected && !isProtector && <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}><ShieldIcon /></g>}

      {piece.hasActed && (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={radius} fill="rgba(0,0,0,0.5)" />
          {/* Logo validé (cadenas/coche) - Ici on met le cadenas pour uniformité */}
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontSize="24"
            style={{ filter: "drop-shadow(0px 0px 4px rgba(0,0,0,0.8))" }}
          >
            🔒
          </text>
        </g>
      )}
    </g>
  );
}

// === COMPOSANT PRINCIPAL ===

export default function HexBoard(props: HexBoardProps) {
  const {
    pieces,
    currentPlayer,
    onMove,
    selectedPiece,
    onSelectPiece,
    placementMode,
    onPlacementConfirm,
    phase,
    onAbilityUse,
    manipulatorTarget,
    onManipulatorTargetSelect,
    brawlerTarget,
    onBrawlerTargetSelect,
    grapplerTarget,
    onGrapplerTargetSelect,
    grapplerMode,
    onGrapplerModeSelect,
    innkeeperTarget,
    onInnkeeperTargetSelect,
    isLocalTurn,
    volume = 0,
    availablePlacementCells = [],
  } = props;

  const [playPlacement] = useSound(boardPlacementSfx, { volume: volume / 100 });
  const [playSelect] = useSound(pawnSelectSfx, { volume: volume / 100 });
  const cells = useMemo(() => generateBoard(SVG_WIDTH / 2, SVG_HEIGHT / 2), []);

  const findPieceAtCell = (q: number, r: number) => pieces.find((p) => p.q === q && p.r === r);

  const HEX_DIRECTIONS = [
    { dq: 1, dr: 0 }, { dq: -1, dr: 0 }, { dq: 0, dr: 1 },
    { dq: 0, dr: -1 }, { dq: 1, dr: -1 }, { dq: -1, dr: 1 },
  ];

  const isValidHex = (q: number, r: number) => Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;

  const hexDistance = (q1: number, r1: number, q2: number, r2: number): number => {
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - (q2 + r2))) / 2;
  };

  const isInLineOfSight = (q1: number, r1: number, q2: number, r2: number): boolean => {
    const dq = q2 - q1;
    const dr = r2 - r1;
    const ds = -dq - dr;
    return dq === 0 || dr === 0 || ds === 0;
  };

  const isPathClear = (q1: number, r1: number, q2: number, r2: number): boolean => {
    const distance = hexDistance(q1, r1, q2, r2);
    if (distance <= 1) return true;
    const stepQ = (q2 - q1) / distance;
    const stepR = (r2 - r1) / distance;
    for (let i = 1; i < distance; i++) {
      if (pieces.some((p) => p.q === q1 + stepQ * i && p.r === r1 + stepR * i)) return false;
    }
    return true;
  };

  // Scenario 3 logic
  const blockedPieceIds = useMemo(() => {
    const blocked = new Set<string>();
    pieces.filter(p => p.characterId === "JAILER").forEach(jailer => {
      pieces.forEach(p => {
        if (p.ownerIndex !== jailer.ownerIndex && areAdjacent(jailer.q, jailer.r, p.q, p.r)) blocked.add(p.id);
      });
    });
    return blocked;
  }, [pieces]);

  const protectedPieceIds = useMemo(() => {
    const shielded = new Set<string>();
    pieces.filter(p => p.characterId === "PROTECTOR").forEach(protector => {
      shielded.add(protector.id);
      pieces.forEach(p => {
        if (p.ownerIndex === protector.ownerIndex && areAdjacent(protector.q, protector.r, p.q, p.r)) shielded.add(p.id);
      });
    });
    return shielded;
  }, [pieces]);

  // Movement calculation
  const validMoves = useMemo(() => {
    // Si ce n'est pas mon tour, ou si la pièce n'est pas à moi, ou si elle a déjà joué, pas de mouvement.
    if (!selectedPiece || selectedPiece.ownerIndex !== currentPlayer || selectedPiece.hasActed || phase !== "ACTIONS" || !isLocalTurn) return new Set<string>();
    const moves = new Set<string>();

    if (selectedPiece.characterId === "PROWLER") {
      cells.forEach(cell => {
        if (!findPieceAtCell(cell.q, cell.r) && !pieces.some(p => p.ownerIndex !== selectedPiece.ownerIndex && hexDistance(cell.q, cell.r, p.q, p.r) === 1)) {
          moves.add(`${cell.q},${cell.r}`);
        }
      });
      return moves;
    }

    cells.forEach(cell => {
      if (areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) && !findPieceAtCell(cell.q, cell.r)) moves.add(`${cell.q},${cell.r}`);
    });

    if (selectedPiece.characterId === "ACROBAT") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const midQ = selectedPiece.q + dq, midR = selectedPiece.r + dr;
        const destQ = selectedPiece.q + dq * 2, destR = selectedPiece.r + dr * 2;
        if (isValidHex(midQ, midR) && findPieceAtCell(midQ, midR) && isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) moves.add(`${destQ},${destR}`);
      });
    }

    if (selectedPiece.characterId === "CAVALRY") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const midQ = selectedPiece.q + dq, midR = selectedPiece.r + dr;
        const destQ = selectedPiece.q + dq * 2, destR = selectedPiece.r + dr * 2;
        if (isValidHex(midQ, midR) && !findPieceAtCell(midQ, midR) && isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) moves.add(`${destQ},${destR}`);
      });
    }

    return moves;
  }, [selectedPiece, pieces, phase, cells, isLocalTurn]);

  // UI helpers for abilities
  const illusionistTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "ILLUSIONIST" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.id !== selectedPiece.id && isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn]);

  const manipulatorTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "MANIPULATOR" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.ownerIndex !== selectedPiece.ownerIndex && isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn]);

  const manipulatorDestinations = useMemo(() => {
    if (!manipulatorTarget) return new Set<string>();
    const dest = new Set<string>();
    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const q = manipulatorTarget.q + dq, r = manipulatorTarget.r + dr;
      if (isValidHex(q, r) && !findPieceAtCell(q, r)) dest.add(`${q},${r}`);
    });
    return dest;
  }, [manipulatorTarget, pieces]);

  const brawlerTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "BRAWLER" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.ownerIndex !== selectedPiece.ownerIndex && areAdjacent(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn]);

  const brawlerDestinations = useMemo(() => {
    if (!brawlerTarget || !selectedPiece) return new Set<string>();
    const dest = new Set<string>();
    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const q = brawlerTarget.q + dq, r = brawlerTarget.r + dr;
      if (isValidHex(q, r) && !findPieceAtCell(q, r) && hexDistance(selectedPiece.q, selectedPiece.r, q, r) === 2) dest.add(`${q},${r}`);
    });
    return dest;
  }, [brawlerTarget, selectedPiece, pieces]);

  const grapplerTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "GRAPPLER" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.id === selectedPiece.id) return;
      if (isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn]);

  const grapplerMoveDestinations = useMemo(() => {
    if (!grapplerTarget) return new Set<string>();
    const dest = new Set<string>();
    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const q = grapplerTarget.q + dq, r = grapplerTarget.r + dr;
      if (isValidHex(q, r) && !findPieceAtCell(q, r)) dest.add(`${q},${r}`);
    });
    return dest;
  }, [grapplerTarget, pieces]);

  const innkeeperTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "INNKEEPER" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.ownerIndex === selectedPiece.ownerIndex && p.id !== selectedPiece.id && areAdjacent(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn]);

  const innkeeperDestinations = useMemo(() => {
    if (!innkeeperTarget) return new Set<string>();
    const dest = new Set<string>();
    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const q = innkeeperTarget.q + dq, r = innkeeperTarget.r + dr;
      if (isValidHex(q, r) && !findPieceAtCell(q, r)) dest.add(`${q},${r}`);
    });
    return dest;
  }, [innkeeperTarget, pieces]);

  const handleCellClick = (cell: HexCell) => {
    if (!isLocalTurn) return;

    if (placementMode && onPlacementConfirm) {
      if (availablePlacementCells.some(c => c.q === cell.q && c.r === cell.r)) {
        playPlacement();
        onPlacementConfirm(cell.q, cell.r);
        return;
      }
    }

    if (manipulatorTarget && manipulatorDestinations.has(`${cell.q},${cell.r}`) && onAbilityUse && selectedPiece) {
      onAbilityUse(selectedPiece.id, "MANIPULATOR_MOVE", manipulatorTarget.id, { q: cell.q, r: cell.r });
      return;
    }

    if (brawlerTarget && brawlerDestinations.has(`${cell.q},${cell.r}`) && onAbilityUse && selectedPiece) {
      onAbilityUse(selectedPiece.id, "BRAWLER_PUSH", brawlerTarget.id, { q: cell.q, r: cell.r });
      return;
    }

    if (grapplerTarget && grapplerMode === "MOVE" && grapplerMoveDestinations.has(`${cell.q},${cell.r}`) && onAbilityUse && selectedPiece) {
      onAbilityUse(selectedPiece.id, "GRAPPLE_HOOK", grapplerTarget.id, { q: cell.q, r: cell.r });
      return;
    }

    if (innkeeperTarget && innkeeperDestinations.has(`${cell.q},${cell.r}`) && onAbilityUse && selectedPiece) {
      onAbilityUse(selectedPiece.id, "INNKEEPER_ASSIST", innkeeperTarget.id, { q: cell.q, r: cell.r });
      return;
    }

    if (selectedPiece && validMoves.has(`${cell.q},${cell.r}`)) {
      playPlacement();
      onMove(selectedPiece.id, cell.q, cell.r);
      onSelectPiece(null);
    } else {
      onSelectPiece(null);
      if (onManipulatorTargetSelect) onManipulatorTargetSelect(null);
      if (onBrawlerTargetSelect) onBrawlerTargetSelect(null);
      if (onGrapplerTargetSelect) onGrapplerTargetSelect(null);
      if (onGrapplerModeSelect) onGrapplerModeSelect(null);
      if (onInnkeeperTargetSelect) onInnkeeperTargetSelect(null);
    }
  };

  const handlePieceSelect = (piece: PieceFrontend) => {
    // On autorise la sélection de n'importe quelle pièce pour voir ses infos (Scanner)
    // Sauf Némésis qui est spéciale (à voir si on veut l'autoriser aussi plus tard)
    if (piece.characterId === "NEMESIS") return;

    // Jouer le son si changement de sélection
    if (selectedPiece?.id !== piece.id) playSelect();

    onSelectPiece(selectedPiece?.id === piece.id ? null : piece);
  };

  return (
    <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="drop-shadow-2xl overflow-visible">
      <defs>
        <filter id="glow-player1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-player2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-ability" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {cells.map(cell => {
        const isValid = validMoves.has(`${cell.q},${cell.r}`);
        const isPlacement = placementMode && availablePlacementCells.some(c => c.q === cell.q && c.r === cell.r);
        const isAbility = manipulatorDestinations.has(`${cell.q},${cell.r}`) || brawlerDestinations.has(`${cell.q},${cell.r}`) || grapplerMoveDestinations.has(`${cell.q},${cell.r}`) || innkeeperDestinations.has(`${cell.q},${cell.r}`);

        const pieceOnCell = findPieceAtCell(cell.q, cell.r);
        const canAct = pieceOnCell?.ownerIndex === currentPlayer && !pieceOnCell.hasActed && phase === "ACTIONS" && isLocalTurn;

        let fill = COLORS.cellFill, stroke = COLORS.cellStroke, width = 1, filter = "";
        if (isPlacement) { fill = "rgba(251, 191, 36, 0.2)"; stroke = "#fbbf24"; width = 3; filter = "url(#glow-amber)"; }
        else if (isAbility) { fill = "rgba(168, 85, 247, 0.3)"; stroke = "#a855f7"; width = 3; filter = "url(#glow-ability)"; }
        else if (isValid) { fill = "rgba(0, 245, 255, 0.15)"; stroke = COLORS.validMove; width = 2; }
        else if (canAct) { stroke = currentPlayer === 0 ? COLORS.player1 : COLORS.player2; width = 2.5; filter = `url(#glow-player${currentPlayer + 1})`; }

        const isRecruitmentP0 = (cell.r === 3 && cell.q <= 0 && cell.q >= -3) || (cell.q + cell.r === 3 && cell.q >= 0 && cell.q <= 3);
        const isRecruitmentP1 = (cell.r === -3 && cell.q >= 0 && cell.q <= 3) || (cell.q + cell.r === -3 && cell.q <= 0 && cell.q >= -3);
        const isPermanentRecruitment = isRecruitmentP0 || isRecruitmentP1;

        return (
          <g key={`${cell.q}-${cell.r}`}>
            <polygon
              points={getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.93)}
              fill={fill}
              stroke={stroke}
              strokeWidth={width}
              filter={filter}
              onClick={() => handleCellClick(cell)}
              className={`transition-colors duration-200 cursor-pointer ${isAbility || isPlacement ? "animate-pulse" : ""}`}
            />
            {/* Indicateur permanent de zone de recrutement (Subtile bordure en pointillés dorés) */}
            {isPermanentRecruitment && !isPlacement && !isAbility && !isValid && (
              <polygon
                points={getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.85)}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.4"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}

      {pieces.map(piece => {
        const cell = cells.find(c => c.q === piece.q && c.r === piece.r);
        if (!cell) return null;

        const isAbilityTarget = illusionistTargets.has(piece.id) || manipulatorTargets.has(piece.id) || brawlerTargets.has(piece.id) || grapplerTargets.has(piece.id) || innkeeperTargets.has(piece.id);
        const targetColor = brawlerTargets.has(piece.id) ? "#f97316" : grapplerTargets.has(piece.id) ? "#06b6d4" : innkeeperTargets.has(piece.id) ? "#eab308" : "#a855f7";

        const isSelected = selectedPiece?.id === piece.id || brawlerTarget?.id === piece.id || manipulatorTarget?.id === piece.id || grapplerTarget?.id === piece.id || innkeeperTarget?.id === piece.id;

        return (
          <PieceComponent
            key={piece.id}
            piece={piece}
            x={cell.x}
            y={cell.y}
            isSelected={isSelected}
            isBlocked={blockedPieceIds.has(piece.id)}
            isProtected={protectedPieceIds.has(piece.id)}
            isAbilityTarget={isAbilityTarget}
            targetColor={targetColor}
            onSelect={handlePieceSelect}
            onAbilityTargetClick={() => {
              if (illusionistTargets.has(piece.id) && selectedPiece) onAbilityUse?.(selectedPiece.id, "ILLUSIONIST_SWAP", piece.id);
              else if (manipulatorTargets.has(piece.id)) onManipulatorTargetSelect?.(piece);
              else if (brawlerTargets.has(piece.id)) onBrawlerTargetSelect?.(piece);
              else if (grapplerTargets.has(piece.id)) onGrapplerTargetSelect?.(piece);
              else if (innkeeperTargets.has(piece.id)) onInnkeeperTargetSelect?.(piece);
            }}
          />
        );
      })}
    </svg>
  );
}
