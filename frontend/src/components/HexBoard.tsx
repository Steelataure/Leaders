import React, { useMemo, useCallback } from "react";
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
    secondaryDestination?: { q: number; r: number },
  ) => void;
  // Mode Manipulatrice (2 étapes)
  manipulatorTarget?: PieceFrontend | null;
  onManipulatorTargetSelect?: (target: PieceFrontend | null) => void;
  // Mode Cogneur (3 étapes)
  brawlerTarget?: PieceFrontend | null;
  onBrawlerTargetSelect?: (target: PieceFrontend | null) => void;
  brawlerLandingCell?: { q: number; r: number } | null;
  onBrawlerLandingCellSelect?: (cell: { q: number; r: number } | null) => void;
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
  actionMode?: "MOVE" | "ABILITY";
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
  LEADER_RED: "/image/leaders/leader_red.png",
  LEADER_BLUE: "/image/leaders/leader_blue.png",
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
  OLD_BEAR: "/image/vieilours_ourson.png",
  CUB: "/image/vieilours_ourson.png",
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

function CheckIcon() {
  return (
    <g transform="translate(-8, -8) scale(0.8)">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
  const imageUrl = isLeader
    ? (piece.ownerIndex === 0 ? CHARACTER_IMAGES.LEADER_BLUE : CHARACTER_IMAGES.LEADER_RED)
    : (CHARACTER_IMAGES[piece.characterId] || "/image/garderoyal.png");

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
        <radialGradient id={`grad-${piece.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <filter id={`inner-shadow-${piece.id}`}>
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feFlood floodColor="black" floodOpacity="0.8" />
          <feComposite in2="offsetblur" operator="in" />
          <feComposite in2="SourceAlpha" operator="in" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode />
          </feMerge>
        </filter>
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
        stroke={isAbilityTarget ? targetColor : isProtected ? "#f59e0b" : color}
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
        preserveAspectRatio={piece.characterId === "CUB" ? "xMidYMax slice" : "xMidYMid slice"}
        style={{
          filter: piece.hasActed
            ? "grayscale(100%) brightness(70%)"
            : `url(#inner-shadow-${piece.id})`
        }}
        opacity={piece.hasActed ? 0.6 : 1}
      />
      {/* Overlay gradient pour mieux intégrer l'image */}
      <circle
        cx={x}
        cy={y}
        r={radius - 3}
        fill={`url(#grad-${piece.id})`}
        pointerEvents="none"
        opacity={piece.hasActed ? 0.3 : 0.4}
      />

      {isLeader && <g transform={`translate(${x}, ${y - radius - 8})`}><CrownIcon color={color} /></g>}
      {isJailer && <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}><LockIcon /></g>}
      {isProtector && <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}><ShieldIcon /></g>}
      {isBlocked && !isJailer && <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}><LockIcon /></g>}
      {isProtected && !isProtector && <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}><ShieldIcon /></g>}

      {/* Exhaustion Indicator (Checkmark) - Drawn at the top for maximum visibility */}
      {piece.hasActed && <g transform={`translate(${x + radius - 12}, ${y + radius - 12})`} className="drop-shadow-lg"><CheckIcon /></g>}
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
    volume = 0.5,
    actionMode = "MOVE",
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
  // Special Mobility Destinations (Only for ABILITY mode)
  const abilityMoveDestinations = useMemo(() => {
    if (!selectedPiece || selectedPiece.ownerIndex !== currentPlayer || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const dests = new Set<string>();

    // PROWLER: Non-adjacent to enemies
    if (selectedPiece.characterId === "PROWLER") {
      cells.forEach(cell => {
        // Must be empty
        if (findPieceAtCell(cell.q, cell.r)) return;
        // Must NOT be adjacent to any enemy
        const isAdjacentToEnemy = pieces.some(p => p.ownerIndex !== selectedPiece.ownerIndex && hexDistance(cell.q, cell.r, p.q, p.r) === 1);

        if (!isAdjacentToEnemy) {
          dests.add(`${cell.q},${cell.r}`);
        }
      });
    }

    // ACROBAT: Jump over adjacent (Double Jump)
    if (selectedPiece.characterId === "ACROBAT") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        // 1er saut
        const midQ = selectedPiece.q + dq, midR = selectedPiece.r + dr;
        const jump1Q = selectedPiece.q + dq * 2, jump1R = selectedPiece.r + dr * 2;

        // Jump condition: Adjacent cell occupied, Landing cell empty & valid
        if (isValidHex(midQ, midR) && findPieceAtCell(midQ, midR) && isValidHex(jump1Q, jump1R) && !findPieceAtCell(jump1Q, jump1R)) {
          dests.add(`${jump1Q},${jump1R}`);

          // 2eme saut (depuis jump1)
          HEX_DIRECTIONS.forEach(({ dq: dq2, dr: dr2 }) => {
            const mid2Q = jump1Q + dq2, mid2R = jump1R + dr2;
            const jump2Q = jump1Q + dq2 * 2, jump2R = jump1R + dr2 * 2;

            if (isValidHex(mid2Q, mid2R) && findPieceAtCell(mid2Q, mid2R) && isValidHex(jump2Q, jump2R) && !findPieceAtCell(jump2Q, jump2R)) {
              // On évite de revenir sur la case de départ (même si autorisé backend, c'est visuellement confus pour un "double saut")
              if (jump2Q !== selectedPiece.q || jump2R !== selectedPiece.r) {
                dests.add(`${jump2Q},${jump2R}`);
              }
            }
          });
        }
      });
    }

    // CAVALRY: Charge (2 tiles straight line)
    if (selectedPiece.characterId === "CAVALRY") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const midQ = selectedPiece.q + dq, midR = selectedPiece.r + dr;
        const destQ = selectedPiece.q + dq * 2, destR = selectedPiece.r + dr * 2;
        // Charge condition: Path clear (mid empty), Landing empty & valid
        if (isValidHex(midQ, midR) && !findPieceAtCell(midQ, midR) && isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) {
          dests.add(`${destQ},${destR}`);
        }
      });
    }

    // ROYAL GUARD: Adjacent to Leader (Distance 1 or 2)
    if (selectedPiece.characterId === "ROYAL_GUARD") {
      const leader = pieces.find(p => p.ownerIndex === selectedPiece.ownerIndex && p.characterId === "LEADER");
      if (leader) {
        cells.forEach(cell => {
          if (findPieceAtCell(cell.q, cell.r)) return;
          const dist = hexDistance(cell.q, cell.r, leader.q, leader.r);
          if (dist >= 1 && dist <= 2) {
            dests.add(`${cell.q},${cell.r}`);
          }
        });
      }
    }

    return dests;
  }, [selectedPiece, pieces, cells, isLocalTurn]);

  // Movement calculation
  const validMoves = useMemo(() => {
    // Si ce n'est pas mon tour, ou si la pièce n'est pas à moi, ou si elle a déjà joué, pas de mouvement.
    if (!selectedPiece || selectedPiece.ownerIndex !== currentPlayer || selectedPiece.hasActed || phase !== "ACTIONS" || !isLocalTurn) return new Set<string>();
    const moves = new Set<string>();

    // Standard Move: Always 1 tile adjacent
    if (selectedPiece.characterId === "NEMESIS") return moves;

    cells.forEach(cell => {
      if (areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) && !findPieceAtCell(cell.q, cell.r)) {
        moves.add(`${cell.q},${cell.r}`);
      }
    });

    // Vizier Boost (Leader moves 2 if ally Vizier present)
    if (selectedPiece.characterId === "LEADER") {
      const hasVizierAlly = pieces.some(p => p.characterId === "VIZIER" && p.ownerIndex === selectedPiece.ownerIndex);
      if (hasVizierAlly) {
        cells.forEach(cell => {
          const dist = hexDistance(selectedPiece.q, selectedPiece.r, cell.q, cell.r);
          if (dist === 2 && !findPieceAtCell(cell.q, cell.r)) {
            // Path must be clear
            if (isPathClear(selectedPiece.q, selectedPiece.r, cell.q, cell.r)) {
              moves.add(`${cell.q},${cell.r}`);
            }
          }
        });
      }
    }

    return moves;
  }, [selectedPiece, pieces, phase, cells, isLocalTurn]);

  // UI helpers for abilities
  const isPieceProtected = useCallback((targetPiece: PieceFrontend) => {
    // Un morceau est protégé s'il s'agit d'un PROTECTEUR ou s'il est adjacent à un PROTECTEUR allié
    if (targetPiece.characterId === "PROTECTOR") return true;
    return pieces.some(p =>
      p.ownerIndex === targetPiece.ownerIndex &&
      p.characterId === "PROTECTOR" &&
      areAdjacent(p.q, p.r, targetPiece.q, targetPiece.r)
    );
  }, [pieces]);

  const illusionistTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "ILLUSIONIST" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      // Un adversaire ne peut pas échanger sa place avec un des protégés
      const isEnemyProtected = p.ownerIndex !== selectedPiece.ownerIndex && isPieceProtected(p);
      if (p.id !== selectedPiece.id && !isEnemyProtected && isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn, isPieceProtected]);

  const manipulatorTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "MANIPULATOR" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.ownerIndex !== selectedPiece.ownerIndex && !isPieceProtected(p) && isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn, isPieceProtected]);

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
      if (p.ownerIndex !== selectedPiece.ownerIndex && !isPieceProtected(p)) {
        const dist = hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r);
        if (dist === 1 || dist === 2) targets.add(p.id);
      }
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn, isPieceProtected]);

  const brawlerPushDestinations = useMemo(() => {
    if (!brawlerTarget || !selectedPiece) return new Set<string>();
    const dests = new Set<string>();

    // Step 2: Select Push Cell (any adjacent empty cell to target)
    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const pQ = brawlerTarget.q + dq, pR = brawlerTarget.r + dr;
      if (isValidHex(pQ, pR) && !findPieceAtCell(pQ, pR)) {
        dests.add(`${pQ},${pR}`);
      }
    });

    return dests;
  }, [brawlerTarget, selectedPiece, pieces]);

  const grapplerTargets = useMemo(() => {
    if (!selectedPiece || selectedPiece.characterId !== "GRAPPLER" || selectedPiece.hasActed || !isLocalTurn) return new Set<string>();
    const targets = new Set<string>();
    pieces.forEach(p => {
      if (p.id === selectedPiece.id) return;
      // Note: Protection only blocks PULL, but we simplify by blocking targeting if it's an enemy protected.
      // If it's an ally, we don't block because moving towards them is allowed.
      const isEnemyProtected = p.ownerIndex !== selectedPiece.ownerIndex && isPieceProtected(p);
      if (!isEnemyProtected && isInLineOfSight(selectedPiece.q, selectedPiece.r, p.q, p.r) && hexDistance(selectedPiece.q, selectedPiece.r, p.q, p.r) > 1 && isPathClear(selectedPiece.q, selectedPiece.r, p.q, p.r)) targets.add(p.id);
    });
    return targets;
  }, [selectedPiece, pieces, isLocalTurn, isPieceProtected]);

  const grapplerMoveDestinations = useMemo(() => {
    if (!grapplerTarget || !selectedPiece) return new Set<string>();
    const dest = new Set<string>();

    const dq = grapplerTarget.q - selectedPiece.q;
    const dr = grapplerTarget.r - selectedPiece.r;
    const dist = hexDistance(selectedPiece.q, selectedPiece.r, grapplerTarget.q, grapplerTarget.r);

    if (dist > 1) {
      // Direction unitaire
      const dirQ = dq / dist;
      const dirR = dr / dist;

      // La destination doit être target - dir (le grappin "tire" le grappler vers la cible)
      const q = grapplerTarget.q - dirQ;
      const r = grapplerTarget.r - dirR;

      if (isValidHex(q, r) && !findPieceAtCell(q, r)) {
        dest.add(`${q},${r}`);
      }
    }
    return dest;
  }, [grapplerTarget, selectedPiece, pieces]);

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

    if (brawlerTarget && brawlerPushDestinations.has(`${cell.q},${cell.r}`) && onAbilityUse && selectedPiece) {
      // Landing cell is the target's current position
      const landingCell = { q: brawlerTarget.q, r: brawlerTarget.r };
      onAbilityUse(selectedPiece.id, "BRAWLER_PUSH", brawlerTarget.id, landingCell, { q: cell.q, r: cell.r });
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

    // Handle Special Mobility Abilities (PROWLER, ACROBAT, CAVALRY)
    const abilityKey = `${cell.q},${cell.r}`;
    const isProwlerStruct = selectedPiece?.characterId === "PROWLER";
    const targetPiece = findPieceAtCell(cell.q, cell.r);

    // We allow Prowler to try any empty cell in Ability mode, relying on backend validation if frontend calc is too strict
    const isValidAbilityClick = abilityMoveDestinations.has(abilityKey) || (isProwlerStruct && !targetPiece);

    if (actionMode === "ABILITY" && isValidAbilityClick && onAbilityUse && selectedPiece) {
      console.log("HexBoard: Special Ability Click detected for", abilityKey);
      let abilityId = "";
      let targetId = "";

      if (selectedPiece.characterId === "PROWLER") {
        abilityId = "PROWLER_STEALTH";
      } else if (selectedPiece.characterId === "ACROBAT") {
        abilityId = "ACROBAT_JUMP";
        // Find mid piece to jump over
        const dq = (cell.q - selectedPiece.q) / 2;
        const dr = (cell.r - selectedPiece.r) / 2;
        const midPiece = findPieceAtCell(selectedPiece.q + dq, selectedPiece.r + dr);
        if (midPiece) targetId = midPiece.id;
      } else if (selectedPiece.characterId === "CAVALRY") {
        abilityId = "CAVALRY_CHARGE";
      } else if (selectedPiece.characterId === "ROYAL_GUARD") {
        abilityId = "ROYAL_GUARD_PROTECT";
      }

      if (abilityId) {
        console.log("HexBoard: Executing Ability", abilityId, "at", cell.q, cell.r, "target:", targetId);
        onAbilityUse(selectedPiece.id, abilityId, targetId, { q: cell.q, r: cell.r });
        playPlacement();
        onSelectPiece(null);
        return;
      }
    } else if (actionMode === "ABILITY") {
      console.log("HexBoard: Click in ABILITY mode ignored: ", abilityKey, "HasDest:", abilityMoveDestinations.has(abilityKey));
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

    // Jouer le son si changement de sélection
    if (selectedPiece?.id !== piece.id) playSelect();

    onSelectPiece(selectedPiece?.id === piece.id ? null : piece);
  };

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className="drop-shadow-2xl overflow-visible"
    >
      <defs>
        <filter id="glow-player1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-player2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-ability" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {cells.map(cell => {
        const isValid = actionMode === "MOVE" && validMoves.has(`${cell.q},${cell.r}`);
        const isPlacement = placementMode && availablePlacementCells.some(c => c.q === cell.q && c.r === cell.r);
        const isAbility = actionMode === "ABILITY" && (
          manipulatorDestinations.has(`${cell.q},${cell.r}`) ||
          brawlerPushDestinations.has(`${cell.q},${cell.r}`) ||
          grapplerMoveDestinations.has(`${cell.q},${cell.r}`) ||
          innkeeperDestinations.has(`${cell.q},${cell.r}`) ||
          abilityMoveDestinations.has(`${cell.q},${cell.r}`)
        );

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

        const isAbilityTarget = actionMode === "ABILITY" && (illusionistTargets.has(piece.id) || manipulatorTargets.has(piece.id) || brawlerTargets.has(piece.id) || grapplerTargets.has(piece.id) || innkeeperTargets.has(piece.id));
        const targetColor = brawlerTargets.has(piece.id) ? "#a855f7" : grapplerTargets.has(piece.id) ? "#06b6d4" : innkeeperTargets.has(piece.id) ? "#eab308" : "#a855f7";

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
