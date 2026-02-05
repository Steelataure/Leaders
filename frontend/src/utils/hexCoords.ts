/**
 * Utilitaires pour les coordonnées hexagonales - Version améliorée
 * Système de coordonnées axiales (q, r) pour hexagones flat-top
 * Jeu "Leaders" - Hackathon ESIEA
 */

// Taille des hexagones en pixels
export const HEX_SIZE = 44;

// Types de cellules sur le plateau
export const CellType = {
  EMPTY: "EMPTY",
  LEADER_SPAWN_P1: "LEADER_SPAWN_P1", // Case départ Leader Joueur 1 (gauche)
  LEADER_SPAWN_P2: "LEADER_SPAWN_P2", // Case départ Leader Joueur 2 (droite)
  RECRUITMENT_P1: "RECRUITMENT_P1", // Cases recrutement Joueur 1
  RECRUITMENT_P2: "RECRUITMENT_P2", // Cases recrutement Joueur 2
  CENTER: "CENTER", // Case centrale
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

// Type représentant une cellule hexagonale
export interface HexCell {
  q: number; // Coordonnée axiale q
  r: number; // Coordonnée axiale r
  x: number; // Position pixel x (centre)
  y: number; // Position pixel y (centre)
  type: CellType; // Type de la cellule
}

/**
 * Détermine le type d'une cellule selon ses coordonnées
 * Basé sur le plateau officiel de Leaders (flat-top, orientation horizontale)
 */
function getCellType(q: number, r: number): CellType {
  // Case centrale
  if (q === 0 && r === 0) return CellType.CENTER;

  // Cases de départ des Leaders (côtés gauche/droite du plateau)
  if (q === -3 && r === 0) return CellType.LEADER_SPAWN_P1; // Joueur 1 à gauche
  if (q === 3 && r === 0) return CellType.LEADER_SPAWN_P2;  // Joueur 2 à droite

  // Cases de recrutement Joueur 1 (côté gauche)
  const recruitP1 = [
    { q: -3, r: 1 },
    { q: -3, r: 2 },
    { q: -2, r: 2 },
    { q: -3, r: 3 },
  ];
  if (recruitP1.some((c) => c.q === q && c.r === r))
    return CellType.RECRUITMENT_P1;

  // Cases de recrutement Joueur 2 (côté droit)
  const recruitP2 = [
    { q: 3, r: -1 },
    { q: 3, r: -2 },
    { q: 2, r: -2 },
    { q: 3, r: -3 },
  ];
  if (recruitP2.some((c) => c.q === q && c.r === r))
    return CellType.RECRUITMENT_P2;

  return CellType.EMPTY;
}

/**
 * Convertit les coordonnées axiales (q, r) en pixels (x, y)
 * Formule pour hexagone flat-top (rotation 90° par rapport à pointy-top)
 */
export function axialToPixel(
  q: number,
  r: number,
  centerX: number = 0,
  centerY: number = 0,
): { x: number; y: number } {
  // Flat-top : x dépend de q, y dépend de q et r
  const x = HEX_SIZE * ((3 / 2) * q) + centerX;
  const y = HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r) + centerY;
  return { x, y };
}

/**
 * Génère les 37 cellules du plateau hexagonal (rayon 3)
 * Contraintes : |q| <= 3, |r| <= 3, |q + r| <= 3
 */
export function generateBoard(
  centerX: number = 0,
  centerY: number = 0,
): HexCell[] {
  const cells: HexCell[] = [];
  const radius = 3;

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) <= radius) {
        const { x, y } = axialToPixel(q, r, centerX, centerY);
        const type = getCellType(q, r);
        cells.push({ q, r, x, y, type });
      }
    }
  }

  return cells;
}

/**
 * Génère les points SVG pour un hexagone flat-top
 */
export function getHexagonPoints(
  cx: number,
  cy: number,
  size: number = HEX_SIZE,
): string {
  const points: string[] = [];

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i; // Flat-top : commence à 0°
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = cx + size * Math.cos(angleRad);
    const y = cy + size * Math.sin(angleRad);
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

/**
 * Vérifie si deux cellules sont adjacentes
 */
export function areAdjacent(
  q1: number,
  r1: number,
  q2: number,
  r2: number,
): boolean {
  const dq = q2 - q1;
  const dr = r2 - r1;
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, -1],
    [-1, 1],
  ];
  return directions.some(([dqDir, drDir]) => dq === dqDir && dr === drDir);
}

/**
 * Retourne les 6 cellules adjacentes
 */
export function getAdjacentCells(
  q: number,
  r: number,
): Array<{ q: number; r: number }> {
  return [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
  ];
}

/**
 * Vérifie si une coordonnée est valide sur le plateau
 */
export function isValidCell(q: number, r: number): boolean {
  return Math.abs(q) <= 3 && Math.abs(r) <= 3 && Math.abs(q + r) <= 3;
}
