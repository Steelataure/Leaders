const BASE_URL = "http://localhost:8085/api";

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

// Récupère les pièces d'une partie
export async function getPieces(gameId: string): Promise<Piece[]> {
  const res = await fetch(`${BASE_URL}/pieces?gameId=${gameId}`);
  return res.json();
}

// Récupère les cases valides pour une pièce
export async function getValidMoves(pieceId: string): Promise<HexCoord[]> {
  const res = await fetch(`${BASE_URL}/pieces/${pieceId}/valid-moves`);
  return res.json();
}

// Déplace une pièce
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
  return res.json();
}
