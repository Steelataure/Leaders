import { useState, useCallback } from "react";
import HexBoard from "../components/HexBoard";
import River, { type CharacterCard } from "../components/River";
import VictoryScreen from "../components/VictoryScreen";

import useSound from 'use-sound';
import buttonClickSfx from '../sounds/buttonClick.mp3';
import buttonHoverSfx from '../sounds/buttonHover.mp3';

// === TYPES ===
type GamePhase = "ACTIONS" | "RECRUITMENT";

interface Piece {
  id: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActed: boolean;
}

// === DONNÉES INITIALES (MOCKS) ===
const INITIAL_PIECES: Piece[] = [
  {
    id: "p1",
    characterId: "LEADER",
    ownerIndex: 0,
    q: 0,
    r: 2,
    hasActed: false,
  },
  {
    id: "p2",
    characterId: "LEADER",
    ownerIndex: 1,
    q: 0,
    r: -2,
    hasActed: false,
  },
  {
    id: "p3",
    characterId: "ARCHER",
    ownerIndex: 0,
    q: 1,
    r: 1,
    hasActed: false,
  },
  {
    id: "p4",
    characterId: "CAVALIER",
    ownerIndex: 1,
    q: -1,
    r: -1,
    hasActed: false,
  },
];

const INITIAL_RIVER: CharacterCard[] = [
  {
    id: "card-1",
    characterId: "COGNEUR",
    name: "Cogneur",
    description: "Pousse un ennemi adjacent vers l'opposé",
    type: "ACTIVE",
  },
  {
    id: "card-2",
    characterId: "RODEUR",
    name: "Rôdeuse",
    description: "Se déplace sur une case non-adjacente à un ennemi",
    type: "ACTIVE",
  },
  {
    id: "card-3",
    characterId: "ILLUSIONISTE",
    name: "Illusionniste",
    description: "Échange de position avec un personnage visible",
    type: "ACTIVE",
  },
];

const DECK_CARDS: CharacterCard[] = [
  {
    id: "card-4",
    characterId: "MANIPULATRICE",
    name: "Manipulatrice",
    description: "Déplace un ennemi visible d'une case",
    type: "ACTIVE",
  },
  {
    id: "card-5",
    characterId: "TAVERNIER",
    name: "Tavernier",
    description: "Déplace un allié adjacent d'une case",
    type: "ACTIVE",
  },
  {
    id: "card-6",
    characterId: "GEOLIER",
    name: "Geôlier",
    description: "Les ennemis adjacents ne peuvent pas agir",
    type: "PASSIVE",
  },
  {
    id: "card-7",
    characterId: "PROTECTEUR",
    name: "Protecteur",
    description: "Les ennemis ne peuvent pas déplacer ses alliés",
    type: "PASSIVE",
  },
  {
    id: "card-8",
    characterId: "ASSASSIN",
    name: "Assassin",
    description: "Capture le Leader seul sans allié",
    type: "PASSIVE",
  },
];

