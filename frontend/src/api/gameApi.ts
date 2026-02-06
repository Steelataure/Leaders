const BASE_URL = "http://localhost:8085/api";

// ============================================================================
// INTERFACES - Mapping des DTOs backend
// ============================================================================

export interface HexCoord {
  q: number;
  r: number;
}

export interface Piece {
  id: string;
  gameId: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActedThisTurn: boolean;
}

export interface Player {
  index: number;
  userId?: string;
}

export interface RecruitmentCard {
  id: string;
  characterId: string;
  state: "VISIBLE" | "IN_DECK" | "RECRUITED" | "BANNED";
  visibleSlot?: number;
}

export interface Game {
  id: string;
  mode: string;
  status: string;
  currentPhase: "SETUP" | "ACTION" | "RECRUIT";
  currentPlayerIndex: number;
  turnNumber: number;
  winnerPlayerIndex?: number;
  winnerVictoryType?: "CAPTURE" | "ENCIRCLEMENT";
  players: Player[];
  pieces: Piece[];
  river: RecruitmentCard[];
}

export interface PieceFrontend extends Omit<Piece, "hasActedThisTurn"> {
  hasActed: boolean;
}

export interface GameFrontend extends Omit<Game, "pieces" | "currentPhase"> {
  pieces: PieceFrontend[];
  phase: "SETUP" | "ACTIONS" | "RECRUITMENT";
}

// ============================================================================
// SCÉNARIOS - Decks prédéfinis (7 scénarios + Mode Masters)
// ============================================================================

export const SCENARIO_DECKS: Record<number, string[] | null> = {
  0: null,  // Mode Masters - tout mélangé
  1: ["ACROBAT", "CAVALRY"],           // + autres aléatoires
  2: ["ILLUSIONIST", "MANIPULATOR"],   // + autres aléatoires
  3: ["JAILER", "PROTECTOR"],          // + autres aléatoires
  4: ["BRAWLER", "GRAPPLER"],          // + autres aléatoires
  5: ["NEMESIS"],                      // + autres aléatoires
  6: ["PROWLER", "INNKEEPER"],         // + autres aléatoires
  7: ["ARCHER", "ASSASSIN"],           // + autres aléatoires
};

// Noms des scénarios pour l'UI
export const SCENARIO_NAMES: Record<number, string> = {
  0: "🎲 MODE MASTERS - Toutes les cartes", // 🆕
  1: "Acrobates & Cavaliers",
  2: "Illusionnistes",
  3: "Gardiens",
  4: "Cogneurs",
  5: "Némésis",
  6: "Rôdeurs",
  7: "Chasseurs",
};

// ============================================================================
// HELPERS - Mapping backend ↔ frontend
// ============================================================================

export function mapPieceToFrontend(piece: Piece): PieceFrontend {
  return {
    ...piece,
    hasActed: piece.hasActedThisTurn,
  };
}

export function mapGameToFrontend(game: Game): GameFrontend {
  const phaseMap: Record<string, "SETUP" | "ACTIONS" | "RECRUITMENT"> = {
    SETUP: "SETUP",
    ACTION: "ACTIONS",
    RECRUIT: "RECRUITMENT",
  };

  return {
    ...game,
    phase: phaseMap[game.currentPhase] || "SETUP",
    pieces: game.pieces.map(mapPieceToFrontend),
  };
}

// ============================================================================
// API FUNCTIONS - Endpoints backend
// ============================================================================

/**
 * Crée une nouvelle partie avec un scénario
 * @param scenarioId - ID du scénario (0 = Mode Masters, 1-7 = Scénarios standards)
 * @returns L'UUID de la partie créée
 */
export async function createGame(scenarioId: number): Promise<string> {
  const forcedDeck = SCENARIO_DECKS[scenarioId];

  // 🆕 Mode Masters (scenarioId = 0) : forcedDeck est null
  // Le backend mélangera TOUS les 16 personnages aléatoirement !

  const res = await fetch(`${BASE_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forcedDeck }), // null = toutes les cartes mélangées
  });

  if (!res.ok) {
    throw new Error(
      `Erreur lors de la création de la partie : ${res.statusText}`,
    );
  }

  const gameId = await res.json();
  return gameId;
}

/**
 * Récupère l'état complet d'une partie
 */
export async function getGameState(gameId: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${gameId}`);

  if (!res.ok) {
    throw new Error(
      `Erreur lors de la récupération de la partie : ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * Récupère les pièces d'une partie
 */
export async function getPieces(gameId: string): Promise<Piece[]> {
  const res = await fetch(`${BASE_URL}/pieces?gameId=${gameId}`);

  if (!res.ok) {
    throw new Error(
      `Erreur lors de la récupération des pièces : ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * Récupère les mouvements valides pour une pièce
 */
export async function getValidMoves(pieceId: string): Promise<HexCoord[]> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/valid-moves`);

  if (!res.ok) {
    throw new Error(
      `Erreur lors du calcul des mouvements valides : ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * Déplace une pièce
 */
export async function movePiece(
  pieceId: string,
  toQ: number,
  toR: number,
): Promise<Piece> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toQ, toR }),
  });

  if (!res.ok) {
    throw new Error(
      `Erreur lors du déplacement de la pièce : ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * Utilise l'aptitude d'une pièce
 */
export async function useAbility(
  gameId: string,
  sourceId: string,
  abilityId: string,
  targetId?: string,
  destination?: HexCoord,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceId,
      abilityId,
      targetId: targetId || null,
      destination: destination || null,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Erreur lors de l'utilisation de l'aptitude : ${res.statusText} - ${errorText}`,
    );
  }

  const bodyText = await res.text();
  if (bodyText && bodyText.trim().length > 0) {
    console.log("📦 Action - Réponse backend:", bodyText);
  }
}

/**
 * Recrute un personnage depuis la rivière
 */
export async function recruitCharacter(
  gameId: string,
  cardId: string,
  placements: HexCoord[],
): Promise<void> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/recruit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cardId,
      placements,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Erreur lors du recrutement : ${res.statusText} - ${errorText}`,
    );
  }

  const bodyText = await res.text();
  if (bodyText && bodyText.trim().length > 0) {
    console.log("📦 Recrutement - Réponse backend:", bodyText);
  }
}

/**
 * Termine le tour du joueur actuel
 */
export async function endTurn(gameId: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/end-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Erreur lors de la fin du tour : ${res.statusText}`);
  }

  return res.json();
}
