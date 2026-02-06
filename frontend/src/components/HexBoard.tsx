import { useMemo, useState } from "react";
import {
  generateBoard,
  getHexagonPoints,
  type HexCell,
  HEX_SIZE,
  areAdjacent,
} from "../utils/hexCoords";
import type { PieceFrontend } from "../api/gameApi";

// @ts-ignore
import useSound from "use-sound";
import boardPlacementSfx from "../sounds/boardPlacement.mp3";
import pawnSelectSfx from "../sounds/pawnSelect.mp3";

// === TYPES ===
export type GamePhase = "ACTIONS" | "RECRUITMENT";

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
  // Pour les capacités ciblant des personnages
  onAbilityUse?: (
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
  ACROBAT: "/image/acrobate.png",
  ARCHER: "/image/archere.png",
  ASSASSIN: "/image/assassin.png",
  BRAWLER: "/image/cogneur.png",
  CAVALRY: "/image/cavalier.png",
  GRAPPLER: "/image/lance-grappin.png",
  ILLUSIONIST: "/image/illusioniste.png",
  INNKEEPER: "/image/tavernier.png",
  JAILER: "/image/geolier.png",
  MANIPULATOR: "/image/manipulatrice.png",
  NEMESIS: "/image/nemesis.png",
  OLD_BEAR: "/image/vieilours&ourson.png",
  CUB: "/image/vieilours&ourson.png",
  PROTECTOR: "/image/protecteur.png",
  PROWLER: "/image/rodeuse.png",
  ROYAL_GUARD: "/image/garderoyal.png",
  VIZIER: "/image/vizir.png",
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
      <rect
        x="4"
        y="10"
        width="16"
        height="12"
        rx="2"
        fill="#ef4444"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <path
        d="M8 10V6a4 4 0 1 1 8 0v4"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="#fff" />
    </g>
  );
}