export default function Game({ onBackToLobby }: { onBackToLobby: () => void }) {
  // === ÉTAT DU JEU ===
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<GamePhase>("ACTIONS");
  const [turnNumber, setTurnNumber] = useState(1);
  const [river, setRiver] = useState<CharacterCard[]>(INITIAL_RIVER);
  const [deck, setDeck] = useState<CharacterCard[]>(DECK_CARDS);
  const [victory, setVictory] = useState<{
    winner: 0 | 1;
    type: "CAPTURE" | "ENCIRCLEMENT";
  } | null>(null);

  // === LOGIC : Fin de tour ===
  const endTurn = useCallback(() => {
    const nextPlayer = currentPlayer === 0 ? 1 : 0;
    setCurrentPlayer(nextPlayer);
    setPhase("ACTIONS");
    if (nextPlayer === 0) setTurnNumber((t) => t + 1);
    // Reset de l'état "a déjà joué" pour le prochain joueur
    setPieces((prev) => prev.map((p) => ({ ...p, hasActed: false })));
  }, [currentPlayer]);

  // === LOGIC : Passer son tour (Action ou Recrutement) ===
  const handlePass = useCallback(() => {
    if (phase === "ACTIONS") {
      setPhase("RECRUITMENT");
    } else {
      endTurn();
    }
    playButtonClickSfx();
  }, [phase, endTurn]);

  // === LOGIC : Vérification auto de la phase ===
  const checkPhaseTransition = useCallback(
    (updatedPieces: Piece[]) => {
      const playerPieces = updatedPieces.filter(
        (p) => p.ownerIndex === currentPlayer,
      );
      const allPlayed = playerPieces.every((p) => p.hasActed);
      if (allPlayed) {
        setPhase("RECRUITMENT");
      }
    },
    [currentPlayer],
  );

  // === LOGIC : Déplacement d'une pièce ===
  const handleMove = useCallback(
    (pieceId: string, toQ: number, toR: number) => {
      setPieces((prev) => {
        const updated = prev.map((p) =>
          p.id === pieceId ? { ...p, q: toQ, r: toR, hasActed: true } : p,
        );
        checkPhaseTransition(updated);
        return updated;
      });
    },
    [checkPhaseTransition],
  );

  // === LOGIC : Recrutement ===
  const handleRecruit = useCallback(
    (cardId: string) => {
      const playerPieceCount = pieces.filter(
        (p) => p.ownerIndex === currentPlayer,
      ).length;
      if (playerPieceCount >= 5) {
        console.log("Limite de 5 pièces atteinte");
        endTurn();
        return;
      }

      const card = river.find((c) => c.id === cardId);
      if (!card) return;

      // Définition simplifiée des cases de recrutement (Mock)
      const recruitmentCells =
        currentPlayer === 0
          ? [
              { q: -3, r: 2 },
              { q: -2, r: 3 },
              { q: -3, r: 3 },
            ]
          : [
              { q: 3, r: -2 },
              { q: 2, r: -3 },
              { q: 3, r: -3 },
            ];

      const freeCell = recruitmentCells.find(
        (cell) => !pieces.find((p) => p.q === cell.q && p.r === cell.r),
      );

      if (!freeCell) {
        console.log("Zones de recrutement occupées");
        endTurn();
        return;
      }

      // Ajout de la nouvelle pièce sur le plateau
      const newPiece: Piece = {
        id: `recruited-${Date.now()}`,
        characterId: card.characterId,
        ownerIndex: currentPlayer,
        q: freeCell.q,
        r: freeCell.r,
        hasActed: true, // Une unité recrutée ne peut pas agir le même tour
      };

      setPieces((prev) => [...prev, newPiece]);

      // Remplacement de la carte dans la rivière par une carte du deck
      const newDeck = [...deck];
      const replacement = newDeck.shift();
      setDeck(newDeck);
      setRiver((prev) =>
        prev.map((c) => (c.id === cardId && replacement ? replacement : c)),
      );

      endTurn(); // Le recrutement finit le tour du joueur
    },
    [pieces, river, deck, currentPlayer, endTurn],
  );

  // === RESET GAME ===
  const resetGame = () => {
    setPieces(INITIAL_PIECES);
    setCurrentPlayer(0);
    setPhase("ACTIONS");
    setTurnNumber(1);
    setRiver(INITIAL_RIVER);
    setDeck(DECK_CARDS);
    setVictory(null);
  };

  // Sons
  const [playButtonClickSfx] = useSound(buttonClickSfx);
  const [playButtonHoverSfx] = useSound(buttonHoverSfx);

  // Affichage de l'écran de victoire si déclenché
  if (victory) {
    return (
      <VictoryScreen
        winner={victory.winner}
        victoryType={victory.type}
        onPlayAgain={resetGame}
        onBackToLobby={onBackToLobby}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* 1. Plateau de jeu principal */}
      <HexBoard
        pieces={pieces}
        currentPlayer={currentPlayer}
        phase={phase}
        turnNumber={turnNumber}
        onMove={handleMove}
      />

      {/* 2. Barre d'actions tactiques et Debug */}
      <div className="flex items-center gap-6 mt-6 mb-2">
        <button
          onClick={handlePass}
          onMouseEnter={() => playButtonHoverSfx()}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all font-black uppercase tracking-tighter"
        >
          {phase === "ACTIONS"
            ? "⏭️ Passer les actions"
            : "⏭️ Passer le recrutement"}
        </button>

        {/* Console de Debug - Indispensable pour les tests de capture */}
        <div className="flex gap-2 p-2 bg-slate-900/50 rounded-2xl border border-white/5">
          <button
            onClick={() => setVictory({ winner: 0, type: "CAPTURE" })}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg border border-red-900/30 transition-all text-[10px] font-bold uppercase"
          >
            Win P1 (Cap)
          </button>
          <button
            onClick={() => setVictory({ winner: 1, type: "ENCIRCLEMENT" })}
            className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg border border-red-900/30 transition-all text-[10px] font-bold uppercase"
          >
            Win P2 (Enc)
          </button>
        </div>
      </div>

      {/* 3. La Rivière (Recrutement) */}
      <div className="w-full max-w-5xl mt-6">
        <River cards={river} phase={phase} onRecruit={handleRecruit} />
      </div>

      {/* Fond décoratif (Cyber-Ambient) */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
