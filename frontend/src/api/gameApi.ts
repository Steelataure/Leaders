export const API_BASE_URL = "/api";
const BASE_URL = "/api";

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
  userId: string;
  username?: string;
  playerIndex: number;
}

export interface RecruitmentCard {
  id: string;
  characterId: string;
  state: "VISIBLE" | "IN_DECK" | "RECRUITED" | "BANNED";
  visibleSlot: number | null;
}

export interface Game {
  id: string;
  gameId?: string; // fallback
  status: "WAITING" | "IN_PROGRESS" | "FINISHED_CAPTURE" | "FINISHED" | string;
  currentPhase: "BANISHMENT" | "ACTION" | "RECRUITMENT" | "SETUP" | "RECRUIT";
  currentPlayerIndex: number;
  turnNumber: number;
  winnerPlayerIndex: number | null;
  winnerVictoryType: "CAPTURE" | "ENCIRCLEMENT" | null;
  hasRecruitedThisTurn: boolean;
  pieces: Piece[];
  river: RecruitmentCard[];
  players: Player[];
  remainingTimeP0: number;
  remainingTimeP1: number;
  lastTimerUpdate?: string;
  mode?: string;
}

// Frontend specific types
export interface PieceFrontend extends Omit<Piece, "hasActedThisTurn"> {
  hasActed: boolean;
}

export type GamePhase = "SETUP" | "ACTIONS" | "RECRUITMENT";

export interface GameFrontend extends Omit<Game, "pieces" | "currentPhase"> {
  pieces: PieceFrontend[];
  phase: GamePhase;
}

export interface Session {
  id: string;
  status: "WAITING_FOR_PLAYER" | "ACTIVE" | "FINISHED";
  private: boolean;
  code?: string;
  player1?: any;
  player2?: any;
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
  0: "🎲 MODE MASTERS - Toutes les cartes",
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
    RECRUITMENT: "RECRUITMENT",
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
 * Crée ou récupère une partie (matchmaking ou scénario).
 */
export async function createGame(gameIdOrScenarioId?: string | number, forcedDeckInput?: string[]): Promise<string> {
  let forcedDeck = forcedDeckInput;
  let gameId: string | undefined = undefined;

  if (typeof gameIdOrScenarioId === "number") {
    forcedDeck = SCENARIO_DECKS[gameIdOrScenarioId] || undefined;
  } else if (typeof gameIdOrScenarioId === "string") {
    gameId = gameIdOrScenarioId;
  }

  const res = await fetch(`${BASE_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, forcedDeck }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create or join game");
  }
  return res.json(); // Retourne l'UUID de la partie
}

export async function getGame(gameId: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${gameId}`);
  if (!res.ok) throw new Error("Failed to get game state");
  return res.json();
}

/** Alias for getGame used in feature branch */
export const getGameState = getGame;

export async function endTurn(gameId: string): Promise<Game> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/end-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to end turn");
  return res.json();
}

export async function recruitCharacter(
  gameId: string,
  cardId: string,
  placements: HexCoord[]
): Promise<void> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/recruit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, placements }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to recruit character: ${errorText}`);
  }
}

// --- Pieces API ---

export async function getPieces(gameId: string): Promise<Piece[]> {
  const res = await fetch(`${BASE_URL}/pieces?gameId=${gameId}`);
  if (!res.ok) throw new Error("Failed to get pieces");
  return res.json();
}

export async function getValidMoves(pieceId: string): Promise<HexCoord[]> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/valid-moves`);
  if (!res.ok) throw new Error("Failed to get valid moves");
  return res.json();
}

export async function movePiece(
  pieceId: string,
  toQ: number,
  toR: number,
  playerId?: string
): Promise<Piece> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toQ, toR, playerId }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to move piece: ${errorText}`);
  }

  return res.json();
}

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
    throw new Error(`Failed to use ability: ${errorText}`);
  }
}

/** Legacy alias if needed */
export const performAction = useAbility;


// --- Session API ---

export async function joinPublicQueue(playerId: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/matchmaking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) throw new Error("Failed to join matchmaking");
  return res.json();
}

export async function cancelSearch(playerId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/sessions/matchmaking/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) throw new Error("Failed to cancel search");
}

export async function createPrivateSession(playerId?: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/private`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
  if (!res.ok) throw new Error("Failed to create private session");
  return res.json();
}

export async function joinPrivateSession(code: string, playerId?: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/private/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, playerId }),
  });
  if (!res.ok) throw new Error("Failed to join private session");
  return res.json();
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to get session");
  return res.json();
}

export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/leave?userId=${userId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to leave session");
}

/**
 * Object export for convenience of use in frontend components
 */
export const gameApi = {
  createGame,
  getGame,
  getGameState,
  endTurn,
  recruitCharacter,
  getPieces,
  getValidMoves,
  movePiece,
  useAbility,
  performAction,
  leaveSession,
  mapPieceToFrontend,
  mapGameToFrontend,
};