const BASE_URL = "/api";

// --- Interfaces ---

export interface Piece {
  id: string;
  gameId: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActedThisTurn: boolean;
}

export interface HexCoord {
  q: number;
  r: number;
}

export interface RecruitmentCard {
  id: string;
  characterId: string;
  state: "VISIBLE" | "IN_DECK" | "RECRUITED" | "BANNED";
  visibleSlot: number | null;
}

export interface GameState {
  gameId: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED_CAPTURE" | "FINISHED";
  currentPhase: "BANISHMENT" | "ACTION" | "RECRUITMENT";
  currentPlayerIndex: number;
  turnNumber: number;
  winnerPlayerIndex: number | null;
  winnerVictoryType: "CAPTURE" | "ENCIRCLEMENT" | null;
  pieces: Piece[];
  river: RecruitmentCard[];
}

export interface Session {
  id: string;
  status: "WAITING_FOR_PLAYER" | "ACTIVE" | "FINISHED";
  private: boolean;
  code?: string;
  player1?: any;
  player2?: any;
}

// --- Game API ---

/**
 * Crée ou récupère une partie.
 * Envoie gameId dans le corps de la requête pour correspondre au @RequestBody Java.
 */
export async function createGame(gameId?: string, forcedDeck?: string[]): Promise<string> {
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

export async function getGame(gameId: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${gameId}`);
  if (!res.ok) throw new Error("Failed to get game state");
  return res.json();
}

export async function endTurn(gameId: string): Promise<GameState> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/end-turn`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to end turn");
  return res.json();
}

export async function recruitCharacter(
  gameId: string,
  cardId: string,
  placements: { q: number; r: number }[]
): Promise<void> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/recruit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, placements }),
  });
  if (!res.ok) throw new Error("Failed to recruit character");
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
): Promise<Piece> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toQ, toR }),
  });
  if (!res.ok) throw new Error("Failed to move piece");
  return res.json();
}

export async function performAction(
  gameId: string,
  sourceId: string,
  abilityId: string,
  targetId?: string,
  destination?: { q: number; r: number }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceId, abilityId, targetId, destination }),
  });
  if (!res.ok) throw new Error("Failed to perform action");
}

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

export async function createPrivateSession(): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/private`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create private session");
  return res.json();
}

export async function joinPrivateSession(code: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/private/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error("Failed to join private session");
  return res.json();
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to get session");
  return res.json();
}