function ShieldIcon() {
  return (
    <g transform="translate(-8, -8) scale(0.7)">
      <path
        d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z"
        fill="#22c55e"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const imageUrl = CHARACTER_IMAGES[piece.characterId] || "/image/vizir.png";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAbilityTarget && onAbilityTargetClick) {
      onAbilityTargetClick();
    } else {
      onSelect(piece);
    }
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      opacity={piece.hasActed ? 0.6 : 1}
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={radius - 3} />
        </clipPath>
      </defs>

      {/* Selection Ring */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={radius + 8}
          fill="none"
          stroke={COLORS.selected}
          strokeWidth="2"
        >
          <animate
            attributeName="r"
            values={`${radius + 6};${radius + 10};${radius + 6}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Ring pour cible de capacité */}
      {isAbilityTarget && (
        <circle
          cx={x}
          cy={y}
          r={radius + 10}
          fill="none"
          stroke={targetColor}
          strokeWidth="3"
        >
          <animate
            attributeName="r"
            values={`${radius + 8};${radius + 12};${radius + 8}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="1;0.5;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Ring rouge si bloqué par Geôlier (Scénario 3) */}
      {isBlocked && (
        <circle
          cx={x}
          cy={y}
          r={radius + 5}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="4 2"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.4;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Ring vert si protégé par Protecteur (Scénario 3) */}
      {isProtected && !isProtector && (
        <circle
          cx={x}
          cy={y}
          r={radius + 5}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="4 2"
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.4;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Cercle de fond */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="#1a1a2e"
        stroke={
          isAbilityTarget
            ? targetColor
            : isBlocked
              ? "#ef4444"
              : isProtected
                ? "#22c55e"
                : color
        }
        strokeWidth={isAbilityTarget ? 4 : isLeader ? 4 : 3}
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

      {/* Icônes spéciales (Scénario 3) */}
      {isJailer && (
        <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}>
          <LockIcon />
        </g>
      )}
      {isProtector && (
        <g transform={`translate(${x - radius + 5}, ${y - radius + 5})`}>
          <ShieldIcon />
        </g>
      )}
      {isBlocked && !isJailer && (
        <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}>
          <LockIcon />
        </g>
      )}
      {isProtected && !isProtector && (
        <g transform={`translate(${x + radius - 8}, ${y + radius - 8})`}>
          <ShieldIcon />
        </g>
      )}

      {/* Acted Status */}
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
  selectedPiece,
  onSelectPiece,
  onMove,
  placementMode,
  availablePlacementCells = [],
  onPlacementConfirm,
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
}: HexBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);

  const [playBoardPlacementSfx] = useSound(boardPlacementSfx);
  const [playPawnSelectSfx] = useSound(pawnSelectSfx);

  const cells = useMemo(() => generateBoard(SVG_WIDTH / 2, SVG_HEIGHT / 2), []);

  const findPieceAtCell = (q: number, r: number) =>
    pieces.find((p) => p.q === q && p.r === r);

  const HEX_DIRECTIONS = [
    { dq: 1, dr: 0 },
    { dq: -1, dr: 0 },
    { dq: 0, dr: 1 },
    { dq: 0, dr: -1 },
    { dq: 1, dr: -1 },
    { dq: -1, dr: 1 },
  ];

  const isValidHex = (q: number, r: number) => {
    return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
  };

  const hexDistance = (
    q1: number,
    r1: number,
    q2: number,
    r2: number,
  ): number => {
    return (
      (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - (q2 + r2))) /
      2
    );
  };

  const isInLineOfSight = (
    q1: number,
    r1: number,
    q2: number,
    r2: number,
  ): boolean => {
    const dq = q2 - q1;
    const dr = r2 - r1;
    const ds = -dq - dr;
    return dq === 0 || dr === 0 || ds === 0;
  };

  const isPathClear = (
    q1: number,
    r1: number,
    q2: number,
    r2: number,
  ): boolean => {
    const distance = hexDistance(q1, r1, q2, r2);
    if (distance <= 1) return true;

    const dq = q2 - q1;
    const dr = r2 - r1;
    const stepQ = dq / distance;
    const stepR = dr / distance;

    for (let i = 1; i < distance; i++) {
      const checkQ = q1 + stepQ * i;
      const checkR = r1 + stepR * i;
      if (pieces.some((p) => p.q === checkQ && p.r === checkR)) {
        return false;
      }
    }
    return true;
  };

  // Helper pour Rôdeuse (Scénario 6)
  const isAdjacentToEnemy = (
    q: number,
    r: number,
    ownerIndex: number,
  ): boolean => {
    return pieces.some(
      (p) => p.ownerIndex !== ownerIndex && hexDistance(q, r, p.q, p.r) === 1,
    );
  };

  // === SCÉNARIO 3: Pièces bloquées par Geôlier ===
  const blockedPieceIds = useMemo(() => {
    const blocked = new Set<string>();
    const jailers = pieces.filter((p) => p.characterId === "JAILER");

    jailers.forEach((jailer) => {
      pieces.forEach((piece) => {
        if (
          piece.ownerIndex !== jailer.ownerIndex &&
          areAdjacent(jailer.q, jailer.r, piece.q, piece.r)
        ) {
          blocked.add(piece.id);
        }
      });
    });

    return blocked;
  }, [pieces]);

  // === SCÉNARIO 3: Pièces protégées par Protecteur ===
  const protectedPieceIds = useMemo(() => {
    const shielded = new Set<string>();
    const protectors = pieces.filter((p) => p.characterId === "PROTECTOR");

    protectors.forEach((protector) => {
      shielded.add(protector.id);
      pieces.forEach((piece) => {
        if (
          piece.ownerIndex === protector.ownerIndex &&
          areAdjacent(protector.q, protector.r, piece.q, piece.r)
        ) {
          shielded.add(piece.id);
        }
      });
    });

    return shielded;
  }, [pieces]);

  // === MOUVEMENTS VALIDES (Scénarios 1, 6) ===
  const validMoves = useMemo(() => {
    if (!selectedPiece || selectedPiece.hasActed || phase !== "ACTIONS")
      return new Set<string>();

    const moves = new Set<string>();

    // SCÉNARIO 6: PROWLER_STEALTH - Téléportation sur toute case vide non-adjacente à un ennemi
    if (selectedPiece.characterId === "PROWLER") {
      cells.forEach((cell) => {
        // Case doit être vide
        if (findPieceAtCell(cell.q, cell.r)) return;
        // Case ne doit pas être adjacente à un ennemi
        if (isAdjacentToEnemy(cell.q, cell.r, selectedPiece.ownerIndex)) return;
        moves.add(`${cell.q},${cell.r}`);
      });
      return moves; // La Rôdeuse n'a que cette capacité de mouvement
    }

    // Mouvements adjacents normaux
    cells.forEach((cell) => {
      if (
        areAdjacent(selectedPiece.q, selectedPiece.r, cell.q, cell.r) &&
        !findPieceAtCell(cell.q, cell.r)
      ) {
        moves.add(`${cell.q},${cell.r}`);
      }
    });

    // SCÉNARIO 1: ACROBAT_JUMP
    if (selectedPiece.characterId === "ACROBAT") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const midQ = selectedPiece.q + dq;
        const midR = selectedPiece.r + dr;
        const destQ = selectedPiece.q + dq * 2;
        const destR = selectedPiece.r + dr * 2;

        if (
          isValidHex(midQ, midR) &&
          findPieceAtCell(midQ, midR) &&
          isValidHex(destQ, destR) &&
          !findPieceAtCell(destQ, destR)
        ) {
          moves.add(`${destQ},${destR}`);
        }
      });
    }

    // SCÉNARIO 1: CAVALRY_CHARGE
    if (selectedPiece.characterId === "CAVALRY") {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const midQ = selectedPiece.q + dq;
        const midR = selectedPiece.r + dr;
        const destQ = selectedPiece.q + dq * 2;
        const destR = selectedPiece.r + dr * 2;

        if (
          isValidHex(midQ, midR) &&
          !findPieceAtCell(midQ, midR) &&
          isValidHex(destQ, destR) &&
          !findPieceAtCell(destQ, destR)
        ) {
          moves.add(`${destQ},${destR}`);
        }
      });
    }

    return moves;
  }, [selectedPiece, pieces, phase, cells]);

  // === MOUVEMENTS SPÉCIAUX (Scénarios 1, 6) ===
  const abilityMoves = useMemo(() => {
    if (!selectedPiece || selectedPiece.hasActed || phase !== "ACTIONS")
      return new Set<string>();

    const moves = new Set<string>();

    // Rôdeuse: toutes ses cases sont des téléportations
    if (selectedPiece.characterId === "PROWLER") {
      return validMoves;
    }

    // Acrobate et Cavalier: sauts de 2 cases
    if (
      selectedPiece.characterId === "ACROBAT" ||
      selectedPiece.characterId === "CAVALRY"
    ) {
      HEX_DIRECTIONS.forEach(({ dq, dr }) => {
        const destQ = selectedPiece.q + dq * 2;
        const destR = selectedPiece.r + dr * 2;

        if (validMoves.has(`${destQ},${destR}`)) {
          moves.add(`${destQ},${destR}`);
        }
      });
    }

    return moves;
  }, [selectedPiece, validMoves, phase]);

  // === SCÉNARIO 2: ILLUSIONIST_SWAP - Cibles valides ===
  const illusionistTargets = useMemo(() => {
    if (
      !selectedPiece ||
      selectedPiece.characterId !== "ILLUSIONIST" ||
      selectedPiece.hasActed ||
      phase !== "ACTIONS"
    )
      return new Set<string>();

    const targets = new Set<string>();

    pieces.forEach((piece) => {
      if (piece.id === selectedPiece.id) return;
      if (!isInLineOfSight(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;
      const distance = hexDistance(
        selectedPiece.q,
        selectedPiece.r,
        piece.q,
        piece.r,
      );
      if (distance <= 1) return;
      if (!isPathClear(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;
      targets.add(piece.id);
    });

    return targets;
  }, [selectedPiece, pieces, phase]);

  // === SCÉNARIO 2: MANIPULATOR_MOVE - Cibles valides ===
  const manipulatorTargets = useMemo(() => {
    if (
      !selectedPiece ||
      selectedPiece.characterId !== "MANIPULATOR" ||
      selectedPiece.hasActed ||
      phase !== "ACTIONS"
    )
      return new Set<string>();

    const targets = new Set<string>();

    pieces.forEach((piece) => {
      if (piece.ownerIndex === selectedPiece.ownerIndex) return; // Ennemis seulement
      if (!isInLineOfSight(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;
      const distance = hexDistance(
        selectedPiece.q,
        selectedPiece.r,
        piece.q,
        piece.r,
      );
      if (distance <= 1) return;
      if (!isPathClear(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;
      targets.add(piece.id);
    });

    return targets;
  }, [selectedPiece, pieces, phase]);

  // === SCÉNARIO 2: MANIPULATOR - Destinations ===
  const manipulatorDestinations = useMemo(() => {
    if (!manipulatorTarget) return new Set<string>();

    const destinations = new Set<string>();

    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const destQ = manipulatorTarget.q + dq;
      const destR = manipulatorTarget.r + dr;

      if (isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) {
        destinations.add(`${destQ},${destR}`);
      }
    });

    return destinations;
  }, [manipulatorTarget, pieces]);

  // === SCÉNARIO 4: BRAWLER_PUSH - Cibles valides (ennemis adjacents) ===
  const brawlerTargets = useMemo(() => {
    if (
      !selectedPiece ||
      selectedPiece.characterId !== "BRAWLER" ||
      selectedPiece.hasActed ||
      phase !== "ACTIONS"
    )
      return new Set<string>();

    const targets = new Set<string>();

    pieces.forEach((piece) => {
      if (piece.ownerIndex === selectedPiece.ownerIndex) return; // Ennemis seulement
      if (!areAdjacent(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return; // Adjacents seulement
      targets.add(piece.id);
    });

    return targets;
  }, [selectedPiece, pieces, phase]);

  // === SCÉNARIO 4: BRAWLER - Destinations (3 cases opposées) ===
  const brawlerDestinations = useMemo(() => {
    if (!brawlerTarget || !selectedPiece) return new Set<string>();

    const destinations = new Set<string>();

    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const destQ = brawlerTarget.q + dq;
      const destR = brawlerTarget.r + dr;

      // Doit être valide, libre, et à distance 2 du Cogneur (case opposée)
      if (
        isValidHex(destQ, destR) &&
        !findPieceAtCell(destQ, destR) &&
        hexDistance(selectedPiece.q, selectedPiece.r, destQ, destR) === 2
      ) {
        destinations.add(`${destQ},${destR}`);
      }
    });

    return destinations;
  }, [brawlerTarget, selectedPiece, pieces]);

  // === SCÉNARIO 4: GRAPPLE_HOOK - Cibles valides ===
  const grapplerTargets = useMemo(() => {
    if (
      !selectedPiece ||
      selectedPiece.characterId !== "GRAPPLER" ||
      selectedPiece.hasActed ||
      phase !== "ACTIONS"
    )
      return new Set<string>();

    const targets = new Set<string>();

    pieces.forEach((piece) => {
      if (piece.id === selectedPiece.id) return;
      if (!isInLineOfSight(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;

      const distance = hexDistance(
        selectedPiece.q,
        selectedPiece.r,
        piece.q,
        piece.r,
      );
      if (distance <= 1) return; // Non-adjacent
      if (!isPathClear(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;

      // Calculer la direction
      const dq = piece.q - selectedPiece.q;
      const dr = piece.r - selectedPiece.r;

      let dirQ = 0,
        dirR = 0;
      if (dq === 0) {
        dirQ = 0;
        dirR = Math.sign(dr);
      } else if (dr === 0) {
        dirQ = Math.sign(dq);
        dirR = 0;
      } else {
        dirQ = Math.sign(dq);
        dirR = Math.sign(dr);
      }

      // Pour PULL: case adjacente au Grappler doit être libre
      const pullDestQ = selectedPiece.q + dirQ;
      const pullDestR = selectedPiece.r + dirR;
      const canPull =
        isValidHex(pullDestQ, pullDestR) &&
        !findPieceAtCell(pullDestQ, pullDestR);

      // Pour MOVE: case adjacente à la cible doit être libre
      const moveDestQ = piece.q - dirQ;
      const moveDestR = piece.r - dirR;
      const canMove =
        isValidHex(moveDestQ, moveDestR) &&
        !findPieceAtCell(moveDestQ, moveDestR);

      if (canPull || canMove) {
        targets.add(piece.id);
      }
    });

    return targets;
  }, [selectedPiece, pieces, phase]);

  // === SCÉNARIO 4: GRAPPLER MOVE - Destinations ===
  const grapplerMoveDestinations = useMemo(() => {
    if (!grapplerTarget || !selectedPiece || grapplerMode !== "MOVE")
      return new Set<string>();

    const destinations = new Set<string>();

    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const destQ = grapplerTarget.q + dq;
      const destR = grapplerTarget.r + dr;

      if (isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) {
        destinations.add(`${destQ},${destR}`);
      }
    });

    return destinations;
  }, [grapplerTarget, selectedPiece, grapplerMode, pieces]);

  // === SCÉNARIO 6: INNKEEPER_ASSIST - Cibles valides (alliés adjacents) ===
  const innkeeperTargets = useMemo(() => {
    if (
      !selectedPiece ||
      selectedPiece.characterId !== "INNKEEPER" ||
      selectedPiece.hasActed ||
      phase !== "ACTIONS"
    )
      return new Set<string>();

    const targets = new Set<string>();

    pieces.forEach((piece) => {
      // Uniquement les ALLIÉS (même joueur)
      if (piece.ownerIndex !== selectedPiece.ownerIndex) return;
      // Pas le Tavernier lui-même
      if (piece.id === selectedPiece.id) return;
      // Uniquement les adjacents
      if (!areAdjacent(selectedPiece.q, selectedPiece.r, piece.q, piece.r))
        return;
      targets.add(piece.id);
    });

    return targets;
  }, [selectedPiece, pieces, phase]);

  // === SCÉNARIO 6: INNKEEPER - Destinations ===
  const innkeeperDestinations = useMemo(() => {
    if (!innkeeperTarget) return new Set<string>();

    const destinations = new Set<string>();

    HEX_DIRECTIONS.forEach(({ dq, dr }) => {
      const destQ = innkeeperTarget.q + dq;
      const destR = innkeeperTarget.r + dr;

      if (isValidHex(destQ, destR) && !findPieceAtCell(destQ, destR)) {
        destinations.add(`${destQ},${destR}`);
      }
    });

    return destinations;
  }, [innkeeperTarget, pieces]);

  // === HANDLERS ===

  const handlePieceSelect = (piece: PieceFrontend) => {
    // SCÉNARIO 5: La Némésis ne peut jamais être sélectionnée
    if (piece.characterId === "NEMESIS") return;

    if (
      piece.ownerIndex !== currentPlayer ||
      phase !== "ACTIONS" ||
      piece.hasActed
    )
      return;

    if (piece && selectedPiece?.id !== piece.id) {
      playPawnSelectSfx();
    }

    // Reset tous les targets si on change de pièce
    if (selectedPiece?.id !== piece.id) {
      if (onManipulatorTargetSelect) onManipulatorTargetSelect(null);
      if (onBrawlerTargetSelect) onBrawlerTargetSelect(null);
      if (onGrapplerTargetSelect) onGrapplerTargetSelect(null);
      if (onGrapplerModeSelect) onGrapplerModeSelect(null);
      if (onInnkeeperTargetSelect) onInnkeeperTargetSelect(null);
    }

    onSelectPiece(selectedPiece?.id === piece.id ? null : piece);
  };

  const handleCellClick = (cell: HexCell) => {
    // Mode placement (recrutement)
    if (placementMode && onPlacementConfirm) {
      const isAvailable = availablePlacementCells.some(
        (c) => c.q === cell.q && c.r === cell.r,
      );
      if (isAvailable) {
        playBoardPlacementSfx();
        onPlacementConfirm(cell.q, cell.r);
        return;
      }
    }

    // SCÉNARIO 2: Destination pour Manipulatrice
    if (
      manipulatorTarget &&
      manipulatorDestinations.has(`${cell.q},${cell.r}`) &&
      onAbilityUse
    ) {
      playBoardPlacementSfx();
      onAbilityUse("MANIPULATOR_MOVE", manipulatorTarget.id, {
        q: cell.q,
        r: cell.r,
      });
      if (onManipulatorTargetSelect) onManipulatorTargetSelect(null);
      return;
    }

    // SCÉNARIO 4: Destination pour Cogneur
    if (
      brawlerTarget &&
      brawlerDestinations.has(`${cell.q},${cell.r}`) &&
      onAbilityUse
    ) {
      playBoardPlacementSfx();
      onAbilityUse("BRAWLER_PUSH", brawlerTarget.id, { q: cell.q, r: cell.r });
      if (onBrawlerTargetSelect) onBrawlerTargetSelect(null);
      return;
    }

    // SCÉNARIO 4: Destination pour Lance-Grappin (mode MOVE)
    if (
      grapplerTarget &&
      grapplerMode === "MOVE" &&
      grapplerMoveDestinations.has(`${cell.q},${cell.r}`) &&
      onAbilityUse
    ) {
      playBoardPlacementSfx();
      onAbilityUse("GRAPPLE_HOOK", grapplerTarget.id, { q: cell.q, r: cell.r });
      if (onGrapplerTargetSelect) onGrapplerTargetSelect(null);
      if (onGrapplerModeSelect) onGrapplerModeSelect(null);
      return;
    }

    // SCÉNARIO 6: Destination pour Tavernier
    if (
      innkeeperTarget &&
      innkeeperDestinations.has(`${cell.q},${cell.r}`) &&
      onAbilityUse
    ) {
      playBoardPlacementSfx();
      onAbilityUse("INNKEEPER_ASSIST", innkeeperTarget.id, {
        q: cell.q,
        r: cell.r,
      });
      if (onInnkeeperTargetSelect) onInnkeeperTargetSelect(null);
      return;
    }

    // Mouvement normal (ou téléportation Rôdeuse)
    if (selectedPiece && validMoves.has(`${cell.q},${cell.r}`)) {
      playBoardPlacementSfx();
      onMove(selectedPiece.id, cell.q, cell.r);
      onSelectPiece(null);
    } else {
      // Reset tout
      onSelectPiece(null);
      if (onManipulatorTargetSelect) onManipulatorTargetSelect(null);
      if (onBrawlerTargetSelect) onBrawlerTargetSelect(null);
      if (onGrapplerTargetSelect) onGrapplerTargetSelect(null);
      if (onGrapplerModeSelect) onGrapplerModeSelect(null);
      if (onInnkeeperTargetSelect) onInnkeeperTargetSelect(null);
    }
  };

  // Handlers pour les capacités ciblées
  const handleIllusionistTargetClick = (targetPiece: PieceFrontend) => {
    if (onAbilityUse && selectedPiece) {
      playBoardPlacementSfx();
      onAbilityUse("ILLUSIONIST_SWAP", targetPiece.id);
    }
  };

  const handleManipulatorTargetClick = (targetPiece: PieceFrontend) => {
    if (onManipulatorTargetSelect) {
      playPawnSelectSfx();
      onManipulatorTargetSelect(targetPiece);
    }
  };

  const handleBrawlerTargetClick = (targetPiece: PieceFrontend) => {
    if (onBrawlerTargetSelect) {
      playPawnSelectSfx();
      onBrawlerTargetSelect(targetPiece);
    }
  };

  const handleGrapplerTargetClick = (targetPiece: PieceFrontend) => {
    if (onGrapplerTargetSelect) {
      playPawnSelectSfx();
      onGrapplerTargetSelect(targetPiece);
    }
  };

  const handleInnkeeperTargetClick = (targetPiece: PieceFrontend) => {
    if (onInnkeeperTargetSelect) {
      playPawnSelectSfx();
      onInnkeeperTargetSelect(targetPiece);
    }
  };

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      className="drop-shadow-2xl overflow-visible"
    >
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
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-ability" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-brawler" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-grappler" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="glow-innkeeper"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-prowler" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hexagons */}
      {cells.map((cell) => {
        const isValid = validMoves.has(`${cell.q},${cell.r}`);
        const isAbility = abilityMoves.has(`${cell.q},${cell.r}`);
        const isHovered =
          hoveredCell?.q === cell.q && hoveredCell?.r === cell.r;
        const isPlacementCell =
          placementMode &&
          availablePlacementCells.some((c) => c.q === cell.q && c.r === cell.r);
        const isManipulatorDest = manipulatorDestinations.has(
          `${cell.q},${cell.r}`,
        );
        const isBrawlerDest = brawlerDestinations.has(`${cell.q},${cell.r}`);
        const isGrapplerDest = grapplerMoveDestinations.has(
          `${cell.q},${cell.r}`,
        );
        const isInnkeeperDest = innkeeperDestinations.has(
          `${cell.q},${cell.r}`,
        );
        const isProwlerTeleport =
          selectedPiece?.characterId === "PROWLER" && isValid;

        const pieceOnCell = findPieceAtCell(cell.q, cell.r);
        const isCurrentPlayerPiece =
          pieceOnCell && pieceOnCell.ownerIndex === currentPlayer;
        const canAct =
          isCurrentPlayerPiece && !pieceOnCell.hasActed && phase === "ACTIONS";

        const playerHighlightColor =
          currentPlayer === 0 ? COLORS.player1 : COLORS.player2;
        const playerHighlightFill =
          currentPlayer === 0
            ? "rgba(0, 245, 255, 0.1)"
            : "rgba(239, 68, 68, 0.1)";

        // Déterminer le style de la case
        let fillColor = COLORS.cellFill;
        let strokeColor = COLORS.cellStroke;
        let strokeWidth = 1;
        let filterUrl: string | undefined = undefined;
        let shouldPulse = false;

        if (isPlacementCell) {
          fillColor = "rgba(251, 191, 36, 0.2)";
          strokeColor = "#fbbf24";
          strokeWidth = 3;
          filterUrl = "url(#glow-amber)";
          shouldPulse = true;
        } else if (isBrawlerDest) {
          fillColor = "rgba(249, 115, 22, 0.3)";
          strokeColor = "#f97316";
          strokeWidth = 3;
          filterUrl = "url(#glow-brawler)";
          shouldPulse = true;
        } else if (isGrapplerDest) {
          fillColor = "rgba(6, 182, 212, 0.3)";
          strokeColor = "#06b6d4";
          strokeWidth = 3;
          filterUrl = "url(#glow-grappler)";
          shouldPulse = true;
        } else if (isInnkeeperDest) {
          fillColor = "rgba(234, 179, 8, 0.3)";
          strokeColor = "#eab308";
          strokeWidth = 3;
          filterUrl = "url(#glow-innkeeper)";
          shouldPulse = true;
        } else if (isManipulatorDest) {
          fillColor = "rgba(168, 85, 247, 0.3)";
          strokeColor = "#a855f7";
          strokeWidth = 3;
          filterUrl = "url(#glow-ability)";
          shouldPulse = true;
        } else if (isProwlerTeleport) {
          fillColor = "rgba(34, 197, 94, 0.25)";
          strokeColor = "#22c55e";
          strokeWidth = 2;
          filterUrl = "url(#glow-prowler)";
        } else if (isAbility) {
          fillColor = "rgba(168, 85, 247, 0.25)";
          strokeColor = "#a855f7";
          strokeWidth = 3;
          filterUrl = "url(#glow-ability)";
        } else if (isValid) {
          fillColor = "rgba(0, 245, 255, 0.15)";
          strokeColor = COLORS.validMove;
          strokeWidth = 2;
        } else if (canAct) {
          fillColor = playerHighlightFill;
          strokeColor = playerHighlightColor;
          strokeWidth = 2.5;
          filterUrl = `url(#glow-player${currentPlayer + 1})`;
        } else if (isHovered) {
          fillColor = COLORS.cellHover;
          strokeColor = "#00f5ff";
        }

        return (
          <polygon
            key={`${cell.q}-${cell.r}`}
            points={getHexagonPoints(cell.x, cell.y, HEX_SIZE * 0.93)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter={filterUrl}
            onMouseEnter={() => setHoveredCell(cell)}
            onMouseLeave={() => setHoveredCell(null)}
            onClick={() => handleCellClick(cell)}
            className={`transition-colors duration-200 cursor-pointer ${shouldPulse ? "animate-pulse" : ""}`}
          />
        );
      })}

      {/* Pieces */}
      {pieces.map((piece) => {
        const cell = cells.find((c) => c.q === piece.q && c.r === piece.r);
        if (!cell) return null;

        const isBlocked = blockedPieceIds.has(piece.id);
        const isProtected = protectedPieceIds.has(piece.id);

        // Vérifier si cette pièce est une cible valide pour une capacité
        const isIllusionistTarget = illusionistTargets.has(piece.id);
        const isManipulatorTargetValid = manipulatorTargets.has(piece.id);
        const isBrawlerTargetValid = brawlerTargets.has(piece.id);
        const isGrapplerTargetValid = grapplerTargets.has(piece.id);
        const isInnkeeperTargetValid = innkeeperTargets.has(piece.id);

        const isSelectedBrawlerTarget = brawlerTarget?.id === piece.id;
        const isSelectedManipulatorTarget = manipulatorTarget?.id === piece.id;
        const isSelectedGrapplerTarget = grapplerTarget?.id === piece.id;
        const isSelectedInnkeeperTarget = innkeeperTarget?.id === piece.id;

        const isAbilityTarget =
          isIllusionistTarget ||
          isManipulatorTargetValid ||
          isBrawlerTargetValid ||
          isGrapplerTargetValid ||
          isInnkeeperTargetValid;

        // Couleur selon le type de cible
        let targetColor = "#a855f7"; // Violet par défaut (Illusionniste, Manipulatrice)
        if (isBrawlerTargetValid) targetColor = "#f97316"; // Orange pour Cogneur
        if (isGrapplerTargetValid) targetColor = "#06b6d4"; // Cyan pour Lance-Grappin
        if (isInnkeeperTargetValid) targetColor = "#eab308"; // Jaune pour Tavernier (alliés)

        // Déterminer le handler approprié
        let abilityHandler: (() => void) | undefined;
        if (isIllusionistTarget)
          abilityHandler = () => handleIllusionistTargetClick(piece);
        else if (isManipulatorTargetValid)
          abilityHandler = () => handleManipulatorTargetClick(piece);
        else if (isBrawlerTargetValid)
          abilityHandler = () => handleBrawlerTargetClick(piece);
        else if (isGrapplerTargetValid)
          abilityHandler = () => handleGrapplerTargetClick(piece);
        else if (isInnkeeperTargetValid)
          abilityHandler = () => handleInnkeeperTargetClick(piece);

        const isSelected =
          selectedPiece?.id === piece.id ||
          isSelectedBrawlerTarget ||
          isSelectedManipulatorTarget ||
          isSelectedGrapplerTarget ||
          isSelectedInnkeeperTarget;

        return (
          <PieceComponent
            key={piece.id}
            piece={piece}
            x={cell.x}
            y={cell.y}
            isSelected={isSelected}
            isBlocked={isBlocked}
            isProtected={isProtected}
            isAbilityTarget={isAbilityTarget}
            targetColor={targetColor}
            onSelect={handlePieceSelect}
            onAbilityTargetClick={abilityHandler}
          />
        );
      })}
    </svg>
  );
}
