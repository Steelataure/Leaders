import { useState, useCallback, useEffect } from "react";
import HexBoard from "../components/HexBoard";
import { type CharacterCard } from "../components/River";
import VictoryScreen from "../components/VictoryScreen";

import useSound from 'use-sound';
import buttonClickSfx from '../sounds/buttonClick.mp3';
import buttonHoverSfx from '../sounds/buttonHover.mp3';
import characterSelectSfx from '../sounds/characterSelect.mp3';
import characterHoverSfx from '../sounds/characterHover.mp3';

import cogneurImg from '/image/cogneur.png';
import rodeuseImg from '/image/rodeuse.png';
import illusionisteImg from '/image/illusioniste.png';
import manipulatriceImg from '/image/manipulatrice.png';
import tavernierImg from '/image/tavernier.png';
import gardeImg from '/image/garderoyal.png';

// === TYPES ===
export type GamePhase = "ACTIONS" | "RECRUITMENT";

export interface Piece {
  id: string;
  characterId: string;
  ownerIndex: number;
  q: number;
  r: number;
  hasActed: boolean;
}

// === DONNÉES INITIALES (MOCKS) ===
const INITIAL_PIECES: Piece[] = [
  { id: "p1", characterId: "LEADER", ownerIndex: 0, q: 0, r: 2, hasActed: false },
  { id: "p2", characterId: "LEADER", ownerIndex: 1, q: 0, r: -2, hasActed: false },
  { id: "p3", characterId: "ARCHER", ownerIndex: 0, q: 1, r: 1, hasActed: false },
  { id: "p4", characterId: "CAVALIER", ownerIndex: 1, q: -1, r: -1, hasActed: false },
];

const INITIAL_RIVER: CharacterCard[] = [
  { id: "c1", characterId: "COGNEUR", name: "Cogneur", description: "Pousse un ennemi adjacent vers l'opposé", type: "ACTIVE" },
  { id: "c2", characterId: "RODEUR", name: "Rôdeuse", description: "Se déplace sur une case non-adjacente", type: "ACTIVE" },
  { id: "c3", characterId: "ILLUSIONISTE", name: "Illusionniste", description: "Échange de position avec un personnage", type: "ACTIVE" },
];

const DECK_CARDS: CharacterCard[] = [
  { id: "c5", characterId: "MANIPULATRICE", name: "Manipulatrice", description: "Déplace un ennemi visible d'une case", type: "ACTIVE" },
  { id: "c6", characterId: "TAVERNIER", name: "Tavernier", description: "Déplace un allié adjacent d'une case", type: "ACTIVE" },
  { id: "c7", characterId: "GARDE", name: "Garde Royal", description: "Protège le leader adjacent", type: "PASSIVE" }
];

// === MAPPING IMAGES ===
const CHARACTER_IMAGES: Record<string, string> = {
  COGNEUR: cogneurImg,
  RODEUR: rodeuseImg,
  ILLUSIONISTE: illusionisteImg,
  MANIPULATRICE: manipulatriceImg,
  TAVERNIER: tavernierImg,
  GARDE: gardeImg,
  ARCHER: rodeuseImg, // Placeholder
  CAVALIER: gardeImg, // Placeholder
  LEADER: gardeImg, // Placeholder
};

// === COMPOSANTS UI ===

// Carte de la rivière (Sidebar gauche)
function SidebarCard({ card, onClick, onMouseEnter, disabled }: { card: CharacterCard; onClick: () => void; onMouseEnter: () => void; disabled: boolean }) {
  const icons: Record<string, string> = { ACTIVE: "⚡", PASSIVE: "🛡️", SPECIAL: "✨" };
  const cost = 3; // Mock cost

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      className={`
        group relative p-3 rounded-xl border transition-all duration-300
        ${disabled
          ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
          : 'bg-slate-800/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] cursor-pointer'
        }
      `}
    >
      {/* Barre latérale colorée */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${card.type === 'ACTIVE' ? 'bg-amber-400' : 'bg-purple-400'}`} />

      <div className="pl-3">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative bg-slate-900/50">
              {CHARACTER_IMAGES[card.characterId] ? (
                <img src={CHARACTER_IMAGES[card.characterId]} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs">{icons[card.type]}</div>
              )}
            </div>
            <span className="text-white font-bold text-sm tracking-wide">{card.name}</span>
          </div>
          {/* Cost removed */}
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed group-hover:text-slate-400">
          {card.description}
        </p>
      </div>
    </div>
  );
}

export default function Game({ onBackToLobby }: { onBackToLobby: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<GamePhase>("ACTIONS");
  const [turnNumber, setTurnNumber] = useState(1);
  const [deck, setDeck] = useState<CharacterCard[]>(DECK_CARDS);
  const [river, setRiver] = useState<CharacterCard[]>(INITIAL_RIVER);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [victory, setVictory] = useState<{ winner: 0 | 1; type: "CAPTURE" | "ENCIRCLEMENT" } | null>(null);

  // Sons
  const [playButtonClickSfx] = useSound(buttonClickSfx);
  const [playButtonHoverSfx] = useSound(buttonHoverSfx);
  const [playCharacterHoverSfx] = useSound(characterHoverSfx);
  const [playCharacterSelectSfx] = useSound(characterSelectSfx);

  // === LOGIC ===
  const endTurn = useCallback(() => {
    const nextPlayer = currentPlayer === 0 ? 1 : 0;
    setCurrentPlayer(nextPlayer);
    setPhase("ACTIONS");
    if (nextPlayer === 0) setTurnNumber((t) => t + 1);
    setPieces((prev) => prev.map((p) => ({ ...p, hasActed: false })));
    setSelectedPiece(null);
  }, [currentPlayer]);

  const handlePass = useCallback(() => {
    // On ne peut passer manuellement que pendant la phase d'actions (pour finir le tour plus tôt si voulu, bien que l'UI actuelle ne le permette pas explicitement via ce bouton)
    // Le recrutement est obligatoire, donc on ne peut pas le passer.
    if (phase === "ACTIONS") {
      playButtonClickSfx();
      setPhase("RECRUITMENT");
    }
  }, [phase, playButtonClickSfx]);

  const checkPhaseTransition = useCallback((currentPieces: Piece[]) => {
    const playerPieces = currentPieces.filter((p) => p.ownerIndex === currentPlayer);
    if (playerPieces.every((p) => p.hasActed)) {
      setTimeout(() => setPhase("RECRUITMENT"), 500);
    }
  }, [currentPlayer]);

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

  const handleRecruit = useCallback(
    (cardId: string) => {
      const playerPieceCount = pieces.filter(
        (p) => p.ownerIndex === currentPlayer,
      ).length;
      if (playerPieceCount >= 6) { // Limit to 6 to be safe (mock limit)
        console.log("Limite d'unités atteinte");
        // alert("Maximum d'unités atteint !"); // Avoid alert for better UX
        return;
      }

      if (phase !== "RECRUITMENT") return;

      const card = river.find((c) => c.id === cardId);
      if (!card) return;

      // Définition simplifiée des cases de recrutement (Mock)
      const recruitmentCells =
        currentPlayer === 0
          ? [{ q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 2 }, { q: -1, r: 3 }]
          : [{ q: 3, r: -3 }, { q: 2, r: -3 }, { q: 1, r: -2 }, { q: 1, r: -3 }];

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
      if (replacement) {
        setDeck(newDeck);
        setRiver((prev) =>
          prev.map((c) => (c.id === cardId ? replacement : c)),
        );
      } else {
        // Deck empty logic? Just remove from river or keep empty slot
        setRiver((prev) => prev.map(c => c.id === cardId ? { ...c, id: "empty", name: "Vide", type: "PASSIVE", description: "" } : c)); // Mock empty
      }

      playButtonClickSfx();
      endTurn(); // Le recrutement finit le tour du joueur
    },
    [pieces, river, deck, currentPlayer, endTurn, phase, playButtonClickSfx],
  );

  const resetGame = () => {
    setPieces(INITIAL_PIECES);
    setCurrentPlayer(0);
    setPhase("ACTIONS");
    setTurnNumber(1);
    setRiver(INITIAL_RIVER);
    setDeck(DECK_CARDS);
    setVictory(null);
  };

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
    <div className="h-screen w-screen bg-[#020617] text-white font-mono flex overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Background with Grid and Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-[#020617] to-[#020617] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      {/* Cyber UI Corners */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />

      {/* === HEADER === */}
      <div className="absolute top-0 left-0 right-0 h-24 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center gap-8 bg-slate-950/80 backdrop-blur-xl px-16 py-4 rounded-b-[2rem] border-x border-b border-cyan-500/20 shadow-[0_0_40px_rgba(0,245,255,0.15)] pointer-events-auto overflow-hidden group">
          {/* Header internal glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          <div className="flex items-center gap-4">
            <span className="text-2xl animate-spin-slow">💠</span>
            <h1
              className="font-cyber text-5xl font-bold italic tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 drop-shadow-[0_0_10px_rgba(0,245,255,0.4)]"
            >
              {phase === 'RECRUITMENT' ? 'RENFORTS' : 'COMBAT'}
            </h1>
          </div>

          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <span className="text-slate-500">TOUR <span className="text-cyan-50 text-base ml-1">{turnNumber}</span></span>
            <div className={`
              px-6 py-2 rounded-full border shadow-[0_0_15px_inset] transition-all duration-300
              ${currentPlayer === 0
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30 shadow-cyan-500/20'
                : 'border-rose-500 text-rose-400 bg-rose-950/30 shadow-rose-500/20'
              }
            `}>
              JOUEUR {currentPlayer + 1} EN LIGNE
            </div>
          </div>
        </div>
      </div>

      {/* Quit Button */}
      <button
        onClick={() => {
          onBackToLobby();
          playButtonClickSfx();
        }}
        onMouseEnter={() => playButtonHoverSfx()}
        className="absolute top-8 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-rose-950/20 text-rose-500 border border-rose-500/30 rounded-lg hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
      >
        <span>↪ QUITTER</span>
      </button>

      {/* === MAIN LAYOUT === */}
      <div className="flex-1 flex items-center justify-between px-10 pt-24 pb-10 w-full z-10 gap-10">

        {/* LEFT: RIVIÈRE */}
        <div className="w-80 h-full flex flex-col gap-5 animate-in slide-in-from-left duration-500 fade-in">
          {/* River Header */}
          <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(8,145,178,0.5)]">🌊</div>
              <div>
                <h2 className="font-cyber font-bold text-xl text-white tracking-wide">RIVIÈRE</h2>
                <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">Renforts Tactiques</p>
              </div>
            </div>

            <button
              disabled
              className={`relative w-full py-3 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all overflow-hidden cursor-default
                ${phase === "RECRUITMENT"
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse'
                  : 'bg-slate-800/50 text-slate-600 border border-slate-800'
                }
              `}
            >
              <div className="absolute inset-0 bg-cyan-500/5 translate-y-full transition-transform duration-300" />
              <span className="relative z-10">{phase === "RECRUITMENT" ? "⚠️ RECRUTEMENT REQUIS" : "🔒 RIVIÈRE VERROUILLÉE"}</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            {river.map((card) => (
              <SidebarCard
                key={card.id}
                card={card}
                onClick={() => {
                  handleRecruit(card.id);
                  playCharacterSelectSfx();
                }}
                onMouseEnter={playCharacterHoverSfx}
                disabled={phase !== "RECRUITMENT"}
              />
            ))}
          </div>
        </div>

        {/* CENTER: HEXBOARD */}
        <div className="flex-1 flex items-center justify-center relative z-0">
          {/* Holographic Base */}
          <div className="relative p-14 group">
            {/* Rotating Rings */}
            <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-8 border border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

            {/* Glow source */}
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />

            {/* Board Render */}
            <div className="relative scale-90 xl:scale-105 transition-transform duration-500 filter drop-shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <HexBoard
                pieces={pieces}
                currentPlayer={currentPlayer}
                phase={phase}
                turnNumber={turnNumber}
                onMove={handleMove}
                selectedPiece={selectedPiece}
                onSelectPiece={(pc) => {
                  setSelectedPiece(pc);
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: SCANNER */}
        <div className="w-80 h-72 animate-in slide-in-from-right duration-500 fade-in">
          <div className={`
             h-full w-full rounded-2xl border transition-all duration-300 relative overflow-hidden group bg-slate-900/40 backdrop-blur-sm
             ${selectedPiece
              ? 'border-amber-500/50 shadow-[0_0_30px_inset_rgba(245,158,11,0.1)]'
              : 'border-white/10 border-dashed hover:border-cyan-500/30'
            }
           `}>
            {/* Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/4 animate-[scan_2s_linear_infinite] opacity-30 pointer-events-none" />

            {selectedPiece ? (
              <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 mb-4 shadow-[0_0_25px_rgba(251,191,36,0.5)] relative bg-slate-900/80">
                  {CHARACTER_IMAGES[selectedPiece.characterId] ? (
                    <img src={CHARACTER_IMAGES[selectedPiece.characterId]} alt={selectedPiece.characterId} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-400 to-orange-600">
                      {selectedPiece.characterId === 'LEADER' ? '👑' : '⚔️'}
                    </div>
                  )}
                </div>
                <h3 className="font-cyber text-3xl font-bold text-amber-400 tracking-wider mb-2 drop-shadow-md">{selectedPiece.characterId}</h3>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-3" />

                <div className="text-xs font-mono space-y-1.5 uppercase tracking-wide">
                  <p className="text-slate-400">COORD : <span className="text-white font-bold ml-1">[{selectedPiece.q}, {selectedPiece.r}]</span></p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border overflow-hidden relative ${selectedPiece.hasActed ? "border-rose-500/30 text-rose-400" : "border-emerald-500/30 text-emerald-400"}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${selectedPiece.hasActed ? "bg-rose-500" : "bg-emerald-500"}`} />
                    {selectedPiece.hasActed ? "SYSTÈME : ÉPUISÉ" : "SYSTÈME : PRÊT"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 border border-dashed border-cyan-500/30 rounded-xl mb-6 flex items-center justify-center text-3xl text-cyan-500/30 animate-pulse">
                  ⌖
                </div>
                <p className="font-cyber text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs animate-pulse">ANALYSE MATRICE</p>
                <p className="text-slate-600 text-[10px] mt-2 uppercase tracking-widest">ATTENTE SÉLECTION CIBLE...</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Status */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <div className="flex justify-center items-center gap-6 opacity-60">
          <span className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <p className="font-cyber text-[10px] font-medium text-cyan-400 tracking-[0.4em] uppercase drop-shadow-[0_0_5px_rgba(0,245,255,0.8)]">
              CONNEXION SÉCURISÉE ÉTABLIE
            </p>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <span className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>
      </div>

      {/* Custom Styles Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');
        
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.6); }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(6,182,212,0.5); }
        
        .font-cyber { 
          font-family: 'Chakra Petch', sans-serif; 
          font-feature-settings: "smcp", "c2sc"; /* Small Caps simulation */
        }
      `}</style>
    </div>
  );
}